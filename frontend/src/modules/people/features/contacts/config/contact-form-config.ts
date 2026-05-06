import type {
  ApiPersonContactRole,
  ApiPersonContactType,
} from "@/modules/people/api";
import type { FormField, FormStep } from "@/web-client/forms/types";

export type ContactFormValues = {
  role: ApiPersonContactRole;
  type: ApiPersonContactType;
  value: string;
  label?: string;
  name?: string;
  relationship?: string;
  notes?: string;
  isPrimary: boolean;
  isWhatsapp: boolean;
};

export const contactRoleOptions = [
  { label: "Pessoal", value: "SELF" },
  { label: "Responsável", value: "RESPONSIBLE" },
  { label: "Emergência", value: "EMERGENCY" },
] as const;

export const contactTypeOptions = [
  { label: "Telefone", value: "PHONE" },
  { label: "E-mail", value: "EMAIL" },
] as const;

export const contactFormFields: FormField<ContactFormValues>[] = [
  {
    name: "type",
    label: "Tipo",
    type: "select",
    options: contactTypeOptions.map((option) => ({ label: option.label, value: option.value })),
    required: true,
  },
  {
    name: "role",
    label: "Categoria",
    type: "select",
    options: contactRoleOptions.map((option) => ({ label: option.label, value: option.value })),
    required: true,
  },
  {
    name: "value",
    label: "Valor",
    type: "text",
    required: true,
    helperText: "Informe telefone ou e-mail.",
  },
  {
    name: "label",
    label: "Rótulo",
    type: "text",
    placeholder: "Ex.: Trabalho, Recados...",
  },
  {
    name: "name",
    label: "Nome do contato",
    type: "text",
    visibleWhen: (values) => values.role !== "SELF",
    requiredWhen: (values) => values.role !== "SELF",
  },
  {
    name: "relationship",
    label: "Parentesco",
    type: "text",
    placeholder: "Ex.: Mãe, Pai...",
  },
  {
    name: "isPrimary",
    label: "Contato principal",
    type: "boolean",
  },
  {
    name: "isWhatsapp",
    label: "WhatsApp",
    type: "boolean",
    visibleWhen: (values) => values.type === "PHONE",
  },
];

export const contactFormSteps: FormStep[] = [
  {
    title: "Contato",
    fields: [
      "type",
      "role",
      "value",
      "label",
      "name",
      "relationship",
      "isPrimary",
      "isWhatsapp",
    ],
  },
];
