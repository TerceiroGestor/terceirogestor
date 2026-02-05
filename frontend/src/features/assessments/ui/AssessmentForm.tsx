"use client";

import { FormEngine } from "@/components/FormEngine/FormEngine";
import type { AssessmentFormData } from "@/features/assessments/domain/types";
import {
  assessmentFormFields,
  assessmentFormSteps,
} from "@/features/assessments/config/assessment-form-config";

type AssessmentFormProps = {
  initialValues?: Partial<AssessmentFormData>;
  onSubmit: (values: AssessmentFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function AssessmentForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: AssessmentFormProps) {
  return (
    <FormEngine
      fields={assessmentFormFields}
      steps={assessmentFormSteps}
      initialValues={initialValues}
      onSubmit={onSubmit}
      actions={{
        submit: { label: submitLabel, variant: "primary" },
        cancel: onCancel ? { label: "Cancelar", onClick: onCancel, variant: "ghost" } : undefined,
      }}
    />
  );
}
