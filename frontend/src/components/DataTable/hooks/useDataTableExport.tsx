"use client";

import * as React from "react";
import type {
  Column,
  Row,
  RowModel,
  Table,
} from "@tanstack/react-table";

type ExportContext<TData> = {
  table: Table<TData>;
  rowModel: RowModel<TData>;
  visibleColumnIds: string[];
  getRowValue: (row: Row<TData>, columnId: string) => unknown;
};

export function useDataTableExport<TData>({
  table,
  rowModel,
  visibleColumnIds,
  getRowValue,
}: ExportContext<TData>) {
  const getColumnHeader = React.useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId);
      if (!column) return columnId;
      const header = column.columnDef.header;
      return typeof header === "string" ? header : columnId;
    },
    [table],
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
          const stringValue = toCsvValue(value ?? "");
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
  }, [getColumnHeader, getRowValue, getSelectedExportColumns, rowModel.rows, toCsvValue]);

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
        const groupingColumnId = (row as any).groupingColumnId as
          | string
          | undefined;
        const isGroupRow = Boolean(groupingColumnId);
        if (isGroupRow && groupingColumnId) {
          const headerLabel =
            columnHeaderMap.get(groupingColumnId) ?? groupingColumnId;
          const value = String(getRowValue(row, groupingColumnId) ?? "");
          result.push({
            cells: [],
            isGroup: true,
            depth: row.depth,
            label: `${headerLabel}: ${value} (${row.subRows?.length ?? 0})`,
          });
        } else {
          result.push({
            cells: selectedColumns.map((columnId) =>
              String(getRowValue(row, columnId) ?? ""),
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
  }, [getColumnHeader, getRowValue, getSelectedExportColumns, rowModel.rows]);

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
    const html = `
      <html>
        <head>
          <title>Export</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h1 { font-size: 18px; margin: 0 0 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background-color: #eef2f7; }
            .group-row { font-weight: 600; }
            .group-0 { background-color: #e7effa; }
            .group-1 { background-color: #edf7f6; }
            .group-2 { background-color: #f6f3e9; }
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
          <h1>Export</h1>
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
  }, [buildPdfRows]);

  return {
    exportCsv,
    exportPdf,
    getColumnHeader,
  };
}

