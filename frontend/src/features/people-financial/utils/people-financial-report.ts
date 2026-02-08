import { buildExportMeta } from "@/lib/auth-utils";
import { formatCurrency } from "@/app/(modules)/people/utils";
import type {
  HouseholdTransfer,
  Person,
  PersonExpense,
  PersonIncome,
} from "@/app/(modules)/people/types";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatText = (value?: string | null) => (value ? escapeHtml(value) : "-");

export function printPeopleFinancialReport({
  token,
  person,
  incomes,
  expenses,
  transfers,
}: {
  token: string;
  person: Person;
  incomes: PersonIncome[];
  expenses: PersonExpense[];
  transfers: HouseholdTransfer[];
}) {
  const meta = buildExportMeta({
    token,
    title: "Relatorio financeiro",
    subtitle: person.fullName,
  });

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const totalTransfers = transfers.reduce(
    (sum, transfer) => sum + transfer.amount,
    0,
  );
  const balance = totalIncome - totalExpenses;

  const incomeRows = incomes
    .map(
      (income) => `
      <tr>
        <td>${formatText(income.type)}</td>
        <td>${formatCurrency(income.amount)}</td>
        <td>${formatText(income.frequency)}</td>
        <td>${formatText(income.contractType)}</td>
        <td>${income.isHouseholdContribution ? "Sim" : "Nao"}</td>
      </tr>`,
    )
    .join("");

  const expenseRows = expenses
    .map(
      (expense) => `
      <tr>
        <td>${formatText(expense.type)}</td>
        <td>${formatCurrency(expense.amount)}</td>
        <td>${formatText(expense.frequency)}</td>
        <td>${expense.isHouseholdExpense ? "Sim" : "Nao"}</td>
      </tr>`,
    )
    .join("");

  const transferRows = transfers
    .map(
      (transfer) => `
      <tr>
        <td>${formatText(transfer.type)}</td>
        <td>${formatCurrency(transfer.amount)}</td>
        <td>${formatText(transfer.frequency)}</td>
        <td>${formatText(transfer.fromHouseholdId)}</td>
        <td>${formatText(transfer.toHouseholdId)}</td>
      </tr>`,
    )
    .join("");

  const html = `
    <html>
      <head>
        <title>${escapeHtml(meta.title)}</title>
        <style>
          body {
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            padding: 28px;
            color: #0f172a;
            background: #f8fafc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          h1, h2 { margin: 0; }
          .header {
            background: linear-gradient(135deg, #e0f2fe 0%, #ecfdf3 100%);
            border: 1px solid #cbd5f5;
            border-radius: 12px;
            padding: 16px 18px;
            margin-bottom: 16px;
          }
          .title { font-size: 20px; margin-bottom: 6px; }
          .subtitle { font-size: 12px; color: #475569; margin-bottom: 8px; }
          .meta { font-size: 12px; color: #1e293b; display: grid; gap: 4px; }
          .section {
            margin-top: 16px;
            padding: 14px 16px;
            background: #fff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .section-title { font-size: 14px; margin-bottom: 8px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
          th { background-color: #f1f5f9; color: #0f172a; font-weight: 600; }
          .grid { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .metric { padding: 8px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
          .metric strong { display: block; font-size: 12px; color: #64748b; }
          .muted { color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${escapeHtml(meta.title)}</h1>
          ${meta.subtitle ? `<p class="subtitle">${escapeHtml(meta.subtitle)}</p>` : ""}
          <div class="meta">
            ${meta.tenant ? `<div><strong>Instituicao:</strong> ${escapeHtml(meta.tenant)}</div>` : ""}
            ${meta.issuedBy ? `<div><strong>Emitido por:</strong> ${escapeHtml(meta.issuedBy)}</div>` : ""}
            ${meta.issuedAt ? `<div><strong>Data:</strong> ${escapeHtml(meta.issuedAt)}</div>` : ""}
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Resumo</h2>
          <div class="grid">
            <div class="metric"><strong>Renda total</strong>${formatCurrency(totalIncome)}</div>
            <div class="metric"><strong>Gastos totais</strong>${formatCurrency(totalExpenses)}</div>
            <div class="metric"><strong>Saldo</strong>${formatCurrency(balance)}</div>
            <div class="metric"><strong>Transferencias</strong>${formatCurrency(totalTransfers)}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Rendas</h2>
          ${incomeRows ? `
            <table>
              <thead>
                <tr><th>Tipo</th><th>Valor</th><th>Frequencia</th><th>Contrato</th><th>Contribui</th></tr>
              </thead>
              <tbody>${incomeRows}</tbody>
            </table>
          ` : `<p class="muted">Nenhuma renda cadastrada.</p>`}
        </div>

        <div class="section">
          <h2 class="section-title">Gastos</h2>
          ${expenseRows ? `
            <table>
              <thead>
                <tr><th>Tipo</th><th>Valor</th><th>Frequencia</th><th>Relacionado a familia</th></tr>
              </thead>
              <tbody>${expenseRows}</tbody>
            </table>
          ` : `<p class="muted">Nenhum gasto cadastrado.</p>`}
        </div>

        <div class="section">
          <h2 class="section-title">Transferencias</h2>
          ${transferRows ? `
            <table>
              <thead>
                <tr><th>Tipo</th><th>Valor</th><th>Frequencia</th><th>Origem</th><th>Destino</th></tr>
              </thead>
              <tbody>${transferRows}</tbody>
            </table>
          ` : `<p class="muted">Nenhuma transferencia cadastrada.</p>`}
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };
  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 50);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 50);
  }
}
