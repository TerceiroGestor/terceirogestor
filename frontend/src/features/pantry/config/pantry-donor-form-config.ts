import type { FormField } from "@/components/FormEngine/types";
import type { PantryDonorFormValues } from "@/features/pantry/domain/types";

export const pantryDonorFormFields: FormField<PantryDonorFormValues>[] = [
  { name: "name", label: "Nome", type: "text", required: true },
  {
    name: "type",
    label: "Tipo",
    type: "select",
    required: true,
    options: [
      { label: "Pessoa", value: "PERSON" },
      { label: "Empresa", value: "COMPANY" },
    ],
  },
  {
    name: "contact",
    label: "Contato",
    type: "text",
    helperText: "Opcional (telefone, email, etc.).",
  },
];

