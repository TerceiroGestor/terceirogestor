import type { FormField } from "@/components/FormEngine/types";
import type { PantryExitFormValues } from "@/modules/pantry/shared/domain/types";
import { todayLocalIsoDate } from "@/lib/date";
import { PANTRY_ITEM_UNIT } from "@/modules/pantry/shared/domain/pantry.constant";
import { PANTRY_NEW_SECTOR_VALUE } from "@/modules/pantry/features/items/config/pantry-item-form-config";

function todayIsoDate() {
  return todayLocalIsoDate();
}

export function buildPantryExitFormFields(params: {
  itemOptions: { label: string; value: string }[];
  sectorOptions: { label: string; value: string }[];
}): FormField<PantryExitFormValues>[] {
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
      helperText: "Escolha de onde o item está sendo retirado.",
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
      name: "exitDate",
      label: "Data da saída",
      type: "date",
      defaultValue: todayIsoDate(),
    },
    {
      name: "type",
      label: "Tipo",
      type: "select",
      required: true,
      options: [
        { label: "Atendidos", value: "ATTENDED" },
        { label: "Doações", value: "DONATION" },
        { label: "Eventos", value: "EVENT" },
        { label: "Festas", value: "PARTY" },
      ],
    },
    {
      name: "eventName",
      label: "Evento",
      type: "text",
      requiredWhen: (values) =>
        values.type === "EVENT" || values.type === "PARTY",
      helperText: "Obrigatório para Eventos e Festas.",
    },
    {
      name: "notes",
      label: "Observações",
      type: "textarea",
      helperText: "Opcional.",
      rows: 2,
    },
  ];
}
