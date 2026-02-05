"use client";

import { FormEngine } from "../FormEngine";
import { FormField, FormStep } from "../types";

type PlaygroundFormData = {
  email: string;
  phone: string;
  url: string;
  name: string;
  age: number;
  cpf: string;
  money: number;
  numberRange: { min: number | ""; max: number | "" };
  currencyRange: { min: number | ""; max: number | "" };
  birthDate: string;
  period: { start: string; end: string };
  active: boolean;
  role: string;
  tags: string[];
  color: string;
  notes: string;
  attachment: File | null;
  attachments: File[];
  avatar: File | string | null;
  description: string;
};

export default function FormEnginePlaygroundV1() {
  /* ======================================================
   * FIELDS
   * ====================================================== */

  const fields: FormField<PlaygroundFormData>[] = [
    { name: "email", label: "Email", type: "email", placeholder: "voce@empresa.com" },
    { name: "phone", label: "Telefone", type: "phone", placeholder: "+55 (11) 99999-9999" },
    { name: "url", label: "Site", type: "url", placeholder: "https://empresa.com" },
    { name: "name", label: "Nome", type: "text", placeholder: "Digite o nome" },
    { name: "age", label: "Idade", type: "number" },
    { name: "cpf", label: "CPF", type: "cpf" },
    { name: "money", label: "Renda", type: "money" },
    {
      name: "numberRange",
      label: "Faixa numerica",
      type: "number_range",
      minPlaceholder: "Min",
      maxPlaceholder: "Max",
    },
    {
      name: "currencyRange",
      label: "Faixa de renda",
      type: "currency_range",
      minPlaceholder: "Min",
      maxPlaceholder: "Max",
    },
    { name: "birthDate", label: "Data de nascimento", type: "date" },
    {
      name: "period",
      label: "Periodo",
      type: "date_range",
      startPlaceholder: "Inicio",
      endPlaceholder: "Fim",
    },
    { name: "active", label: "Ativo", type: "boolean" },
    {
      name: "role",
      label: "Cargo",
      type: "select",
      options: [
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" },
      ],
    },
    {
      name: "tags",
      label: "Tags",
      type: "multiselect",
      options: [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ],
    },
    { name: "color", label: "Cor favorita", type: "color" },
    { name: "notes", label: "Observacoes", type: "textarea", placeholder: "Escreva algo" },
    { name: "avatar", label: "Foto do usuario", type: "image" },
    { name: "attachment", label: "Anexo", type: "file", accept: ".pdf,.png,.jpg" },
    {
      name: "attachments",
      label: "Anexos",
      type: "file",
      multiple: true,
      accept: ".pdf,.png,.jpg",
    },
    {
      name: "description",
      label: "Descricao",
      type: "richtext",
    },
  ];

  /* ======================================================
   * STEPS
   * ====================================================== */

  const steps: FormStep[] = [
    {
      title: "Cadastro",
      fields: ["email", "phone", "url", "name", "age", "cpf", "birthDate", "active"],
    },
    {
      title: "Financeiro",
      fields: ["money", "numberRange", "currencyRange", "role", "tags", "color"],
    },
    {
      title: "Arquivos",
      fields: ["avatar", "notes", "attachment", "attachments"],
    },
    {
      title: "Periodo",
      fields: ["period"],
    },
    {
      title: "Descricao",
      fields: ["description"],
    },
  ];

  /* ======================================================
   * EDIT MODE (mock)
   * ====================================================== */

  const initialValues: Partial<PlaygroundFormData> = {
    email: "joao.silva@empresa.com",
    phone: "+55 11 98888-7777",
    url: "https://empresa.com",
    name: "Joao da Silva",
    age: 32,
    cpf: "15515515555",
    money: 4500.75,
    numberRange: { min: 10, max: 100 },
    currencyRange: { min: 1000, max: 5000 },
    birthDate: "1992-04-18",
    period: { start: "2025-01-01", end: "2025-12-31" },
    active: true,
    role: "admin",
    tags: ["a", "b"],
    color: "#4f46e5",
    notes: "Texto simples para textarea.",
    description:
      "<h1>Texto inicial vindo da API</h1><pre><code>teajugmsaf</code></pre><p></p>",
  };

  /* ======================================================
   * SUBMIT
   * ====================================================== */

  function handleSubmit(values: PlaygroundFormData) {
    console.log("SUBMIT FINAL ->", values);
  }

  /* ======================================================
   * RENDER
   * ====================================================== */

  return (
    <div className="min-h-screen w-full space-y-6 p-6">
      <h1 className="text-xl font-semibold">FormEngine Playground v1</h1>

      <FormEngine
        fields={fields}
        steps={steps}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
