import type { FormField } from "@/components/FormEngine/types";
import type { PantryExitFormValues } from "@/features/pantry/domain/types";
import { todayLocalIsoDate } from "@/lib/date";

function todayIsoDate() {
  return todayLocalIsoDate();
}

export function buildPantryExitFormFields(params: {
  itemOptions: { label: string; value: string }[];
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
      type: "text",
      required: true,
      helperText: "Informe de onde o item está sendo retirado.",
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
