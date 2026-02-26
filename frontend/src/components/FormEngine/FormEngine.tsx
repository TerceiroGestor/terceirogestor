"use client";

import * as React from "react";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getEmptyValue<TValues extends Record<string, unknown>>(
  field: FormField<TValues>,
) {
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

type FormEngineInnerProps<TValues extends Record<string, unknown>> =
  FormEngineProps<TValues> & {
    initialState: TValues;
  };

export function FormEngine<TValues extends Record<string, unknown>>(
  props: FormEngineProps<TValues>,
) {
  const initialState = React.useMemo(() => {
    const state: Record<string, unknown> = {};
    const initial = props.initialValues as Record<string, unknown> | undefined;

    props.fields.forEach((field) => {
      if (initial && field.name in initial) {
        state[field.name] = initial[field.name];
      } else if (field.defaultValue !== undefined) {
        state[field.name] = field.defaultValue;
      } else {
        state[field.name] = getEmptyValue(field);
      }
    });

    return state as TValues;
  }, [props.fields, props.initialValues]);

  const initialStateKey = React.useMemo(
    () => JSON.stringify(initialState),
    [initialState],
  );

  return (
    <FormEngineInner
      key={initialStateKey}
      {...props}
      initialState={initialState}
    />
  );
}

function FormEngineInner<TValues extends Record<string, unknown>>({
  id,
  fields,
  steps,
  initialState,
  onSubmit,
  onFieldChange,
  onValuesChange,
  disabled,
  actions,
}: FormEngineInnerProps<TValues>) {
  const [values, setValues] = React.useState<TValues>(initialState);
  const [currentStep, setCurrentStep] = React.useState(0);
  const notifyValuesChangeRef = React.useRef(false);

  React.useEffect(() => {
    if (!notifyValuesChangeRef.current) return;
    notifyValuesChangeRef.current = false;
    onValuesChange?.(values);
  }, [values, onValuesChange]);

  const handleChange = React.useCallback(
    (name: keyof TValues & string, value: unknown) => {
      notifyValuesChangeRef.current = true;
      setValues((prev) => {
        const next = { ...prev, [name]: value } as TValues;
        const patch = onFieldChange?.({
          name,
          value,
          prevValues: prev,
          nextValues: next,
        });
        if (patch && typeof patch === "object") {
          return { ...next, ...(patch as Partial<TValues>) } as TValues;
        }
        return next;
      });
    },
    [onFieldChange],
  );

  const isFieldRequired = React.useCallback(
    (field: FormField<TValues>) => {
      const conditional = field.requiredWhen?.(values) ?? false;
      return Boolean(field.required || conditional);
    },
    [values],
  );

  const isFieldFilled = React.useCallback(
    (field: FormField<TValues>, value: unknown) => {
      switch (field.type) {
        case "boolean":
          return value !== undefined && value !== null;
        case "multiselect":
        case "tags":
          return Array.isArray(value) && value.length > 0;
        case "date_range": {
          if (!isRecord(value)) return false;
          return Boolean(value["start"]) && Boolean(value["end"]);
        }
        case "number_range":
        case "currency_range": {
          if (!isRecord(value)) return false;
          const min = value["min"];
          const max = value["max"];
          return (
            min !== "" &&
            min !== undefined &&
            max !== "" &&
            max !== undefined
          );
        }
        case "file":
        case "image":
          return Boolean(value);
        default:
          return String(value ?? "").trim() !== "";
      }
    },
    [],
  );

  const isFieldVisible = React.useCallback(
    (field: FormField<TValues>) => {
      const hidden = field.hiddenWhen?.(values) ?? false;
      if (hidden) return false;
      const visible = field.visibleWhen?.(values);
      if (visible === undefined) return true;
      return Boolean(visible);
    },
    [values],
  );

  const visibleFields = React.useMemo(() => {
    if (!steps) return fields.filter(isFieldVisible);
    const step = steps[currentStep];
    return fields.filter(
      (field) => step.fields.includes(field.name) && isFieldVisible(field),
    );
  }, [fields, steps, currentStep, isFieldVisible]);

  const isCurrentStepValid = steps
    ? visibleFields.every((field) => {
        if (!isFieldRequired(field)) return true;
        return isFieldFilled(field, values[field.name]);
      })
    : true;

  const isFormValid = fields
    .filter(isFieldVisible)
    .every((field) => {
      if (!isFieldRequired(field)) return true;
      return isFieldFilled(field, values[field.name]);
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (steps && !isCurrentStepValid) return;
    if (!steps && !isFormValid) return;

    if (steps) {
      const isLastStep = currentStep === steps.length - 1;
      if (!isLastStep) {
        setCurrentStep((s) => s + 1);
        return;
      }
    }

    if (!isFormValid) return;
    onSubmit(values);
  };

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

  const stepStates = React.useMemo(() => {
    if (!steps) return [];

    const byName = new Map<string, FormField<TValues>>(
      fields.map((field) => [field.name, field]),
    );

    const resolveStepFields = (index: number) => {
      const step = steps[index];
      const list = step?.fields
        .map((name) => byName.get(name))
        .filter(Boolean) as FormField<TValues>[];
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
  }, [
    steps,
    fields,
    values,
    currentStep,
    isFieldVisible,
    isFieldRequired,
    isFieldFilled,
  ]);

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
