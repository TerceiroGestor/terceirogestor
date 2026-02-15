"use client";

import type { PersonFormData } from "../domain/types";
import { PeopleForm } from "./people-form";

type PeopleRelationsFormProps = {
  initialValues?: Partial<PersonFormData>;
  onSubmit: (values: PersonFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
  tagSuggestions?: string[];
};

export function PeopleRelationsForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  tagSuggestions,
}: PeopleRelationsFormProps) {
  return (
    <PeopleForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitLabel={submitLabel}
      tagSuggestions={tagSuggestions}
    />
  );
}
