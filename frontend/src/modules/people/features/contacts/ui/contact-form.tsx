"use client";

import { RecordForm } from "@/web-client/forms";
import {
  contactFormFields,
  contactFormSteps,
  type ContactFormValues,
} from "@/modules/people/features/contacts/config/contact-form-config";

type ContactFormProps = {
  initialValues?: Partial<ContactFormValues>;
  onSubmit: (values: ContactFormValues) => void;
  onValuesChange?: (values: ContactFormValues) => void;
  onFieldCommit?: (values: ContactFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  hideActions?: boolean;
};

export function ContactForm({
  initialValues,
  onSubmit,
  onValuesChange,
  onFieldCommit,
  onCancel,
  submitLabel = "Salvar",
  hideActions = false,
}: ContactFormProps) {
  return (
    <RecordForm
      appearance="inline-detail"
      fields={contactFormFields}
      steps={contactFormSteps}
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
