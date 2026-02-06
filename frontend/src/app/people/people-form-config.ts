import type { FormField, FormStep } from "@/components/FormEngine/types";
import type { PersonFormData } from "./types";

const SEX_OPTIONS = [
  { label: "Masculino", value: "M" },
  { label: "Feminino", value: "F" },
  { label: "Intersexo", value: "I" },
  { label: "Nao informado", value: "N" },
];

const GENDER_OPTIONS = [
  { label: "Homem", value: "H" },
  { label: "Mulher", value: "M" },
  { label: "Nao-binario", value: "NB" },
  { label: "Genero fluido", value: "GF" },
  { label: "Agenero", value: "AG" },
  { label: "Outro", value: "O" },
  { label: "Prefiro nao informar", value: "PNI" },
];

const RACE_COLOR_OPTIONS = [
  { label: "Branca", value: "BR" },
  { label: "Preta", value: "PR" },
  { label: "Parda", value: "PA" },
  { label: "Amarela", value: "AM" },
  { label: "Indigena", value: "IN" },
  { label: "Prefiro nao informar", value: "PNI" },
];

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
    options: SEX_OPTIONS,
  },
  {
    name: "gender",
    label: "Genero",
    type: "select",
    options: GENDER_OPTIONS,
  },
  {
    name: "raceColor",
    label: "Raca/Cor",
    type: "select",
    options: RACE_COLOR_OPTIONS,
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
    options: [
      { label: "Ativo", value: "Ativo" },
      { label: "Em analise", value: "Em analise" },
      { label: "Inativo", value: "Inativo" },
      { label: "Desligado", value: "Desligado" },
    ],
  },
  {
    name: "departureReason",
    label: "Motivo do desligamento",
    type: "textarea",
    placeholder: "Descreva o motivo do desligamento",
    requiredWhen: (values) => values.status === "Desligado",
  },
  {
    name: "hasHealthIssue",
    label: "Existe alguma questao de saude?",
    type: "boolean",
    defaultValue: false,
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
    title: "Saude",
    fields: ["hasHealthIssue"],
  },
  {
    title: "Observacoes",
    fields: ["profileSummary"],
  },
];
