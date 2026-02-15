"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FormEngineProps, FormField } from "./types";
import { FieldRenderer } from "./fieldRenderers";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Wallet,
  CalendarRange,
  FileText,
  ClipboardList,
  LayoutGrid,
} from "lucide-react";

export function FormEngine<T>({
  id,
  fields,
  steps,
  initialValues,
  onSubmit,
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
    setValues((prev) => ({ ...prev, [name]: value }));
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
        return value?.min !== "" && value?.min !== undefined && value?.max !== "" && value?.max !== undefined;
      case "file":
      case "image":
        return Boolean(value);
      default:
        return String(value ?? "").trim() !== "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("submit", { currentStep, steps });

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
    if (!steps) return fields;

    const step = steps[currentStep];
    return fields.filter((field) => step.fields.includes(field.name));
  }, [fields, steps, currentStep]);

  const isCurrentStepValid = useMemo(() => {
    return visibleFields.every((field) => {
      if (!isFieldRequired(field)) return true;
      return isFieldFilled(field, values[field.name]);
    });
  }, [visibleFields, values]);

  const isFormValid = useMemo(() => {
    return fields.every((field) => {
      if (!isFieldRequired(field)) return true;
      return isFieldFilled(field, values[field.name]);
    });
  }, [fields, values]);

  const stepItems = useMemo(() => {
    if (!steps) return [];

    return steps.map((step, index) => ({
      id: String(index),
      label: step.title,
      description: typeof step.description === "string" ? step.description : undefined,
    }));
  }, [steps]);

  const currentStepId = String(currentStep);

  function resolveButtonVariant(variant?: "primary" | "secondary" | "ghost" | "danger") {
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

  /* ======================================================
   * RENDER
   * ====================================================== */

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
      {/* STEPS */}
      {steps && (
        <div className="space-y-3">
          <Tabs
            value={currentStepId}
            onValueChange={(id) => {
              const index = Number(id);
              if (!Number.isNaN(index)) {
                setCurrentStep(index);
              }
            }}
          >
            <TabsList className="w-full">
              {stepItems.map((step, index) => {
                const Icon = resolveStepIcon(index);
                return (
                  <TabsTrigger
                    key={step.id}
                    value={step.id}
                    className="flex-1 justify-center gap-2 text-muted-foreground data-[state=active]:text-foreground"
                  >
                    <span className="bg-muted/70 text-muted-foreground flex size-7 items-center justify-center rounded-md border">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm font-medium">{step.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          {steps[currentStep]?.description && (
            <p className="text-muted-foreground text-sm">
              {steps[currentStep].description}
            </p>
          )}
        </div>
      )}

      {/* FIELDS */}
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
          {steps ? (
            /* FORM COM STEPS */
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {actions?.cancel && (
                  <Button
                    type="button"
                    variant={resolveButtonVariant(actions.cancel.variant ?? "ghost")}
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
                      : (actions?.submit?.variant ?? "primary")
                  )}
                  disabled={!isCurrentStepValid || disabled || (currentStep === steps.length - 1 && !isFormValid)}
                >
                  {currentStep < steps.length - 1
                    ? "Proximo"
                    : (actions?.submit?.label ?? "Salvar")}
                </Button>
              </div>
            </div>
          ) : (
            /* FORM SEM STEPS */
            actions && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {actions.cancel && (
                  <Button
                    type="button"
                    variant={resolveButtonVariant(actions.cancel.variant ?? "secondary")}
                    onClick={actions.cancel.onClick}
                  >
                    {actions.cancel.label ?? "Cancelar"}
                  </Button>
                )}

                {actions.submit && (
                  <Button
                    type="submit"
                    variant={resolveButtonVariant(actions.submit.variant ?? "primary")}
                    disabled={!isFormValid || disabled}
                  >
                    {actions.submit.label ?? "Salvar"}
                  </Button>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </form>
  );
}
