"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type GraphSeries = {
  key: string;
  label: string;
  color: string;
};

export type GraphChartType = "bar" | "line" | "area";

export function GraphView<TDatum extends Record<string, unknown>>({
  data,
  xKey,
  series,
  chartType = "bar",
  height = 320,
  className,
  emptyState = "Nada para exibir.",
}: {
  data: TDatum[];
  xKey: keyof TDatum & string;
  series: GraphSeries[];
  chartType?: GraphChartType;
  height?: number;
  className?: string;
  emptyState?: string;
}) {
  const config = React.useMemo(() => {
    const next: ChartConfig = {};
    series.forEach((s) => {
      next[s.key] = { label: s.label, color: s.color };
    });
    return next;
  }, [series]);

  if (!data.length) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
        {emptyState}
      </div>
    );
  }

  return (
    <ChartContainer
      config={config}
      className={cn("w-full", className)}
      style={{ height }}
    >
      {chartType === "line" ? (
        <LineChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      ) : chartType === "area" ? (
        <AreaChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={`var(--color-${s.key})`}
              fill={`var(--color-${s.key})`}
              fillOpacity={0.2}
            />
          ))}
        </AreaChart>
      ) : (
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={`var(--color-${s.key})`}
              radius={[6, 6, 0, 0]}
            />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  );
}
