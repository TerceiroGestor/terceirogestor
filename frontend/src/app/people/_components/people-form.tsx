"use client";

import { FormEngine } from "@/components/FormEngine/FormEngine";
import type { PersonFormData } from "../types";
import { personFormFields, personFormSteps } from "../people-form-config";

type PeopleFormProps = {
  initialValues?: Partial<PersonFormData>;
  onSubmit: (values: PersonFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function PeopleForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: PeopleFormProps) {
  return (
    <FormEngine
      fields={personFormFields}
      steps={personFormSteps}
      initialValues={initialValues}
      onSubmit={onSubmit}
      actions={{
        submit: { label: submitLabel, variant: "primary" },
        cancel: onCancel ? { label: "Cancelar", onClick: onCancel, variant: "ghost" } : undefined,
      }}
    />
  );
}
