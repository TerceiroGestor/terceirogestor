import type { FormField } from "@/components/FormEngine/types";
import type { PantryItemFormValues } from "@/modules/pantry/shared/domain/types";
import {
  PANTRY_ITEM_UNIT,
  PANTRY_ITEM_GROUP,
} from "@/modules/pantry/shared/domain/pantry.constant";

export const pantryItemFormFields: FormField<PantryItemFormValues>[] = [
  { name: "name", label: "Nome", type: "text", required: true },
  {
    name: "group",
    label: "Grupo",
    type: "select",
    options: PANTRY_ITEM_GROUP.slice(),
    helperText: "Opcional (ex.: Cereais, Proteínas).",
    required: true,
  },
  {
    name: "unit",
    label: "Unidade padrão",
    type: "select",
    options: PANTRY_ITEM_UNIT.slice(),
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
