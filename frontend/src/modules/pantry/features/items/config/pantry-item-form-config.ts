import type { FormField } from "@/components/FormEngine/types";
import type { PantryItemFormValues } from "@/modules/pantry/shared/domain/types";

export const pantryItemFormFields: FormField<PantryItemFormValues>[] = [
  { name: "name", label: "Nome", type: "text", required: true },
  {
    name: "group",
    label: "Grupo",
    type: "text",
    helperText: "Opcional (ex.: Cereais, Proteínas).",
  },
  {
    name: "unit",
    label: "Unidade padrão",
    type: "text",
    required: true,
    helperText: "Ex.: kg, unidade, litro.",
  },
  {
    name: "minStock",
    label: "Estoque mínimo",
    type: "number",
    required: true,
    helperText: "Usado para alertas de reposição.",
  },
];
