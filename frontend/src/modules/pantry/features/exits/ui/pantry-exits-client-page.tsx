"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { FormEngine } from "@/components/FormEngine";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantryExit,
  createPantrySector,
  deletePantryExit,
  listPantryExits,
  listPantryItems,
  listPantrySectors,
  updatePantryExit,
  type ApiPantryExit,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import { buildPantryExitFormFields } from "@/modules/pantry/features/exits/config/pantry-exit-form-config";
import { PANTRY_NEW_SECTOR_VALUE } from "@/modules/pantry/features/items/config/pantry-item-form-config";
import type { PantryExitFormValues } from "@/modules/pantry/shared/domain/types";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { formatDateOnlyPtBR, todayLocalIsoDate } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { ViewSwitcher } from "@/web-client/control-panel/ViewSwitcher";
import { usePersistedUrlState } from "@/web-client/screen/usePersistedUrlState";
import type { RecordBrowserViewOption } from "@/components/record-browser/RecordBrowserViewSwitcher";
import { KanbanView } from "@/web-client/views/KanbanView";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { LayoutGrid, Table2 } from "lucide-react";

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

function toDateOnly(value: string | null | undefined) {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function todayIsoDate() {
  return todayLocalIsoDate();
}

function exitTypeLabel(type: ApiPantryExit["type"] | string) {
  switch (type) {
    case "ATTENDED":
      return "Atendidos";
    case "DONATION":
      return "Doações";
    case "EVENT":
      return "Eventos";
    case "PARTY":
      return "Festas";
    case "CORRECTION":
      return "Correção";
    default:
      return type;
  }
}

export function PantryExitsClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");
  const canUpdate = permissions.includes("pantry.update");
  const canDelete = permissions.includes("pantry.delete");

  const [rows, setRows] = React.useState<ApiPantryExit[]>([]);
  const [items, setItems] = React.useState<ApiPantryItem[]>([]);
  const [sectors, setSectors] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );

  const itemMap = React.useMemo(() => {
    return new Map(items.map((item) => [item.id, item]));
  }, [items]);

  const [loading, setLoading] = React.useState(true);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");

  const [screenState, setScreenState] = usePersistedUrlState<{
    view: "table" | "kanban";
  }>({
    storageKey: "screenState:pantry.exits",
    trackedKeys: ["v"],
    parse: (params) => {
      const raw = params.get("v");
      return { view: raw === "kanban" ? "kanban" : "table" };
    },
    serialize: (state) => ({ v: state.view === "table" ? undefined : state.view }),
  });

  const viewOptions = React.useMemo<RecordBrowserViewOption<"table" | "kanban">[]>(
    () => [
      { value: "table", label: "Tabela", icon: <Table2 className="size-4" /> },
      { value: "kanban", label: "Kanban", icon: <LayoutGrid className="size-4" /> },
    ],
    [],
  );

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiPantryExit | null>(null);
  const [saving, setSaving] = React.useState(false);

  const itemOptions = React.useMemo(
    () => items.map((item) => ({ label: item.name, value: item.id })),
    [items],
  );

  const sectorOptions = React.useMemo(() => {
    const set = new Set<string>();
    const list: Array<{ label: string; value: string }> = [];

    const push = (name: string) => {
      const normalized = name.trim();
      if (!normalized) return;
      if (set.has(normalized)) return;
      set.add(normalized);
      list.push({ label: normalized, value: normalized });
    };

    (sectors ?? []).forEach((sector) => push(sector.name));
    (items ?? []).forEach((item) => push(item.defaultSector ?? "Geral"));
    if (editing?.sector) push(editing.sector);
    push("Geral");

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [editing?.sector, items, sectors]);

  const columns = React.useMemo<ColumnDef<ApiPantryExit>[]>(
    () => [
      {
        accessorKey: "exitDate",
        header: "Data",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.exitDate)}
          </span>
        ),
      },
      {
        accessorKey: "item",
        header: "Alimento",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {row.original.item?.name ?? row.original.itemId}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Unidade: {row.original.item?.unit ?? row.original.unit}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "sector",
        header: "Setor",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.sector}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Uso",
        cell: ({ row }) => (
          <Badge variant="outline">{exitTypeLabel(row.original.type)}</Badge>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Qtd.",
        cell: ({ row }) => (
          <span className="text-xs font-mono tabular-nums text-foreground">
            {Number(row.original.quantity).toLocaleString("pt-BR")} {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: "eventName",
        header: "Evento",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.eventName || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const loadLookups = React.useCallback(async () => {
    if (!token || !canRead) return;
    try {
      const [itemsResponse, sectorsResponse] = await Promise.all([
        listPantryItems(token, { all: true, limit: 200 }),
        listPantrySectors(token),
      ]);
      setItems(itemsResponse.data);
      setSectors(sectorsResponse.data ?? []);
    } catch {
      // lookup failure should not block listing
    }
  }, [token, canRead]);

  const loadExits = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    try {
      const response = await listPantryExits(token, {
        q: search.trim() || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setRows(response.data);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar saídas.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, canRead, pagination.pageIndex, pagination.pageSize, search, toast]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canRead) {
      setLoading(false);
      return;
    }
    loadLookups();
    loadExits();
  }, [authLoading, token, isAuthenticated, canRead, loadLookups, loadExits]);

  const openCreate = React.useCallback(() => {
    router.push(withTenantPath("/pantry/exit", tenantSlug));
  }, [router, tenantSlug]);

  const openEdit = React.useCallback(
    (exit: ApiPantryExit) => {
      if (!canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar saídas.",
        });
        return;
      }
      setEditing(exit);
      setDialogOpen(true);
    },
    [canUpdate, toast],
  );

  const onDelete = React.useCallback(
    async (exit: ApiPantryExit) => {
      if (!token) return;
      if (!canDelete) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para excluir saídas.",
        });
        return;
      }
      const confirmed = await confirm({
        title: "Excluir saída",
        description: "Excluir esta saída?",
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deletePantryExit(token, exit.id);
        await loadExits();
        toast({ title: "Saída excluída", variant: "success" });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao excluir saída.";
        toast({ title: "Falha ao excluir", description: message, variant: "destructive" });
      }
    },
    [token, canDelete, loadExits, confirm, toast],
  );

  const handleSubmit = React.useCallback(
    async (values: PantryExitFormValues) => {
      if (!token) return;
      if (editing && !canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar saídas.",
        });
        return;
      }
      if (!editing && !canCreate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para criar saídas.",
        });
        return;
      }

      const item = items.find((candidate) => candidate.id === values.itemId);
      const rawUnit = values.unit?.trim() ?? "";
      const rawNotes = values.notes?.trim() ?? "";
      const rawExitDate = values.exitDate?.trim() ?? "";
      const rawEventName = values.eventName?.trim() ?? "";
      const rawSector = values.sector?.trim() ?? "";
      const rawNewSector = values.newSector?.trim() ?? "";
      const quantity =
        typeof values.quantity === "number" ? values.quantity : Number(values.quantity);

      if (!values.itemId) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Selecione um alimento.",
        });
        return;
      }
      const sector =
        rawSector === PANTRY_NEW_SECTOR_VALUE ? rawNewSector : rawSector;
      if (!sector) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe o setor (local físico).",
        });
        return;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe uma quantidade válida.",
        });
        return;
      }
      if ((values.type === "EVENT" || values.type === "PARTY") && !rawEventName) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe o nome do evento.",
        });
        return;
      }

      const payload = {
        itemId: values.itemId,
        sector,
        quantity,
        unit: rawUnit || item?.unit || "unidade",
        exitDate: rawExitDate || undefined,
        type: values.type,
        eventName: rawEventName ? rawEventName : null,
        notes: rawNotes ? rawNotes : null,
      };

      setSaving(true);
      try {
        if (rawSector === PANTRY_NEW_SECTOR_VALUE) {
          try {
            await createPantrySector(token, { name: sector });
          } catch {
            // best-effort
          }
        }
        if (editing) {
          await updatePantryExit(token, editing.id, payload);
        } else {
          await createPantryExit(token, payload);
        }
        setDialogOpen(false);
        setEditing(null);
        await loadExits();
        toast({
          title: editing ? "Saída atualizada" : "Saída criada",
          variant: "success",
        });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar saída.";
        toast({ title: "Falha ao salvar", description: message, variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [token, editing, canUpdate, canCreate, items, loadExits, toast],
  );

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageControlPanel
        searchSlot={<SearchBar value={search} onChange={setSearch} placeholder="Pesquisar saídas" />}
        viewSwitcherSlot={
          <ViewSwitcher
            value={screenState.view}
            options={viewOptions}
            onChange={(next) => setScreenState((prev) => ({ ...prev, view: next }))}
          />
        }
        rightSlot={
          <>
            <Button size="sm" variant="outline" onClick={loadExits} disabled={loading}>
              Atualizar
            </Button>
            <Button size="sm" onClick={openCreate} disabled={!canCreate}>
              Nova saída
            </Button>
            <div className="text-xs text-muted-foreground">
              Total:{" "}
              <span className="font-mono tabular-nums text-foreground">
                {totalCount.toLocaleString("pt-BR")}
              </span>
            </div>
          </>
        }
      />

      <SectionCard
        title="Saídas"
        subtitle="Registro rápido de consumo/uso."
      >
        {screenState.view === "table" ? (
          <DataTable
            columns={columns}
            data={rows}
            manualPagination
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={totalCount}
            toolbar={{ hideSearch: true, hideFiltersButton: true }}
            showExportMenu
            exportLabels={{ title: "Relatório", pdf: "Imprimir (PDF)", csv: "Baixar CSV" }}
            exportMeta={{ title: "Despensa - Saídas" }}
            rowActions={[
              { id: "edit", label: "Editar", onSelect: openEdit },
              { id: "delete", label: "Excluir", destructive: true, onSelect: onDelete },
            ]}
          />
        ) : (
          <div className="space-y-3">
            <KanbanView<ApiPantryExit>
              items={rows}
              getColumnKey={(row) => exitTypeLabel(row.type)}
              renderCard={(row) => (
                <div className="rounded-md border border-border/60 bg-background px-3 py-2 hover:bg-muted/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {row.item?.name ?? row.itemId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(row.exitDate ?? "").slice(0, 10)} • Setor: {row.sector}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm tabular-nums text-foreground">
                        {Number(row.quantity).toLocaleString("pt-BR")} {row.unit}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{exitTypeLabel(row.type)}</Badge>
                    {row.eventName ? <Badge variant="secondary">{row.eventName}</Badge> : null}
                  </div>
                </div>
              )}
            />
            <PaginationBar
              pageIndex={pagination.pageIndex}
              pageCount={pageCount}
              pageSize={pagination.pageSize}
              onPageIndexChange={(next) =>
                setPagination((prev) => ({ ...prev, pageIndex: next }))
              }
              onPageSizeChange={(next) =>
                setPagination((prev) => ({ ...prev, pageSize: next, pageIndex: 0 }))
              }
              disabled={loading}
            />
          </div>
        )}
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionCard>

      <SectionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar saída" : "Nova saída"}
        description="Registro rápido de consumo/uso da despensa."
        contentClassName="max-w-[720px]"
      >
        <FormEngine<PantryExitFormValues>
          fields={buildPantryExitFormFields({ itemOptions, sectorOptions })}
          initialValues={
            editing
              ? {
                  itemId: editing.itemId,
                  sector: editing.sector ?? "Geral",
                  newSector: "",
                  quantity: editing.quantity,
                  unit: editing.unit,
                  exitDate: toDateOnly(editing.exitDate),
                  type: editing.type,
                  eventName: editing.eventName ?? "",
                  notes: editing.notes ?? "",
                }
              : {
                  itemId: "",
                  sector: "Geral",
                  newSector: "",
                  quantity: "",
                  unit: "",
                  exitDate: todayIsoDate(),
                  type: "ATTENDED",
                  eventName: "",
                  notes: "",
                }
          }
          onFieldChange={({ name, value, nextValues }) => {
            if (name === "sector") {
              const nextSector = String(value ?? "").trim();
              if (nextSector !== PANTRY_NEW_SECTOR_VALUE && nextValues.newSector) {
                return { newSector: "" };
              }
            }
            if (name !== "itemId") return;
            const itemId = String(value ?? "").trim();
            const item = itemMap.get(itemId);
            if (!item) {
              return { sector: "Geral", unit: "", newSector: "" };
            }
            return {
              sector: item.defaultSector || "Geral",
              unit: item.unit || "",
              newSector: "",
            };
          }}
          disabled={saving}
          onSubmit={handleSubmit}
          actions={{
            submit: {
              label: saving ? "Salvando..." : "Salvar",
              variant: "primary",
            },
            cancel: {
              label: "Cancelar",
              variant: "ghost",
              onClick: () => setDialogOpen(false),
            },
          }}
        />
      </SectionDialog>
    </div>
  );
}
