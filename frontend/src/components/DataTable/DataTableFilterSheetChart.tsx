"use client";

import * as React from "react";
import type { Column, Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartType = "bar" | "line" | "pie";

type ChartState<TData> = {
  chartColumnId: string;
  setChartColumnId: (value: string) => void;
  chartType: ChartType;
  setChartType: (value: ChartType) => void;
  chartOpen: boolean;
  setChartOpen: (value: boolean) => void;
  chartData: { label: string; value: number }[];
  chartTitle: string;
  chartColor: string;
  chartTextColor: string;
  chartContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  downloadPng: () => void;
  downloadPdf: () => void;
  columns: Column<TData, unknown>[];
};

const useChartState = <TData,>({
  columns,
  rows,
  getRowValue,
}: {
  columns: Column<TData, unknown>[];
  rows: Row<TData>[];
  getRowValue: (row: Row<TData>, columnId: string) => unknown;
}): ChartState<TData> => {
  const [chartColumnId, setChartColumnId] = React.useState(
    columns[0]?.id ?? "",
  );
  const [chartType, setChartType] = React.useState<ChartType>("bar");
  const [chartOpen, setChartOpen] = React.useState(false);
  const chartContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mountedRef = React.useRef(false);

  const [chartColor, setChartColor] = React.useState("#3b82f6");
  const [chartTextColor, setChartTextColor] = React.useState("#0f172a");

  const columnLabel = React.useCallback(
    (column: Column<TData, unknown>) =>
      String(column.columnDef.header ?? column.id),
    [],
  );

  const resolveValueLabel = React.useCallback(
    (columnId: string, value: unknown) => {
      const column = columns.find((col) => col.id === columnId);
      const meta = column?.columnDef.meta as
        | { valueMap?: Record<string, string> }
        | undefined;
      const key = value === undefined || value === null ? "N/A" : String(value);
      return meta?.valueMap?.[key] ?? key;
    },
    [columns],
  );

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!chartColumnId && columns.length) {
      if (mountedRef.current) {
        setChartColumnId(columns[0]?.id ?? "");
      }
    }
  }, [chartColumnId, columns]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const primary =
      getComputedStyle(root).getPropertyValue("--color-primary").trim() ||
      "#3b82f6";
    const foreground =
      getComputedStyle(root).getPropertyValue("--color-foreground").trim() ||
      "#0f172a";
    if (mountedRef.current) {
      setChartColor(primary);
      setChartTextColor(foreground);
    }
  }, []);

  const chartData = React.useMemo(() => {
    if (!chartColumnId) return [];
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const raw = getRowValue(row, chartColumnId);
      const key = resolveValueLabel(chartColumnId, raw);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [chartColumnId, rows, getRowValue, resolveValueLabel]);

  const chartTitle = React.useMemo(() => {
    const column = columns.find((col) => col.id === chartColumnId);
    return column ? columnLabel(column) : "Grafico";
  }, [chartColumnId, columns, columnLabel]);

  const getChartSvg = () => {
    const svg = chartContainerRef.current?.querySelector("svg");
    if (!svg) return null;
    const serializer = new XMLSerializer();
    const cloned = svg.cloneNode(true) as SVGElement;
    cloned
      .querySelectorAll<SVGElement>("[fill='var(--color-primary)']")
      .forEach((el) => el.setAttribute("fill", chartColor));
    cloned
      .querySelectorAll<SVGElement>("[stroke='var(--color-primary)']")
      .forEach((el) => el.setAttribute("stroke", chartColor));
    cloned
      .querySelectorAll<SVGElement>("text")
      .forEach((el) => el.setAttribute("fill", chartTextColor));
    return serializer.serializeToString(cloned);
  };

  const downloadPng = () => {
    const svgString = getChartSvg();
    if (!svgString) return;
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width || 800;
      canvas.height = image.height || 400;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = "grafico.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
    };
    image.src = url;
  };

  const downloadPdf = () => {
    const svgString = getChartSvg();
    if (!svgString) return;
    const html = `
      <html>
        <head>
          <title>Grafico</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { font-size: 16px; margin: 0 0 16px; }
          </style>
        </head>
        <body>
          <h1>${chartTitle}</h1>
          ${svgString}
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
  };

  return {
    chartColumnId,
    setChartColumnId,
    chartType,
    setChartType,
    chartOpen,
    setChartOpen,
    chartData,
    chartTitle,
    chartColor,
    chartTextColor,
    chartContainerRef,
    downloadPng,
    downloadPdf,
    columns,
  };
};

type ChartSectionProps<TData> = {
  open: boolean;
  onToggle: () => void;
  chart: ChartState<TData>;
  onOpenChart: () => void;
};

export function DataTableFilterSheetChartSection<TData>({
  open,
  onToggle,
  chart,
  onOpenChart,
}: ChartSectionProps<TData>) {
  return (
    <details className="rounded-md border border-border" open={open}>
      <summary
        className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-medium"
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
      >
        Grafico
      </summary>
      <div className="border-t border-border px-3 pt-3 pb-0 max-h-56 overflow-y-auto flex flex-col">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-muted-foreground">
              Coluna
            </label>
            <select
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs"
              value={chart.chartColumnId}
              onChange={(event) => chart.setChartColumnId(event.target.value)}
            >
              {chart.columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {String(column.columnDef.header ?? column.id)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {chart.chartData.length ? (
              chart.chartData.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate">{item.label}</span>
                    <span className="font-medium text-foreground">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/60">
                    <div
                      className="h-2 rounded-full bg-primary/70"
                      style={{
                        width: `${Math.min(
                          100,
                          (item.value /
                            Math.max(
                              ...chart.chartData.map((d) => d.value),
                              1,
                            )) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhum dado para gerar grafico.
              </p>
            )}
          </div>
        </div>
        <div className="sticky bottom-0 -mx-3 mt-2 border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs w-full"
            onClick={onOpenChart}
          >
            Gerar grafico
          </Button>
        </div>
      </div>
    </details>
  );
}

