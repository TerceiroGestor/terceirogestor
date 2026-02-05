import type { FormField, FormStep } from "@/components/FormEngine/types";
import type { PersonFormData } from "./types";

export const personFormFields: FormField<PersonFormData>[] = [
  { name: "avatar", label: "Foto do usuario", type: "image" },
  { name: "fullName", label: "Nome completo", type: "text", placeholder: "Nome completo" },
  { name: "socialName", label: "Nome social", type: "text", placeholder: "Nome social" },
  { name: "email", label: "Email", type: "email", placeholder: "email@exemplo.com" },
  { name: "phone", label: "Telefone", type: "phone", placeholder: "+55 (11) 99999-9999" },
  { name: "website", label: "Site", type: "url", placeholder: "https://site.com" },
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
  { name: "cpf", label: "CPF", type: "cpf" },
  { name: "rg", label: "RG", type: "text" },
  { name: "nis", label: "NIS", type: "text" },
  {
    name: "documentFront",
    label: "Documento (frente)",
    type: "file",
    accept: ".png,.jpg,.pdf",
  },
  {
    name: "documentBack",
    label: "Documento (verso)",
    type: "file",
    accept: ".png,.jpg,.pdf",
  },
  {
    name: "notes",
    label: "Observacoes",
    type: "textarea",
    placeholder: "Escreva observacoes relevantes",
  },
  {
    name: "profileSummary",
    label: "Resumo dinamico",
    type: "richtext",
  },
  { name: "favoriteColor", label: "Cor preferida", type: "color" },
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
    title: "Dados pessoais",
    fields: [
      "avatar",
      "fullName",
      "socialName",
      "email",
      "phone",
      "website",
      "birthDate",
      "gender",
      "maritalStatus",
      "nationality",
    ],
  },
  {
    title: "Documentos",
    fields: ["cpf", "rg", "nis", "documentFront", "documentBack"],
  },
  {
    title: "Observacoes",
    fields: ["notes", "profileSummary", "favoriteColor", "status"],
  },
];
