"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FormEngineProps, FormField } from "./types";
import { FieldRenderer } from "./fieldRenderers";
import { Button } from "@/components/ui/button";
import {
  User,
  Wallet,
  CalendarRange,
  FileText,
  ClipboardList,
  LayoutGrid,
  Check,
} from "lucide-react";

export function FormEngine<T>({
  id,
  fields,
  steps,
  initialValues,
  onSubmit,
  onFieldChange,
  onValuesChange,
  disabled,
  actions,
}: FormEngineProps<T>) {
  /* ======================================================
   * INITIAL STATE
   * ====================================================== */

  const initialState = useMemo(() => {
    const state: any = {};

    fields.forEach((field) => {
      const key = field.name as keyof T;

      if (initialValues && key in initialValues) {
        state[key] = initialValues[key];
      } else if (field.defaultValue !== undefined) {
        state[key] = field.defaultValue;
      } else {
        state[key] = getEmptyValue(field);
      }
    });

    return state as T;
  }, [fields, initialValues]);

  const [values, setValues] = useState<T>(initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const notifyValuesChangeRef = useRef(false);
  const initialStateKey = useMemo(
    () => JSON.stringify(initialState),
    [initialState],
  );

  useEffect(() => {
    notifyValuesChangeRef.current = false;
    setValues(initialState);
    setCurrentStep(0);
  }, [initialStateKey]);

  useEffect(() => {
    if (!notifyValuesChangeRef.current) return;
    notifyValuesChangeRef.current = false;
    onValuesChange?.(values);
  }, [values, onValuesChange]);

  /* ======================================================
   * HELPERS
   * ====================================================== */

  function getEmptyValue(field: FormField<T>) {
    switch (field.type) {
      case "boolean":
        return false;
      case "multiselect":
        return [];
      case "tags":
        return [];
      case "date_range":
        return { start: "", end: "" };
      case "number_range":
      case "currency_range":
        return { min: "", max: "" };
      case "file":
      case "image":
        return null;
      default:
        return "";
    }
  }

  function handleChange(name: keyof T, value: any) {
    notifyValuesChangeRef.current = true;
    setValues((prev) => {
      const next = { ...prev, [name]: value } as T;
      const patch = onFieldChange?.({
        name: name as keyof T & string,
        value,
        prevValues: prev,
        nextValues: next,
      });
      if (patch && typeof patch === "object") {
        return { ...next, ...(patch as Partial<T>) } as T;
      }
      return next;
    });
  }

  function isFieldRequired(field: FormField<T>) {
    const conditional = field.requiredWhen?.(values) ?? false;
    return Boolean(field.required || conditional);
  }

  function isFieldFilled(field: FormField<T>, value: any) {
    switch (field.type) {
      case "boolean":
        return value !== undefined && value !== null;
      case "multiselect":
      case "tags":
        return Array.isArray(value) && value.length > 0;
      case "date_range":
        return Boolean(value?.start) && Boolean(value?.end);
      case "number_range":
      case "currency_range":
        return (
          value?.min !== "" &&
          value?.min !== undefined &&
          value?.max !== "" &&
          value?.max !== undefined
        );
      case "file":
      case "image":
        return Boolean(value);
      default:
        return String(value ?? "").trim() !== "";
    }
  }

  function isFieldVisible(field: FormField<T>) {
    const hidden = field.hiddenWhen?.(values) ?? false;
    if (hidden) return false;
    const visible = field.visibleWhen?.(values);
    if (visible === undefined) return true;
    return Boolean(visible);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (steps && !isCurrentStepValid) {
      return;
    }
    if (!steps && !isFormValid) {
      return;
    }

    if (steps) {
      const isLastStep = currentStep === steps.length - 1;

      if (!isLastStep) {
        setCurrentStep((s) => s + 1);
        return;
      }
    }

    if (!isFormValid) {
      return;
    }

    onSubmit(values);
  }

  /* ======================================================
   * STEPS RESOLUTION
   * ====================================================== */

  const visibleFields = useMemo(() => {
    if (!steps) return fields.filter(isFieldVisible);

    const step = steps[currentStep];
    return fields.filter(
      (field) => step.fields.includes(field.name) && isFieldVisible(field),
    );
  }, [fields, steps, currentStep, values]);

  const isCurrentStepValid = useMemo(() => {
    return visibleFields.every((field) => {
      if (!isFieldRequired(field)) return true;
      return isFieldFilled(field, values[field.name]);
    });
  }, [visibleFields, values]);

  const isFormValid = useMemo(() => {
    const visible = fields.filter(isFieldVisible);
    return visible.every((field) => {
      if (!isFieldRequired(field)) return true;
      return isFieldFilled(field, values[field.name]);
    });
  }, [fields, values]);

  function resolveButtonVariant(
    variant?: "primary" | "secondary" | "ghost" | "danger",
  ) {
    switch (variant) {
      case "secondary":
        return "secondary";
      case "ghost":
        return "ghost";
      case "danger":
        return "destructive";
      default:
        return "default";
    }
  }

  function resolveStepIcon(index: number) {
    const icons = [User, Wallet, CalendarRange, FileText, ClipboardList];
    return icons[index % icons.length] ?? LayoutGrid;
  }

  const stepStates = useMemo(() => {
    if (!steps) return [];

    const byName = new Map<string, FormField<T>>(
      fields.map((field) => [field.name, field]),
    );

    const resolveStepFields = (index: number) => {
      const step = steps[index];
      const list = step?.fields
        .map((name) => byName.get(name))
        .filter(Boolean) as FormField<T>[];
      return list.filter(isFieldVisible);
    };

    const isStepValid = (index: number) => {
      const list = resolveStepFields(index);
      return list.every((field) => {
        if (!isFieldRequired(field)) return true;
        return isFieldFilled(field, values[field.name]);
      });
    };

    return steps.map((step, index) => {
      const Icon = step.icon ?? resolveStepIcon(index);
      const active = index === currentStep;
      const complete = index < currentStep && isStepValid(index);
      const canGoTo =
        index <= currentStep ||
        Array.from({ length: index }, (_, i) => i).every((i) => isStepValid(i));

      return {
        id: String(index),
        title: step.title,
        description:
          typeof step.description === "string" ? step.description : undefined,
        Icon,
        active,
        complete,
        canGoTo,
      };
    });
  }, [steps, fields, values, currentStep]);

  /* ======================================================
   * RENDER
   * ====================================================== */

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
      {steps ? (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm">
          {/* STEPS */}
          <div className="rounded-t-xl border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-[220px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Etapa {currentStep + 1} de {stepStates.length}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {stepStates[currentStep]?.title}
                </p>
              </div>

              <div className="text-[11px] text-muted-foreground">
                {isCurrentStepValid
                  ? "Tudo certo para continuar"
                  : "Preencha os campos obrigatórios"}
              </div>
            </div>

            <div className="mt-3 overflow-x-auto pb-1">
              <div className="min-w-[520px]">
                <div className="relative pt-1">
                  <div className="absolute inset-x-0 top-6 h-[2px] rounded-full bg-border/60" />
                  <div
                    className="absolute left-0 top-6 h-[2px] rounded-full bg-primary transition-[width] duration-300"
                    style={{
                      width:
                        stepStates.length <= 1
                          ? "100%"
                          : `${Math.min(
                              100,
                              Math.max(
                                0,
                                (currentStep / (stepStates.length - 1)) * 100,
                              ),
                            )}%`,
                    }}
                  />

                  <div
                    className="grid items-start gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(stepStates.length, 1)}, minmax(120px, 1fr))`,
                    }}
                  >
                    {stepStates.map((step) => {
                      const iconClasses = step.complete
                        ? "bg-primary text-primary-foreground border-primary/30"
                        : step.active
                          ? "bg-background text-primary border-primary/40 ring-4 ring-primary/10"
                          : "bg-background text-muted-foreground border-border/70";

                      return (
                        <div
                          key={step.id}
                          className="flex flex-col items-center gap-2"
                        >
                          <button
                            type="button"
                            disabled={!step.canGoTo}
                            onClick={() => {
                              if (!step.canGoTo) return;
                              const index = Number(step.id);
                              if (!Number.isNaN(index)) setCurrentStep(index);
                            }}
                            aria-current={step.active ? "step" : undefined}
                            className="group flex flex-col items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                            title={step.title}
                          >
                            <span
                              className={[
                                "relative z-10 flex size-11 items-center justify-center rounded-full border shadow-sm transition-colors",
                                iconClasses,
                              ].join(" ")}
                            >
                              {step.complete ? (
                                <Check className="size-5" />
                              ) : (
                                <step.Icon className="size-5" />
                              )}
                            </span>
                            <span
                              className={[
                                "text-center text-[11px] font-semibold transition-colors",
                                step.active
                                  ? "text-foreground"
                                  : "text-muted-foreground group-hover:text-foreground",
                              ].join(" ")}
                            >
                              {step.title}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {steps[currentStep]?.description ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {steps[currentStep].description}
              </p>
            ) : null}
          </div>

          {/* FIELDS */}
          <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
            {visibleFields.map((field) => (
              <FieldRenderer
                key={field.name}
                field={field}
                value={values[field.name]}
                disabled={disabled}
                required={isFieldRequired(field)}
                onChange={(value) => handleChange(field.name, value)}
              />
            ))}

            {/* FOOTER */}
            <div className="border-t pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {actions?.cancel && (
                    <Button
                      type="button"
                      variant={resolveButtonVariant(
                        actions.cancel.variant ?? "ghost",
                      )}
                      onClick={actions.cancel.onClick}
                    >
                      {actions.cancel.label ?? "Cancelar"}
                    </Button>
                  )}
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCurrentStep((s) => s - 1)}
                    >
                      Voltar
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant={resolveButtonVariant(
                      currentStep < steps.length - 1
                        ? "secondary"
                        : (actions?.submit?.variant ?? "primary"),
                    )}
                    disabled={
                      !isCurrentStepValid ||
                      disabled ||
                      (currentStep === steps.length - 1 && !isFormValid)
                    }
                  >
                    {currentStep < steps.length - 1
                      ? "Próximo"
                      : (actions?.submit?.label ?? "Salvar")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* FORM SEM STEPS */
        <div className="space-y-5 rounded-lg border bg-card/70 p-6 shadow-sm">
          {visibleFields.map((field) => (
            <FieldRenderer
              key={field.name}
              field={field}
              value={values[field.name]}
              disabled={disabled}
              required={isFieldRequired(field)}
              onChange={(value) => handleChange(field.name, value)}
            />
          ))}

          {/* FOOTER */}
          <div className="border-t pt-4">
            {actions ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {actions.cancel && (
                  <Button
                    type="button"
                    variant={resolveButtonVariant(
                      actions.cancel.variant ?? "secondary",
                    )}
                    onClick={actions.cancel.onClick}
                  >
                    {actions.cancel.label ?? "Cancelar"}
                  </Button>
                )}

                {actions.submit && (
                  <Button
                    type="submit"
                    variant={resolveButtonVariant(
                      actions.submit.variant ?? "primary",
                    )}
                    disabled={!isFormValid || disabled}
                  >
                    {actions.submit.label ?? "Salvar"}
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </form>
  );
}
