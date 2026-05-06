"use client";

import { RecordForm } from "@/web-client/forms";
import {
  healthConditionFormFields,
  healthConditionFormSteps,
  type HealthConditionFormValues,
} from "@/modules/people/features/health-conditions/config/health-condition-form-config";

type HealthConditionFormProps = {
  initialValues?: Partial<HealthConditionFormValues>;
  onSubmit: (values: HealthConditionFormValues) => void;
  onValuesChange?: (values: HealthConditionFormValues) => void;
  onFieldCommit?: (values: HealthConditionFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  hideActions?: boolean;
};

export function HealthConditionForm({
  initialValues,
  onSubmit,
  onValuesChange,
  onFieldCommit,
  onCancel,
  submitLabel = "Salvar",
  hideActions = false,
}: HealthConditionFormProps) {
  return (
    <RecordForm
      appearance="inline-detail"
      fields={healthConditionFormFields}
      steps={healthConditionFormSteps}
      initialValues={initialValues}
      onSubmit={onSubmit}
      onValuesChange={onValuesChange}
      onFieldCommit={({ values }) => onFieldCommit?.(values)}
      actions={
        hideActions
          ? undefined
          : {
              submit: { label: submitLabel, variant: "primary" },
              cancel: onCancel
                ? { label: "Cancelar", onClick: onCancel, variant: "ghost" }
                : undefined,
            }
      }
    />
  );
}

