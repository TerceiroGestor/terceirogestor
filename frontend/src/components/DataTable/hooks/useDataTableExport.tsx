"use client";

import * as React from "react";
import type {
  Column,
  Row,
  RowModel,
  Table,
} from "@tanstack/react-table";
import { formatDateOnlyPtBR } from "@/lib/date";

type ExportContext<TData> = {
  table: Table<TData>;
  rowModel: RowModel<TData>;
  visibleColumnIds: string[];
  getRowValue: (row: Row<TData>, columnId: string) => unknown;
  exportMeta?: {
    title?: string;
    subtitle?: string;
    tenant?: string;
    issuedBy?: string;
    issuedAt?: string;
  };
};

export function useDataTableExport<TData>({
  table,
  rowModel,
  visibleColumnIds,
  getRowValue,
  exportMeta,
}: ExportContext<TData>) {
  type GroupRow = Row<TData> & { groupingColumnId?: string };

  const escapeHtml = React.useCallback((value: string) => {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }, []);

  const getColumnHeader = React.useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId);
      if (!column) return columnId;
      const header = column.columnDef.header;
      return typeof header === "string" ? header : columnId;
    },
    [table],
  );

  const getColumnMeta = React.useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId);
      const meta = column?.columnDef.meta as
        | {
            dataType?: "string" | "number" | "date" | "boolean";
            valueMap?: Record<string, string>;
          }
        | undefined;
      return meta;
    },
    [table],
  );

  const formatDateValue = React.useCallback((value: unknown) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return new Intl.DateTimeFormat("pt-BR").format(value);
    }
    if (typeof value === "string") {
      if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
      const isDateOnly =
        /^\d{4}-\d{2}-\d{2}$/.test(value) ||
        /^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z$/.test(value);
      if (isDateOnly) {
        return formatDateOnlyPtBR(value);
      }
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return new Intl.DateTimeFormat("pt-BR").format(parsed);
    }
    return String(value);
  }, []);

  const formatExportCell = React.useCallback(
    (value: unknown, columnId: string) => {
      if (value === null || value === undefined) {
        return { text: "", html: "" };
      }
      const meta = getColumnMeta(columnId);
      const metaType = meta?.dataType;
      let textValue = "";
      let badgeClass = "";

      if (Array.isArray(value)) {
        textValue = value.map((item) => String(item)).join(", ");
      } else if (meta?.valueMap) {
        const mapped = meta.valueMap[String(value)];
        textValue = mapped ?? String(value);
      } else if (metaType === "boolean") {
        const normalized =
          typeof value === "boolean"
            ? value
            : String(value).toLowerCase() === "true";
        textValue = normalized ? "Sim" : "Nao";
        badgeClass = normalized ? "badge-success" : "badge-muted";
      } else if (metaType === "date") {
        textValue = formatDateValue(value);
      } else {
        textValue = String(value);
      }

      if (columnId === "status") {
        const normalized = textValue.toLowerCase();
        if (normalized.includes("ativo")) badgeClass = "badge-success";
        if (normalized.includes("inativo")) badgeClass = "badge-muted";
        if (normalized.includes("desligado")) badgeClass = "badge-danger";
        if (normalized.includes("analise")) badgeClass = "badge-warning";
      }

      if (badgeClass) {
        return {
          text: textValue,
          html: `<span class="badge ${badgeClass}">${escapeHtml(
            textValue,
          )}</span>`,
        };
      }

      return { text: textValue, html: escapeHtml(textValue) };
    },
    [escapeHtml, formatDateValue, getColumnMeta],
  );

  const toCsvValue = React.useCallback((value: unknown) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }, []);

  const getSelectedExportColumns = React.useCallback(() => {
    const left = table
      .getLeftLeafColumns()
      .map((column) => column.id)
      .filter((id) => id !== "actions");
    const right = table
      .getRightLeafColumns()
      .map((column) => column.id)
      .filter((id) => id !== "actions");
    const allVisible = visibleColumnIds.filter((id) => id !== "actions");
    const pinned = new Set([...left, ...right]);
    const center = allVisible.filter((id) => !pinned.has(id));
    return [...left, ...center, ...right];
  }, [table, visibleColumnIds]);

  const buildExportRows = React.useCallback(() => {
    const selectedColumns = getSelectedExportColumns();
    const headers = selectedColumns.map((columnId) =>
      getColumnHeader(columnId),
    );

    const collectRows = (items: Row<TData>[]) => {
      const result: string[][] = [];
      items.forEach((row) => {
        const values = selectedColumns.map((columnId, index) => {
          const value = getRowValue(row, columnId);
          const stringValue = toCsvValue(
            formatExportCell(value, columnId).text ?? "",
          );
          if (index === 0 && row.depth > 0) {
            return `${"  ".repeat(row.depth)}${stringValue}`;
          }
          return stringValue;
        });
        result.push(values);
        if (row.subRows?.length) {
          result.push(...collectRows(row.subRows));
        }
      });
      return result;
    };

    return { headers, rows: collectRows(rowModel.rows) };
  }, [
    formatExportCell,
    getColumnHeader,
    getRowValue,
    getSelectedExportColumns,
    rowModel.rows,
    toCsvValue,
  ]);

  const buildPdfRows = React.useCallback(() => {
    const selectedColumns = getSelectedExportColumns();
    const headers = selectedColumns.map((columnId) =>
      getColumnHeader(columnId),
    );
    const columnHeaderMap = new Map(
      selectedColumns.map((columnId) => [columnId, getColumnHeader(columnId)]),
    );

    const collectRows = (items: Row<TData>[]) => {
      const result: {
        cells: string[];
        isGroup: boolean;
        depth: number;
        label?: string;
      }[] = [];

      items.forEach((row) => {
        const groupingColumnId = (row as GroupRow).groupingColumnId;
        const isGroupRow = Boolean(groupingColumnId);
        if (isGroupRow && groupingColumnId) {
          const headerLabel =
            columnHeaderMap.get(groupingColumnId) ?? groupingColumnId;
          const value = formatExportCell(
            getRowValue(row, groupingColumnId),
            groupingColumnId,
          ).text;
          result.push({
            cells: [],
            isGroup: true,
            depth: row.depth,
            label: `${headerLabel}: ${value} (${row.subRows?.length ?? 0})`,
          });
        } else {
          result.push({
            cells: selectedColumns.map((columnId) =>
              formatExportCell(getRowValue(row, columnId), columnId).html,
            ),
            isGroup: false,
            depth: row.depth,
          });
        }

        if (row.subRows?.length) {
          result.push(...collectRows(row.subRows));
        }
      });

      return result;
    };

    return { headers, rows: collectRows(rowModel.rows) };
  }, [
    formatExportCell,
    getColumnHeader,
    getRowValue,
    getSelectedExportColumns,
    rowModel.rows,
  ]);

  const exportCsv = React.useCallback(() => {
    const { headers, rows } = buildExportRows();
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customers.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [buildExportRows]);

  const exportPdf = React.useCallback(() => {
    const { headers, rows } = buildPdfRows();
    const title = exportMeta?.title ?? "Relatorio";
    const subtitle = exportMeta?.subtitle ?? "";
    const issuedAt =
      exportMeta?.issuedAt ??
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date());
    const metaLines = [
      exportMeta?.tenant
        ? `<div><strong>Instituicao:</strong> ${escapeHtml(
            exportMeta.tenant,
          )}</div>`
        : "",
      exportMeta?.issuedBy
        ? `<div><strong>Emitido por:</strong> ${escapeHtml(
            exportMeta.issuedBy,
          )}</div>`
        : "",
      issuedAt
        ? `<div><strong>Data:</strong> ${escapeHtml(issuedAt)}</div>`
        : "",
    ]
      .filter(Boolean)
      .join("");
    const html = `
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            body {
              font-family: "Inter", "Segoe UI", Arial, sans-serif;
              padding: 28px;
              color: #0f172a;
              background: #f8fafc;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              background: linear-gradient(135deg, #e0f2fe 0%, #ecfdf3 100%);
              border: 1px solid #cbd5f5;
              border-radius: 12px;
              padding: 16px 18px;
              margin-bottom: 16px;
            }
            .title { font-size: 20px; margin: 0 0 6px; }
            .subtitle { font-size: 12px; color: #475569; margin: 0 0 8px; }
            .meta { font-size: 12px; color: #1e293b; display: grid; gap: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; background: #ffffff; border-radius: 12px; overflow: hidden; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
            th { background-color: #f1f5f9; color: #0f172a; font-weight: 600; }
            tr:nth-child(even) td { background-color: #f8fafc; }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 999px;
              font-size: 11px;
              font-weight: 600;
              border: 1px solid transparent;
            }
            .badge-success { background: #dcfce7; color: #166534; border-color: #86efac; }
            .badge-muted { background: #f1f5f9; color: #334155; border-color: #cbd5f5; }
            .badge-danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
            .badge-warning { background: #fef3c7; color: #92400e; border-color: #fde68a; }
            .group-row { font-weight: 600; }
            .group-0 { background-color: #e2e8f0; }
            .group-1 { background-color: #f1f5f9; }
            .group-2 { background-color: #f8fafc; }
            .group-label { padding-left: 8px; }
            @media print {
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
            <div class="meta">${metaLines}</div>
          </div>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows
                .map((row) => {
                  if (row.isGroup) {
                    const level = Math.min(row.depth, 2);
                    const pad = 8 + row.depth * 12;
                    return `<tr class="group-row group-${level}">
                      <td class="group-label" style="padding-left:${pad}px;" colspan="${
                        headers.length
                      }">${row.label ?? ""}</td>
                    </tr>`;
                  }
                  return `<tr>${row.cells
                    .map((cell) => `<td>${cell}</td>`)
                    .join("")}</tr>`;
                })
                .join("")}
            </tbody>
          </table>
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
  }, [buildPdfRows, exportMeta]);

  return {
    exportCsv,
    exportPdf,
    getColumnHeader,
  };
}
