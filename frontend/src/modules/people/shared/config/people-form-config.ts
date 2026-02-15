import type { FormField, FormStep } from "@/components/FormEngine/types";
import type { PersonFormData } from "../domain/types";
import {
  GENDER_OPTIONS,
  GENDER_LABELS,
  PERSON_TYPE_OPTIONS,
  RACE_COLOR_OPTIONS,
  RACE_COLOR_LABELS,
  SEX_OPTIONS,
  SEX_LABELS,
  STATUS_OPTIONS,
} from "../domain/people.constants";

const buildOptions = (
  values: readonly string[],
  labels?: Record<string, string>,
) => values.map((value) => ({ label: labels?.[value] ?? value, value }));

export const personFormFields: FormField<PersonFormData>[] = [
  {
    name: "avatarUrl",
    label: "Foto do usuario",
    type: "image",
    defaultValue: "/avatar.jpg",
  },
  {
    name: "fullName",
    label: "Nome completo",
    type: "text",
    placeholder: "Nome completo",
    required: true,
  },
  {
    name: "socialName",
    label: "Nome social",
    type: "text",
    placeholder: "Nome social",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "email@exemplo.com",
  },
  {
    name: "phone",
    label: "Telefone",
    type: "phone",
    placeholder: "+55 (11) 99999-9999",
  },
  { name: "birthDate", label: "Data de nascimento", type: "date" },
  {
    name: "sex",
    label: "Sexo",
    type: "select",
    options: buildOptions(SEX_OPTIONS, SEX_LABELS),
  },
  {
    name: "personType",
    label: "Tipo de pessoa",
    type: "select",
    options: buildOptions(PERSON_TYPE_OPTIONS),
  },
  {
    name: "gender",
    label: "Genero",
    type: "select",
    options: buildOptions(GENDER_OPTIONS, GENDER_LABELS),
  },
  {
    name: "raceColor",
    label: "Raca/Cor",
    type: "select",
    options: buildOptions(RACE_COLOR_OPTIONS, RACE_COLOR_LABELS),
  },
  {
    name: "maritalStatus",
    label: "Estado civil",
    type: "select",
    options: [
      { label: "Solteiro(a)", value: "Solteiro(a)" },
      { label: "Casado(a)", value: "Casado(a)" },
      { label: "Divorciado(a)", value: "Divorciado(a)" },
      { label: "Viuvo(a)", value: "Viuvo(a)" },
    ],
  },
  { name: "nationality", label: "Nacionalidade", type: "text" },
  { name: "document", label: "CPF", type: "cpf" },
  { name: "rg", label: "RG", type: "text" },
  { name: "nis", label: "NIS", type: "text" },
  {
    name: "tags",
    label: "Tags",
    type: "tags",
    placeholder: "Digite uma tag e pressione Enter",
  },
  {
    name: "profileSummary",
    label: "Resumo dinamico",
    type: "richtext",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: buildOptions(STATUS_OPTIONS.filter((status) => status !== "Em analise")),
  },
  {
    name: "departureReason",
    label: "Motivo do desligamento",
    type: "textarea",
    placeholder: "Descreva o motivo do desligamento",
    requiredWhen: (values) => values.status === "Desligado",
  },
];

export const personFormSteps: FormStep[] = [
  {
    title: "Identificacao",
    fields: [
      "avatarUrl",
      "fullName",
      "socialName",
      "birthDate",
      "sex",
      "personType",
      "gender",
      "raceColor",
      "maritalStatus",
      "nationality",
    ],
  },
  {
    title: "Contato",
    fields: ["email", "phone"],
  },
  {
    title: "Documentos",
    fields: ["document", "rg", "nis"],
  },
  {
    title: "Organizacao",
    fields: ["tags", "status", "departureReason"],
  },
  {
    title: "Observacoes",
    fields: ["profileSummary"],
  },
];
