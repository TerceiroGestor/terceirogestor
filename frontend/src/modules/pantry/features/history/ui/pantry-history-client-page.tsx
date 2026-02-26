"use client";

import * as React from "react";
import { useToast } from "@/components/ui/use-toast";
import { PantryEntryEditDialog } from "@/modules/pantry/features/entries/ui/pantry-entry-edit-dialog";
import { PantryExitEditDialog } from "@/modules/pantry/features/exits/ui/pantry-exit-edit-dialog";
import { usePantryHistoryModel, type PantryHistoryView } from "@/modules/pantry/features/history/hooks/use-pantry-history-model";
import { formatDateOnlyPtBR, formatDateTimePtBR } from "@/lib/date";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PantryMovementTimeline,
  type PantryMovementTimelineRow,
} from "@/modules/pantry/shared/ui/pantry-movement-timeline";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { RecordBrowserViewOption } from "@/components/record-browser/RecordBrowserViewSwitcher";
import { BarChart3, Clock, LayoutGrid, Table2 } from "lucide-react";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { FilterMenu } from "@/web-client/control-panel/FilterMenu";
import { FavoritesMenu } from "@/web-client/control-panel/FavoritesMenu";
import { ViewSwitcher } from "@/web-client/control-panel/ViewSwitcher";
import { pantryHistorySearchView } from "@/web-client/registry/searchViews/pantry";
import type { Domain } from "@/web-client/domain/types";

function formatPantryMovementDate(value: string | null) {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return formatDateOnlyPtBR(trimmed);
  }

  if (
    /^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?(Z|[+-]\d{2}:\d{2})?$/.test(trimmed)
  ) {
    return formatDateOnlyPtBR(trimmed.slice(0, 10));
  }

  return formatDateTimePtBR(trimmed);
}

type PantryHistoryFavoriteState = {
  view: PantryHistoryView;
  searchText: string;
  domain: Domain;
  pageSize: number;
};

export function PantryHistoryClientPage() {
  const model = usePantryHistoryModel();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!model.error) return;
    toast({ variant: "destructive", title: "Falha ao carregar", description: model.error });
  }, [model.error, toast]);

  if (!model.canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageControlPanel
        searchSlot={
          <SearchBar
            value={model.filters.searchText}
            onChange={(next) =>
              model.setFilters((prev) => ({ ...prev, searchText: next }))
            }
            placeholder="Buscar por alimento"
          />
        }
        filterSlot={
          <FilterMenu
            searchView={pantryHistorySearchView}
            domain={model.filters.domain}
            onChange={(domain) => model.setFilters((prev) => ({ ...prev, domain }))}
          />
        }
        favoritesSlot={
          <FavoritesMenu<PantryHistoryFavoriteState>
            actionId="pantry.history"
            snapshot={{
              view: model.filters.view,
              searchText: model.filters.searchText,
              domain: model.filters.domain,
              pageSize: model.filters.pageSize,
            }}
            onApply={(state) =>
              model.setFilters((prev) => ({
                ...prev,
                ...state,
                pageIndex: 0,
              }))
            }
          />
        }
        viewSwitcherSlot={
          <ViewSwitcher
            value={model.filters.view}
            options={HISTORY_VIEWS}
            onChange={(next) => model.setFilters((prev) => ({ ...prev, view: next }))}
          />
        }
        rightSlot={
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => model.reload()}
              disabled={model.loading}
            >
              Atualizar
            </Button>
            <div className="text-xs text-muted-foreground">
              Total:{" "}
              <span className="font-mono tabular-nums text-foreground">
                {model.totalCount.toLocaleString("pt-BR")}
              </span>
            </div>
          </>
        }
      />

      <PantryHistorySection model={model} formatDate={formatPantryMovementDate} />

      <PantryEntryEditDialog
        open={model.editEntryOpen}
        onOpenChange={(open) => {
          model.setEditEntryOpen(open);
          if (!open) model.setEditingEntryId(null);
        }}
        entryId={model.editingEntryId}
        onSaved={model.reload}
      />

      <PantryExitEditDialog
        open={model.editExitOpen}
        onOpenChange={(open) => {
          model.setEditExitOpen(open);
          if (!open) model.setEditingExitId(null);
        }}
        exitId={model.editingExitId}
        onSaved={model.reload}
      />
    </div>
  );
}

