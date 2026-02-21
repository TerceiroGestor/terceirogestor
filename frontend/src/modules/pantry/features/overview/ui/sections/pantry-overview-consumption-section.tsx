"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SectionCard } from "@/components/section-card";
import { useToast } from "@/components/ui/use-toast";
import type {
  PantryConsumptionResponse,
  PantryFlowResponse,
  PantryUsageResponse,
} from "@/modules/pantry/api";

const SERIES_COLORS = [
  "#2563eb",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#eab308",
  "#64748b",
];

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadChartPng(container: HTMLDivElement | null, filename: string) {
  const svg = container?.querySelector("svg");
  if (!svg) return;
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width || 900;
    canvas.height = image.height || 450;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  image.src = url;
}

type PantryOverviewConsumptionSectionProps = {
  consumption: PantryConsumptionResponse | null;
  consumptionLoading: boolean;
  consumptionError: string | null;
  flow: PantryFlowResponse | null;
  flowError: string | null;
  usage: PantryUsageResponse | null;
  usageError: string | null;
  onRefresh: () => void;

  view: "item" | "group";
  onViewChange: (value: "item" | "group") => void;

  exitType: "all" | "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";
  eventName: string;
  onExitTypeChange: (
    value: "all" | "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION"
  ) => void;
  onEventNameChange: (value: string) => void;

  fromMonth: string;
  toMonth: string;
  onFromMonthChange: (value: string) => void;
  onToMonthChange: (value: string) => void;

  selectedItemId: string;
  selectedGroup: string;
  onSelectedItemIdChange: (value: string) => void;
  onSelectedGroupChange: (value: string) => void;

  groups: string[];
  items: Array<{ id: string; name: string }>;
};

