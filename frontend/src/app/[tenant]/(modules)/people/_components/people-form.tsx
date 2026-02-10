"use client";

import { useMemo } from "react";
import { FormEngine } from "@/components/FormEngine/FormEngine";
import type { PersonFormData } from "../types";
import { personFormFields, personFormSteps } from "../people-form-config";

type PeopleFormProps = {
  initialValues?: Partial<PersonFormData>;
  onSubmit: (values: PersonFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
  tagSuggestions?: string[];
};

export function PeopleForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
  tagSuggestions,
}: PeopleFormProps) {
  const fields = useMemo(
    () =>
      personFormFields.map((field) =>
        field.name === "tags"
          ? { ...field, suggestions: tagSuggestions ?? [] }
          : field,
      ),
    [tagSuggestions],
  );

  return (
    <FormEngine
      fields={fields}
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