function PantryHistorySection({
  model,
  formatDate,
}: {
  model: ReturnType<typeof usePantryHistoryModel>;
  formatDate: (value: string | null) => string;
}) {
  const movements = model.movements;
  const showPagination = model.filters.view !== "graph" && model.pageCount > 1;

  const paginationNode = showPagination ? (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
      <div className="text-xs text-muted-foreground">
        PÃ¡gina{" "}
        <span className="font-mono tabular-nums text-foreground">
          {model.filters.pageIndex + 1}
        </span>{" "}
        de{" "}
        <span className="font-mono tabular-nums text-foreground">
          {model.pageCount}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={String(model.filters.pageSize)}
          onValueChange={(value) =>
            model.setFilters((prev) => ({
              ...prev,
              pageSize: Number(value),
              pageIndex: 0,
            }))
          }
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            model.setFilters((prev) => ({
              ...prev,
              pageIndex: Math.max(0, prev.pageIndex - 1),
            }))
          }
          disabled={model.loading || model.filters.pageIndex === 0}
        >
          Anterior
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            model.setFilters((prev) => ({
              ...prev,
              pageIndex: Math.min(model.pageCount - 1, prev.pageIndex + 1),
            }))
          }
          disabled={model.loading || model.filters.pageIndex + 1 >= model.pageCount}
        >
          PrÃ³xima
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <SectionCard
      title="HistÃ³rico"
      subtitle="Entradas e saÃ­das, com busca e filtros aplicados no banco."
    >
      <div className="flex flex-col gap-4">
        {/* Migrado para o ControlPanelShell (v0.3+) */}
        {/*
        <RecordBrowserToolbar
          view={model.filters.view}
          views={HISTORY_VIEWS}
          onViewChange={(next) => model.setFilters((prev) => ({ ...prev, view: next }))}
          query={model.filters.search}
          onQueryChange={(next) => model.setFilters((prev) => ({ ...prev, search: next }))}
          searchPlaceholder="Buscar por alimento"
          filters={
            <>
              <div className="min-w-[200px]">
                <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tipo (saÃ­das)
                </p>
                <Select
                  value={model.filters.exitType}
                  onValueChange={(value) =>
                    model.setFilters((prev) => ({
                      ...prev,
                      exitType: value as typeof prev.exitType,
                    }))
                  }
                  disabled={model.filters.kind === "ENTRY"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ATTENDED">Atendidos</SelectItem>
                    <SelectItem value="DONATION">DoaÃ§Ãµes</SelectItem>
                    <SelectItem value="EVENT">Eventos</SelectItem>
                    <SelectItem value="PARTY">Festas</SelectItem>
                    <SelectItem value="CORRECTION">CorreÃ§Ã£o</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[240px]">
                <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Evento (saÃ­das)
                </p>
                <Input
                  value={model.filters.eventName}
                  onChange={(e) =>
                    model.setFilters((prev) => ({ ...prev, eventName: e.target.value }))
                  }
                  placeholder="Buscar por evento"
                  disabled={model.filters.kind === "ENTRY"}
                />
              </div>

              <div className="min-w-[150px]">
                <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  De
                </p>
                <Input
                  type="date"
                  value={model.filters.fromDate}
                  onChange={(e) =>
                    model.setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                  }
                />
              </div>

              <div className="min-w-[150px]">
                <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  AtÃ©
                </p>
                <Input
                  type="date"
                  value={model.filters.toDate}
                  onChange={(e) =>
                    model.setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 py-2">
                <Button
                  type="button"
                  size="sm"
                  variant={model.filters.kind === "ALL" ? "default" : "outline"}
                  onClick={() =>
                    model.setFilters((prev) => ({ ...prev, kind: "ALL" }))
                  }
                >
                  Todos
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={model.filters.kind === "ENTRY" ? "default" : "outline"}
                  onClick={() =>
                    model.setFilters((prev) => ({ ...prev, kind: "ENTRY" }))
                  }
                >
                  Entradas
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={model.filters.kind === "EXIT" ? "default" : "outline"}
                  onClick={() =>
                    model.setFilters((prev) => ({ ...prev, kind: "EXIT" }))
                  }
                >
                  SaÃ­das
                </Button>
              </div>
            </>
          }
          rightActions={
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => model.reload()}
                disabled={model.loading}
              >
                Atualizar
              </Button>
              <div className="text-xs text-muted-foreground">
                Total:{" "}
                <span className="font-mono tabular-nums text-foreground">
                  {model.totalCount.toLocaleString("pt-BR")}
                </span>
              </div>
            </>
          }
        />
        */}

        {model.filters.view === "cards" ? (
          model.loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : movements.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum movimento encontrado.</div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {movements.map((movement) => (
                <button
                  key={movement.id}
                  type="button"
                  onClick={() => model.openMovementEdit(movement)}
                  className="rounded-lg border border-border/60 bg-background px-3 py-3 text-left shadow-none transition-colors hover:bg-muted/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {movement.itemName}
                      </span>
                      <Badge variant={movement.kind === "ENTRY"}>
                        {movement.kind === "ENTRY" ? "Entrada" : "SaÃ­da"}
                      </Badge>
                      <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Setor: {movement.sector}
                      </span>
                    </div>
                    <span className="rounded-md bg-muted/40 px-2 py-0.5 font-mono text-[11px] tabular-nums text-foreground">
                      {formatDate(movement.date)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums text-foreground">
                      {movement.kind === "ENTRY" ? "+" : "-"}
                      {Number(movement.quantity).toLocaleString("pt-BR")}{" "}
                      {movement.unit}
                    </span>
                    <span>{movement.meta}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Por: <span className="text-foreground">{movement.actor}</span>
                  </div>
                  {movement.notes ? (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      Obs.: {movement.notes}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )
        ) : null}

        {model.filters.view === "table" ? (
          model.loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : movements.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum movimento encontrado.</div>
          ) : (
            <div className="rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Alimento</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Por</TableHead>
                    <TableHead>Meta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow
                      key={movement.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => model.openMovementEdit(movement)}
                    >
                      <TableCell className="whitespace-nowrap font-mono text-[11px] tabular-nums">
                        {formatDate(movement.date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={movement.kind === "ENTRY"}>
                          {movement.kind === "ENTRY" ? "Entrada" : "SaÃ­da"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{movement.itemName}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-[11px] tabular-nums text-foreground">
                        {movement.kind === "ENTRY" ? "+" : "-"}
                        {Number(movement.quantity).toLocaleString("pt-BR")}{" "}
                        {movement.unit}
                      </TableCell>
                      <TableCell>{movement.sector}</TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {movement.actor}
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-muted-foreground">
                        {movement.meta}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : null}

        {model.filters.view === "timeline" ? (
          <div className="mt-2">
            <PantryMovementTimeline
              rows={movements.map<PantryMovementTimelineRow>((movement) => ({
                id: movement.id,
                kind: movement.kind,
                date: movement.date,
                sector: movement.sector,
                quantity: movement.quantity,
                unit: movement.unit,
                actor: movement.actor,
                notes: movement.notes,
                meta: movement.meta,
                expiryDate: movement.expiryDate,
                itemName: movement.itemName,
                onClick: () => model.openMovementEdit(movement),
              }))}
              formatDate={formatDate}
              emptyLabel={model.loading ? "" : "Nenhum movimento encontrado."}
              scroll={false}
            />
          </div>
        ) : null}

        {model.filters.view === "graph" ? (
          model.loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : movements.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Nenhum movimento encontrado para gerar o grÃ¡fico.
            </div>
          ) : (
            <HistoryGraph movements={movements} />
          )
        ) : null}

        {paginationNode}
      </div>
    </SectionCard>
  );
}

const HISTORY_VIEWS: RecordBrowserViewOption<
  ReturnType<typeof usePantryHistoryModel>["filters"]["view"]
>[] = [
  { value: "cards", label: "Kanban", icon: <LayoutGrid className="size-4" /> },
  { value: "table", label: "Tabela", icon: <Table2 className="size-4" /> },
  { value: "timeline", label: "Timeline", icon: <Clock className="size-4" /> },
  { value: "graph", label: "GrÃ¡fico", icon: <BarChart3 className="size-4" /> },
];

function HistoryGraph({
  movements,
}: {
  movements: Array<{ kind: "ENTRY" | "EXIT"; date: string; quantity: number }>;
}) {
  const chart = React.useMemo(() => {
    const monthMap = new Map<
      string,
      { key: string; label: string; entries: number; exits: number; movements: number }
    >();

    const formatMonthLabel = (key: string) => {
      const [yearRaw, monthRaw] = key.split("-");
      const year = Number(yearRaw);
      const month = Number(monthRaw);
      if (!year || !month) return key;
      const date = new Date(year, month - 1, 1);
      return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(
        date,
      );
    };

    movements.forEach((movement) => {
      const key = movement.date.length >= 7 ? movement.date.slice(0, 7) : movement.date;
      if (!/^\d{4}-\d{2}$/.test(key)) return;

      const current =
        monthMap.get(key) ??
        ({
          key,
          label: formatMonthLabel(key),
          entries: 0,
          exits: 0,
          movements: 0,
        } as const);

      const qty = Number(movement.quantity) || 0;
      const next = {
        ...current,
        entries: current.entries + (movement.kind === "ENTRY" ? qty : 0),
        exits: current.exits + (movement.kind === "EXIT" ? qty : 0),
        movements: current.movements + 1,
      };
      monthMap.set(key, next);
    });

    const data = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    const config: ChartConfig = {
      entries: { label: "Entradas", color: "#22c55e" },
      exits: { label: "SaÃ­das", color: "#ef4444" },
    };

    const totals = data.reduce(
      (acc, row) => ({
        entries: acc.entries + row.entries,
        exits: acc.exits + row.exits,
        movements: acc.movements + row.movements,
      }),
      { entries: 0, exits: 0, movements: 0 },
    );

    return { data, config, totals };
  }, [movements]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>
          Movimentos:{" "}
          <span className="font-mono tabular-nums text-foreground">
            {chart.totals.movements.toLocaleString("pt-BR")}
          </span>
        </span>
        <span>
          Entradas:{" "}
          <span className="font-mono tabular-nums text-foreground">
            {chart.totals.entries.toLocaleString("pt-BR")}
          </span>
        </span>
        <span>
          SaÃ­das:{" "}
          <span className="font-mono tabular-nums text-foreground">
            {chart.totals.exits.toLocaleString("pt-BR")}
          </span>
        </span>
      </div>

      <ChartContainer config={chart.config} className="h-[320px] w-full">
        <BarChart data={chart.data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="entries" fill="var(--color-entries)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="exits" fill="var(--color-exits)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
