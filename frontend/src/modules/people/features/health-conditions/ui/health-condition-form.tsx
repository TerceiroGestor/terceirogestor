"use client";

import { FormEngine } from "@/components/FormEngine/FormEngine";
import type { FormField, FormStep } from "@/components/FormEngine/types";
import {
  healthConditionFormFields,
  healthConditionFormSteps,
  type HealthConditionFormValues,
} from "@/modules/people/features/health-conditions/config/health-condition-form-config";

type HealthConditionFormProps = {
  initialValues?: Partial<HealthConditionFormValues>;
  onSubmit: (values: HealthConditionFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  showRemoveDocument?: boolean;
};

export function HealthConditionForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
  showRemoveDocument = false,
}: HealthConditionFormProps) {
  const removeDocumentField: FormField<HealthConditionFormValues> = {
    name: "removeDocument",
    label: "Remover documento atual",
    type: "boolean",
    helperText: "Marque para excluir o documento salvo.",
  };

  const buildFields = () => {
    if (!showRemoveDocument) return healthConditionFormFields;
    const fields = [...healthConditionFormFields];
    const docIndex = fields.findIndex((field) => field.name === "documentFile");
    if (docIndex === -1) {
      fields.push(removeDocumentField);
      return fields;
    }
    fields.splice(docIndex + 1, 0, removeDocumentField);
    return fields;
  };

  const buildSteps = (): FormStep[] => {
    if (!showRemoveDocument) return healthConditionFormSteps;
    return healthConditionFormSteps.map((step) => ({
      ...step,
      fields: step.fields.flatMap((field) =>
        field === "documentFile"
          ? ["documentFile", "removeDocument"]
          : [field],
      ),
    }));
  };

  return (
    <FormEngine
      fields={buildFields()}
      steps={buildSteps()}
      initialValues={initialValues}
      onSubmit={onSubmit}
      actions={{
        submit: { label: submitLabel, variant: "primary" },
        cancel: onCancel
          ? { label: "Cancelar", onClick: onCancel, variant: "ghost" }
          : undefined,
      }}
    />
  );
}

