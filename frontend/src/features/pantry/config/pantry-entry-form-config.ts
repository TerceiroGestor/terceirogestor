import type { FormField } from "@/components/FormEngine/types";
import type { PantryEntryFormValues } from "@/features/pantry/domain/types";
import { todayLocalIsoDate } from "@/lib/date";

function todayIsoDate() {
  return todayLocalIsoDate();
}

export function buildPantryEntryFormFields(params: {
  itemOptions: { label: string; value: string }[];
  donorOptions: { label: string; value: string }[];
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
      type: "text",
      required: true,
      helperText: "Ex.: Prateleira 1, Geladeira, Freezer, Armário.",
    },
    {
      name: "donorId",
      label: "Doador",
      type: "select",
      options: [{ label: "Sem doador", value: "none" }, ...params.donorOptions],
      helperText: "Opcional.",
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
      type: "text",
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
