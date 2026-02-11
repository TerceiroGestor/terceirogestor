"use client";

import { FormEngine } from "@/components/FormEngine/FormEngine";
import type { FormField, FormStep } from "@/components/FormEngine/types";
import {
  medicationFormFields,
  medicationFormSteps,
  type MedicationFormValues,
} from "@/features/medications/config/medication-form-config";

type MedicationFormProps = {
  initialValues?: Partial<MedicationFormValues>;
  onSubmit: (values: MedicationFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  showRemoveDocument?: boolean;
  showRemovePermissionDocument?: boolean;
};

export function MedicationForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
  showRemoveDocument = false,
  showRemovePermissionDocument = false,
}: MedicationFormProps) {
  const removeDocumentField: FormField<MedicationFormValues> = {
    name: "removeDocument",
    label: "Remover documento atual",
    type: "boolean",
    helperText: "Marque para excluir o documento salvo.",
  };

  const removePermissionDocumentField: FormField<MedicationFormValues> = {
    name: "removePermissionDocument",
    label: "Remover autorizacao atual",
    type: "boolean",
    helperText: "Marque para excluir a autorizacao salva.",
  };

  const insertAfterField = (
    fields: FormField<MedicationFormValues>[],
    fieldName: string,
    field: FormField<MedicationFormValues>,
  ) => {
    const next = [...fields];
    const index = next.findIndex((item) => item.name === fieldName);
    if (index === -1) {
      next.push(field);
      return next;
    }
    next.splice(index + 1, 0, field);
    return next;
  };

  const buildFields = () => {
    let fields = medicationFormFields;
    if (showRemovePermissionDocument) {
      fields = insertAfterField(
        fields,
        "permissionDocumentFile",
        removePermissionDocumentField,
      );
    }
    if (showRemoveDocument) {
      fields = insertAfterField(fields, "documentFile", removeDocumentField);
    }
    return fields;
  };

  const buildSteps = (): FormStep[] => {
    if (!showRemoveDocument && !showRemovePermissionDocument) {
      return medicationFormSteps;
    }
    return medicationFormSteps.map((step) => ({
      ...step,
      fields: step.fields.flatMap((field) => {
        if (field === "permissionDocumentFile" && showRemovePermissionDocument) {
          return ["permissionDocumentFile", "removePermissionDocument"];
        }
        if (field === "documentFile" && showRemoveDocument) {
          return ["documentFile", "removeDocument"];
        }
        return [field];
      }),
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
