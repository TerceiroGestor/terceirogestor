import type { FormField } from "@/components/FormEngine/types";
import type { PantryEntryFormValues } from "@/modules/pantry/shared/domain/types";
import { todayLocalIsoDate } from "@/lib/date";
import { PANTRY_ITEM_UNIT } from "@/modules/pantry/shared/domain/pantry.constant";
import { PANTRY_NEW_SECTOR_VALUE } from "@/modules/pantry/features/items/config/pantry-item-form-config";

export const PANTRY_NEW_DONOR_VALUE = "__new_donor__" as const;

function todayIsoDate() {
  return todayLocalIsoDate();
}

export function buildPantryEntryFormFields(params: {
  itemOptions: { label: string; value: string }[];
  donorOptions: { label: string; value: string }[];
  sectorOptions: { label: string; value: string }[];
}): FormField<PantryEntryFormValues>[] {
  return [
    {
      name: "itemId",
      label: "Alimento",
      type: "select",
      required: true,
      options: params.itemOptions,
    },
    {
      name: "sector",
      label: "Setor (local físico)",
      type: "select",
      required: true,
      options: [
        ...params.sectorOptions,
        { label: "Adicionar setor...", value: PANTRY_NEW_SECTOR_VALUE },
      ],
      helperText: "Escolha o setor onde o lote será armazenado.",
    },
    {
      name: "newSector",
      label: "Novo setor",
      type: "text",
      requiredWhen: (values) => values.sector === PANTRY_NEW_SECTOR_VALUE,
      visibleWhen: (values) => values.sector === PANTRY_NEW_SECTOR_VALUE,
      helperText: "Digite o nome do setor e ele ficará disponível para toda a despensa.",
    },
    {
      name: "donorId",
      label: "Doador",
      type: "select",
      options: [
        { label: "Sem doador", value: "none" },
        ...params.donorOptions,
        { label: "Adicionar doador...", value: PANTRY_NEW_DONOR_VALUE },
      ],
      helperText: "Opcional.",
    },
    {
      name: "newDonorName",
      label: "Nome do doador",
      type: "text",
      requiredWhen: (values) => values.donorId === PANTRY_NEW_DONOR_VALUE,
      visibleWhen: (values) => values.donorId === PANTRY_NEW_DONOR_VALUE,
    },
    {
      name: "newDonorType",
      label: "Tipo do doador",
      type: "select",
      requiredWhen: (values) => values.donorId === PANTRY_NEW_DONOR_VALUE,
      visibleWhen: (values) => values.donorId === PANTRY_NEW_DONOR_VALUE,
      options: [
        { label: "Pessoa", value: "PERSON" },
        { label: "Empresa", value: "COMPANY" },
      ],
    },
    {
      name: "newDonorContact",
      label: "Contato do doador",
      type: "text",
      helperText: "Opcional (telefone, email, etc.).",
      visibleWhen: (values) => values.donorId === PANTRY_NEW_DONOR_VALUE,
    },
    {
      name: "quantity",
      label: "Quantidade",
      type: "number",
      required: true,
    },
    {
      name: "unit",
      label: "Unidade",
      type: "select",
      options: PANTRY_ITEM_UNIT.slice(),
      helperText: "Se vazio, usa a unidade padrão do alimento.",
    },
    {
      name: "entryDate",
      label: "Data da entrada",
      type: "date",
      defaultValue: todayIsoDate(),
    },
    {
      name: "expiryDate",
      label: "Validade",
      type: "date",
      helperText: "Opcional.",
    },
    {
      name: "notes",
      label: "Observações",
      type: "textarea",
      helperText: "Opcional (ex.: lote, condição).",
      rows: 2,
    },
  ];
}