export function PantryOverviewConsumptionSection({
  consumption,
  consumptionLoading,
  consumptionError,
  flow,
  flowError,
  usage,
  usageError,
  onRefresh,
  view,
  onViewChange,
  exitType,
  eventName,
  onExitTypeChange,
  onEventNameChange,
  fromMonth,
  toMonth,
  onFromMonthChange,
  onToMonthChange,
  selectedItemId,
  selectedGroup,
  onSelectedItemIdChange,
  onSelectedGroupChange,
  groups,
  items,
}: PantryOverviewConsumptionSectionProps) {
  const consumptionChartRef = React.useRef<HTMLDivElement | null>(null);
  const flowChartRef = React.useRef<HTMLDivElement | null>(null);
  const usageChartRef = React.useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!consumptionError) return;
    toast({
      variant: "destructive",
      title: "Falha ao carregar consumo",
      description: consumptionError,
    });
  }, [consumptionError, toast]);

  React.useEffect(() => {
    if (!flowError) return;
    toast({ variant: "destructive", title: "Falha ao carregar fluxo", description: flowError });
  }, [flowError, toast]);

  React.useEffect(() => {
    if (!usageError) return;
    toast({ variant: "destructive", title: "Falha ao carregar uso", description: usageError });
  }, [usageError, toast]);

  const chart = React.useMemo(() => {
    if (!consumption) return null;
    if (!consumption.months.length) return null;
    if (!consumption.series.length) return null;

    const mappedSeries = consumption.series.map((series, idx) => ({
      ...series,
      dataKey: `s${idx}`,
      color: SERIES_COLORS[idx % SERIES_COLORS.length] ?? "#64748b",
    }));

    const data = consumption.months.map((month, i) => {
      const row: Record<string, unknown> = { month: month.label };
      mappedSeries.forEach((series) => {
        row[series.dataKey] = series.totals[i] ?? 0;
      });
      return row;
    });

    const config: ChartConfig = mappedSeries.reduce((acc, series) => {
      acc[series.dataKey] = { label: series.label, color: series.color };
      return acc;
    }, {} as ChartConfig);

    return { data, config, series: mappedSeries };
  }, [consumption]);

  const flowChart = React.useMemo(() => {
    if (!flow) return null;
    if (!flow.months.length) return null;
    const data = flow.months.map((month, idx) => ({
      month: month.label,
      entries: flow.entries[idx] ?? 0,
      exits: flow.exits[idx] ?? 0,
    }));

    const config: ChartConfig = {
      entries: { label: "Entradas", color: "#22c55e" },
      exits: { label: "Saídas", color: "#ef4444" },
    };

    return { data, config };
  }, [flow]);

  const usageChart = React.useMemo(() => {
    if (!usage) return null;
    const data = usage.totals
      .filter((row) => Number(row.total) > 0)
      .map((row, idx) => ({
        type: row.type,
        label: row.label,
        total: row.total,
        color: SERIES_COLORS[idx % SERIES_COLORS.length] ?? "#64748b",
      }));

    const config: ChartConfig = data.reduce((acc, row) => {
      acc[row.type] = { label: row.label, color: row.color };
      return acc;
    }, {} as ChartConfig);

    return { data, config };
  }, [usage]);

  const exportConsumptionCsv = React.useCallback(() => {
    if (!chart) return;
    const header = ["Mês", ...chart.series.map((s) => s.label)];
    const rows = chart.data.map((row) => {
      const values = chart.series.map((s) => Number((row as any)[s.dataKey] ?? 0));
      return [String((row as any).month ?? ""), ...values];
    });
    downloadCsv(`pantry-consumo-${fromMonth}-${toMonth}.csv`, [header, ...rows]);
  }, [chart, fromMonth, toMonth]);

  const exportFlowCsv = React.useCallback(() => {
    if (!flowChart) return;
    const header = ["Mês", "Entradas", "Saídas"];
    const rows = flowChart.data.map((row) => [row.month, row.entries, row.exits]);
    downloadCsv(`pantry-fluxo-${fromMonth}-${toMonth}.csv`, [header, ...rows]);
  }, [flowChart, fromMonth, toMonth]);

  const exportUsageCsv = React.useCallback(() => {
    if (!usageChart) return;
    const header = ["Tipo", "Total"];
    const rows = usageChart.data.map((row) => [row.label, row.total]);
    downloadCsv(`pantry-consumo-por-tipo-${fromMonth}-${toMonth}.csv`, [header, ...rows]);
  }, [usageChart, fromMonth, toMonth]);

  return (
    <SectionCard
      title="Consumo mensal"
      subtitle="Consumo por alimento ou grupo, com filtros de período."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportConsumptionCsv}>
            Baixar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadChartPng(
                consumptionChartRef.current,
                `pantry-consumo-${fromMonth}-${toMonth}.png`,
              )
            }
          >
            PNG
          </Button>
          <Button variant="outline" onClick={onRefresh}>
            Atualizar
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 lg:grid-cols-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Visão
          </p>
          <Select
            value={view}
            onValueChange={(value) => onViewChange(value === "group" ? "group" : "item")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="item">Por alimento</SelectItem>
              <SelectItem value="group">Por grupo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {view === "group" ? "Grupo" : "Alimento"}
          </p>
          {view === "group" ? (
            <Select value={selectedGroup} onValueChange={onSelectedGroupChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={selectedItemId} onValueChange={onSelectedItemIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Tipo
          </p>
          <Select
            value={exitType}
            onValueChange={(value) => {
              if (
                value === "all" ||
                value === "ATTENDED" ||
                value === "DONATION" ||
                value === "EVENT" ||
                value === "PARTY" ||
                value === "CORRECTION"
              ) {
                onExitTypeChange(value);
              } else {
                onExitTypeChange("all");
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ATTENDED">Atendidos</SelectItem>
              <SelectItem value="DONATION">Doações</SelectItem>
              <SelectItem value="EVENT">Eventos</SelectItem>
              <SelectItem value="PARTY">Festas</SelectItem>
              <SelectItem value="CORRECTION">Correção</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Evento
          </p>
          <Input
            value={eventName}
            onChange={(e) => onEventNameChange(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            De
          </p>
          <Input type="month" value={fromMonth} onChange={(e) => onFromMonthChange(e.target.value)} />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Até
          </p>
          <Input type="month" value={toMonth} onChange={(e) => onToMonthChange(e.target.value)} />
        </div>
      </div>

      {consumptionLoading ? (
        <p className="text-xs text-muted-foreground">Carregando consumo...</p>
      ) : null}

      {chart ? (
        <div
          ref={consumptionChartRef}
          className="rounded-lg border border-border/60 bg-card/40 p-3"
        >
          <ChartContainer config={chart.config} className="h-[320px] w-full">
            <BarChart data={chart.data} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {chart.series.map((series) => (
                <Bar
                  key={series.dataKey}
                  dataKey={series.dataKey}
                  fill={`var(--color-${series.dataKey})`}
                  radius={4}
                />
              ))}
            </BarChart>
          </ChartContainer>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {selectedItemId !== "all" || selectedGroup !== "all"
              ? "Mostrando seleção aplicada."
              : "Mostrando top itens/grupos no período."}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sem dados de consumo.</p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div
          ref={flowChartRef}
          className="rounded-lg border border-border/60 bg-card/40 p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Entradas x Saídas (mensal)
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={exportFlowCsv}>
                CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadChartPng(
                    flowChartRef.current,
                    `pantry-fluxo-${fromMonth}-${toMonth}.png`,
                  )
                }
              >
                PNG
              </Button>
            </div>
          </div>

          {flowChart ? (
            <div className="mt-3">
              <ChartContainer config={flowChart.config} className="h-[260px] w-full">
                <BarChart data={flowChart.data} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={48} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="entries" fill="var(--color-entries)" radius={4} />
                  <Bar dataKey="exits" fill="var(--color-exits)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Sem dados de fluxo.</p>
          )}
        </div>

        <div
          ref={usageChartRef}
          className="rounded-lg border border-border/60 bg-card/40 p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Consumo por tipo
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={exportUsageCsv}>
                CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadChartPng(
                    usageChartRef.current,
                    `pantry-consumo-por-tipo-${fromMonth}-${toMonth}.png`,
                  )
                }
              >
                PNG
              </Button>
            </div>
          </div>

          {usageChart ? (
            <div className="mt-3">
              <ChartContainer config={usageChart.config} className="h-[260px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="type" />} />
                  <Pie
                    data={usageChart.data}
                    dataKey="total"
                    nameKey="label"
                    innerRadius={48}
                    outerRadius={96}
                    paddingAngle={3}
                  >
                    {usageChart.data.map((row) => (
                      <Cell key={row.type} fill={`var(--color-${row.type})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Sem dados por tipo.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