type ChartDialogProps<TData> = {
  chart: ChartState<TData>;
};

export function DataTableChartDialog<TData>({ chart }: ChartDialogProps<TData>) {
  return (
    <Dialog open={chart.chartOpen} onOpenChange={chart.setChartOpen}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Grafico</DialogTitle>
          <DialogDescription>{chart.chartTitle}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Coluna
            </label>
            <select
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={chart.chartColumnId}
              onChange={(event) => chart.setChartColumnId(event.target.value)}
            >
              {chart.columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {String(column.columnDef.header ?? column.id)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Tipo
            </label>
            <select
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={chart.chartType}
              onChange={(event) =>
                chart.setChartType(event.target.value as ChartType)
              }
            >
              <option value="bar">Barras</option>
              <option value="line">Linha</option>
              <option value="pie">Pizza</option>
            </select>
          </div>
        </div>
        <div
          className="rounded-lg border border-border bg-card/60 p-4"
          ref={chart.chartContainerRef}
        >
          {chart.chartData.length ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chart.chartType === "bar" ? (
                  <BarChart data={chart.chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={36} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill={chart.chartColor} radius={4}>
                      <LabelList dataKey="value" position="top" />
                    </Bar>
                  </BarChart>
                ) : chart.chartType === "line" ? (
                  <LineChart data={chart.chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={36} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={chart.chartColor}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                ) : (
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={chart.chartData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={3}
                      fill={chart.chartColor}
                      label={({ name, value }) => `${name}: ${value}`}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum dado para gerar grafico.
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={chart.downloadPng}>
            Download PNG
          </Button>
          <Button variant="outline" onClick={chart.downloadPdf}>
            Download PDF
          </Button>
          <Button onClick={() => chart.setChartOpen(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { useChartState };
