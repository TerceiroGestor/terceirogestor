"use client";

import { FormEngine } from "@/components/FormEngine/FormEngine";
import type { FamilyMemberFormData } from "@/features/family-members/domain/types";
import {
  familyMemberFormFields,
  familyMemberFormSteps,
} from "@/features/family-members/config/family-member-form-config";

type FamilyMemberFormProps = {
  initialValues?: Partial<FamilyMemberFormData>;
  onSubmit: (values: FamilyMemberFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function FamilyMemberForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: FamilyMemberFormProps) {
  return (
    <FormEngine
      fields={familyMemberFormFields}
      steps={familyMemberFormSteps}
      initialValues={initialValues}
      onSubmit={onSubmit}
      actions={{
        submit: { label: submitLabel, variant: "primary" },
        cancel: onCancel ? { label: "Cancelar", onClick: onCancel, variant: "ghost" } : undefined,
      }}
    />
  );
}
