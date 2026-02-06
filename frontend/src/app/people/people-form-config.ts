import type { FormField, FormStep } from "@/components/FormEngine/types";
import type { PersonFormData } from "./types";

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
    name: "gender",
    label: "Genero",
    type: "select",
    options: [
      { label: "Feminino", value: "Feminino" },
      { label: "Masculino", value: "Masculino" },
      { label: "Outro", value: "Outro" },
    ],
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
    ],
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
      "gender",
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
    fields: ["document", "rg", "nis", "status"],
  },
  {
    title: "Observacoes",
    fields: ["profileSummary"],
  },
];
