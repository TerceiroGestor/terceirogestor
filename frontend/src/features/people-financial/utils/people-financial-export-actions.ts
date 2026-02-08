import type {
  HouseholdTransfer,
  Person,
  PersonExpense,
  PersonIncome,
} from "@/app/(modules)/people/types";
import { formatCurrency } from "@/app/(modules)/people/utils";
import { printPeopleFinancialReport } from "@/features/people-financial/utils/people-financial-report";

const csvHeaders = [
  "Categoria",
  "Tipo",
  "Valor",
  "Frequencia",
  "Contrato",
  "Contribui",
  "Observacoes",
];

export function exportPeopleFinancialPdf(params: {
  token: string | null | undefined;
  person: Person;
  incomes: PersonIncome[];
  expenses: PersonExpense[];
  transfers: HouseholdTransfer[];
}) {
  if (!params.token) return;
  printPeopleFinancialReport({
    token: params.token,
    person: params.person,
    incomes: params.incomes,
    expenses: params.expenses,
    transfers: params.transfers,
  });
}

export function buildPeopleFinancialCsv(params: {
  incomes: PersonIncome[];
  expenses: PersonExpense[];
  transfers: HouseholdTransfer[];
}) {
  const rows: string[][] = [];

  params.incomes.forEach((income) => {
    rows.push([
      "Renda",
      income.type,
      formatCurrency(income.amount),
      income.frequency,
      income.contractType ?? "-",
      income.isHouseholdContribution ? "Sim" : "Nao",
      income.notes ?? "-",
    ]);
  });

  params.expenses.forEach((expense) => {
    rows.push([
      "Gasto",
      expense.type,
      formatCurrency(expense.amount),
      expense.frequency,
      "-",
      expense.isHouseholdExpense ? "Sim" : "Nao",
      expense.notes ?? "-",
    ]);
  });

  params.transfers.forEach((transfer) => {
    rows.push([
      "Transferencia",
      transfer.type,
      formatCurrency(transfer.amount),
      transfer.frequency,
      "-",
      "-",
      transfer.notes ?? "-",
    ]);
  });

  const csv = [csvHeaders, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return csv;
}

export function downloadPeopleFinancialCsv(params: {
  person: Person;
  incomes: PersonIncome[];
  expenses: PersonExpense[];
  transfers: HouseholdTransfer[];
}) {
  const csv = buildPeopleFinancialCsv(params);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${params.person.fullName.replace(/\s+/g, "_")}-financeiro.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
