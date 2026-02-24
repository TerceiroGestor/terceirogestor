import type { FormField } from "@/components/FormEngine/types";
import type { PantryItemFormValues } from "@/modules/pantry/shared/domain/types";
import {
  PANTRY_ITEM_UNIT,
  PANTRY_ITEM_GROUP,
} from "@/modules/pantry/shared/domain/pantry.constant";

export const PANTRY_NEW_SECTOR_VALUE = "__new_sector__" as const;

export function buildPantryItemFormFields(params: {
  sectorOptions: { label: string; value: string }[];
}): FormField<PantryItemFormValues>[] {
  return [
    { name: "name", label: "Nome", type: "text", required: true },
    {
      name: "group",
      label: "Grupo",
      type: "select",
      options: PANTRY_ITEM_GROUP.slice(),
      searchable: true,
      searchPlaceholder: "Buscar grupo...",
      helperText: "Opcional (ex.: Cereais, Proteínas).",
      required: true,
    },
    {
      name: "defaultSector",
      label: "Setor padrão",
      type: "select",
      required: true,
      options: [
        ...params.sectorOptions,
        { label: "Adicionar setor...", value: PANTRY_NEW_SECTOR_VALUE },
      ],
      helperText: "Onde este alimento fica armazenado (ex.: Geral, Estoque, Geladeira).",
    },
    {
      name: "newSector",
      label: "Novo setor",
      type: "text",
      requiredWhen: (values) => values.defaultSector === PANTRY_NEW_SECTOR_VALUE,
      visibleWhen: (values) => values.defaultSector === PANTRY_NEW_SECTOR_VALUE,
      helperText: "Digite o nome do setor e ele ficará disponível para toda a despensa.",
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
}


