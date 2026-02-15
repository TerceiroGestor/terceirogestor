"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";
import type { PantryDashboardResponse } from "@/modules/pantry/api";

type PantryOverviewSummarySectionProps = {
  dashboard: PantryDashboardResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function PantryOverviewSummarySection({
  dashboard,
  loading,
  error,
  onRefresh,
}: PantryOverviewSummarySectionProps) {
  return (
    <SectionCard
      title="Resumo"
      subtitle="Indicadores para gestão e planejamento."
      actions={
        <Button variant="outline" onClick={onRefresh}>
          Atualizar
        </Button>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando despensa...</p>
      ) : null}
      {dashboard ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Alimentos", value: dashboard.totals.items },
            { label: "Saldo total", value: dashboard.totals.stock },
            { label: "Abaixo do mínimo", value: dashboard.totals.lowStock },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border/60 bg-card/40 p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {Number(stat.value).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
