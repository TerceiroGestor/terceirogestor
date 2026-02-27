"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { FormEngine } from "@/components/FormEngine";
import { SectionDialog } from "@/components/section-dialog";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantryItem,
  createPantrySector,
  deletePantryItem,
  listPantryItems,
  listPantrySectors,
  updatePantryItem,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import {
  buildPantryItemFormFields,
  PANTRY_NEW_SECTOR_VALUE,
} from "@/modules/pantry/features/items/config/pantry-item-form-config";
import type { PantryItemFormValues } from "@/modules/pantry/shared/domain/types";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { SearchPanelMenu } from "@/web-client/control-panel/SearchPanelMenu";
import { ViewSwitcher } from "@/web-client/control-panel/ViewSwitcher";
import { usePersistedUrlState } from "@/web-client/screen/usePersistedUrlState";
import { KanbanView } from "@/web-client/views/KanbanView";
import { pantryItemsSearchView } from "@/web-client/registry/searchViews/pantry";
import type { RecordBrowserViewOption } from "@/components/record-browser/RecordBrowserViewSwitcher";
import { LayoutGrid, Table2 } from "lucide-react";
import { PaginationBar } from "@/web-client/ui/PaginationBar";

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

function resolveValidityBadge(status: ApiPantryItem["validityStatus"]) {
  switch (status) {
    case "Normal":
      return <Badge variant="secondary">Normal</Badge>;
    case "Atencao":
      return (
        <Badge className="border-transparent bg-amber-500 text-white">
          Atenção
        </Badge>
      );
    case "Alerta":
      return (
        <Badge className="border-transparent bg-orange-500 text-white">
          Alerta
        </Badge>
      );
    case "Urgente":
      return <Badge variant="destructive">Urgente</Badge>;
    case "Vencido":
      return <Badge variant="destructive">Vencido</Badge>;
    default:
      return <Badge variant="outline">Sem validade</Badge>;
  }
}

function normalizeItemValues(values: PantryItemFormValues) {
  const name = values.name?.trim() ?? "";
  const group = values.group?.trim() || null;
  const rawDefaultSector = values.defaultSector?.trim() ?? "";
  const rawNewSector = values.newSector?.trim() ?? "";
  const defaultSector =
    rawDefaultSector === PANTRY_NEW_SECTOR_VALUE ? rawNewSector : rawDefaultSector;
  const unit = values.unit?.trim() ?? "";
  const minStock =
    typeof values.minStock === "number" ? values.minStock : Number(values.minStock);

  return {
    name,
    group,
    defaultSector,
    unit,
    minStock: Number.isFinite(minStock) ? minStock : 0,
  };
}

type PantryItemsView = "table" | "kanban";

type PantryItemsFilters = {
  view: PantryItemsView;
  searchText: string;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

type PantryItemsFavoriteState = Pick<
  PantryItemsFilters,
  "view" | "searchText" | "groupBy" | "pageSize"
>;

const DEFAULT_GROUP_BY = ["defaultSector"];

function normalizeView(value: string | null): PantryItemsView {
  return value === "kanban" ? "kanban" : "table";
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const parsePantryItemsFilters = (params: URLSearchParams): PantryItemsFilters => {
  const view = normalizeView(params.get("view") ?? params.get("v"));
  const searchText = params.get("q") ?? "";
  const groupBy = (params.get("g") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const page = parsePositiveInt(params.get("page"), 1);
  const limit = parsePositiveInt(params.get("limit"), 10);

  return {
    view,
    searchText,
    groupBy: groupBy.length ? groupBy : DEFAULT_GROUP_BY,
    pageIndex: page - 1,
    pageSize: Math.min(Math.max(limit, 1), 200),
  };
};

const serializePantryItemsFilters = (state: PantryItemsFilters) => ({
  view: state.view === "table" ? undefined : state.view,
  q: state.searchText.trim() ? state.searchText.trim() : undefined,
  g: state.groupBy[0] && state.groupBy[0] !== DEFAULT_GROUP_BY[0] ? state.groupBy.join(",") : undefined,
  page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
  limit: state.pageSize === 10 ? undefined : String(state.pageSize),
});

export function PantryItemsClientPage() {
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

  const [rows, setRows] = React.useState<ApiPantryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sectors, setSectors] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);

  const [filters, setFilters] = usePersistedUrlState<PantryItemsFilters>({
    storageKey: "screenState:pantry.items",
    trackedKeys: ["view", "v", "q", "g", "page", "limit"],
    parse: parsePantryItemsFilters,
    serialize: serializePantryItemsFilters,
  });

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const resetPaginationKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.searchText.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [filters.searchText]);

  React.useEffect(() => {
    const key = debouncedSearch;
    if (resetPaginationKeyRef.current === null) {
      resetPaginationKeyRef.current = key;
      return;
    }
    if (resetPaginationKeyRef.current === key) return;
    resetPaginationKeyRef.current = key;
    setFilters((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [debouncedSearch, setFilters]);

  const viewOptions = React.useMemo<RecordBrowserViewOption<"table" | "kanban">[]>(
    () => [
      { value: "table", label: "Tabela", icon: <Table2 className="size-4" /> },
      { value: "kanban", label: "Kanban", icon: <LayoutGrid className="size-4" /> },
    ],
    [],
  );

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiPantryItem | null>(null);
  const [saving, setSaving] = React.useState(false);

  const openExitPage = React.useCallback(
    (item: ApiPantryItem) => {
      const qs = new URLSearchParams();
      qs.set("itemId", item.id);
      router.push(`${withTenantPath("/pantry/exit", tenantSlug)}?${qs.toString()}`);
    },
    [router, tenantSlug],
  );

  const columns = React.useMemo<ColumnDef<ApiPantryItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Alimento",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {row.original.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.group || "Sem grupo"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "unit",
        header: "Unidade",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: "stock",
        header: "Saldo",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-mono tabular-nums text-foreground">
              {Number(row.original.stock).toLocaleString("pt-BR")}
            </p>
            {row.original.isBelowMin ? (
              <Badge variant="destructive">Abaixo do mínimo</Badge>
            ) : (
              <Badge variant="secondary">OK</Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "minStock",
        header: "Mínimo",
        cell: ({ row }) => (
          <span className="text-xs font-mono tabular-nums text-muted-foreground">
            {Number(row.original.minStock).toLocaleString("pt-BR")}
          </span>
        ),
      },
      {
        accessorKey: "validityStatus",
        header: "Validade",
        cell: ({ row }) => (
          <div className="space-y-1">
            {resolveValidityBadge(row.original.validityStatus)}
            <p className="text-[11px] text-muted-foreground">
              {row.original.nextExpiryDate
                ? `${formatDate(row.original.nextExpiryDate)}${
                    row.original.daysToExpire !== null
                      ? ` • ${row.original.daysToExpire} dia(s)`
                      : ""
                  }`
                : "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "lastMovementDate",
        header: "Último movimento",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.lastMovementDate)}
          </span>
        ),
      },
    ],
    [],
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
    if (editing?.defaultSector) push(editing.defaultSector);
    push("Geral");

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [editing?.defaultSector, sectors]);

  const formFields = React.useMemo(
    () => buildPantryItemFormFields({ sectorOptions }),
    [sectorOptions],
  );

  const loadLookups = React.useCallback(async () => {
    if (!token || !canRead) return;
    try {
      const sectorsResponse = await listPantrySectors(token);
      setSectors(sectorsResponse.data ?? []);
    } catch {
      // lookup failure should not block listing
    }
  }, [token, canRead]);

  const loadItems = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    try {
      const response = await listPantryItems(token, {
        q: debouncedSearch || undefined,
        page: filters.pageIndex + 1,
        limit: filters.pageSize,
      });
      setRows(response.data);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar alimentos.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, canRead, filters.pageIndex, filters.pageSize, debouncedSearch, toast]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canRead) {
      setLoading(false);
      return;
    }
    loadLookups();
    loadItems();
  }, [authLoading, token, isAuthenticated, canRead, loadLookups, loadItems]);

  const openCreate = React.useCallback(() => {
    router.push(withTenantPath("/pantry/items/new", tenantSlug));
  }, [router, tenantSlug]);

  const openEdit = React.useCallback(
    (item: ApiPantryItem) => {
      if (!canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar alimentos.",
        });
        return;
      }
      setEditing(item);
      setDialogOpen(true);
    },
    [canUpdate, toast],
  );

  const onDelete = React.useCallback(
    async (item: ApiPantryItem) => {
      if (!token) return;
      if (!canDelete) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para excluir alimentos.",
        });
        return;
      }
      const confirmed = await confirm({
        title: "Excluir alimento",
        description: `Excluir o alimento "${item.name}"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deletePantryItem(token, item.id);
        await loadItems();
        toast({ title: "Alimento excluído", variant: "success" });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao excluir alimento.";
        toast({ title: "Falha ao excluir", description: message, variant: "destructive" });
      }
    },
    [token, canDelete, loadItems, confirm, toast],
  );

  const handleSubmit = React.useCallback(
    async (values: PantryItemFormValues) => {
      if (!token) return;
      if (editing && !canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar alimentos.",
        });
        return;
      }
      if (!editing && !canCreate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para criar alimentos.",
        });
        return;
      }

      const payload = normalizeItemValues(values);
      if (!payload.name || !payload.unit) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Preencha nome e unidade.",
        });
        return;
      }
      if (!payload.defaultSector) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe o setor padrão.",
        });
        return;
      }

      setSaving(true);
      try {
        if (values.defaultSector?.trim() === PANTRY_NEW_SECTOR_VALUE) {
          try {
            await createPantrySector(token, { name: payload.defaultSector });
            await loadLookups();
          } catch {
            // best-effort
          }
        }
        if (editing) {
          await updatePantryItem(token, editing.id, payload);
        } else {
          await createPantryItem(token, payload);
        }
        setDialogOpen(false);
        setEditing(null);
        await loadItems();
        toast({
          title: editing ? "Alimento atualizado" : "Alimento criado",
          variant: "success",
        });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar alimento.";
        toast({ title: "Falha ao salvar", description: message, variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [token, editing, canUpdate, canCreate, loadLookups, loadItems, toast],
  );

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  const resolvedPageCount =
    pageCount > 0 ? pageCount : totalCount > 0 ? Math.ceil(totalCount / filters.pageSize) : 0;

  return (
    <div className="flex flex-col gap-4">
      <PageControlPanel
        primaryAction={
          canCreate
            ? {
                label: "Novo",
                onClick: openCreate,
              }
            : undefined
        }
        searchSlot={
          <div className="flex w-full items-center gap-1">
            <SearchBar
              value={filters.searchText}
              onChange={(next) => setFilters((prev) => ({ ...prev, searchText: next }))}
              placeholder="Pesquisar alimentos"
              className="flex-1"
            />
            <SearchPanelMenu<PantryItemsFavoriteState>
              actionId="pantry.items"
              searchView={pantryItemsSearchView}
              domain={null}
              onDomainChange={() => {}}
              groupBy={filters.groupBy}
              onGroupByChange={(groupBy) =>
                setFilters((prev) => ({
                  ...prev,
                  groupBy: groupBy.length ? groupBy : DEFAULT_GROUP_BY,
                }))
              }
              snapshot={{
                view: filters.view,
                searchText: filters.searchText,
                groupBy: filters.groupBy,
                pageSize: filters.pageSize,
              }}
              onApplyFavorite={(state) =>
                setFilters((prev) => ({
                  ...prev,
                  ...state,
                  pageIndex: 0,
                }))
              }
            />
          </div>
        }
        viewSwitcherSlot={
          <ViewSwitcher
            value={filters.view}
            options={viewOptions}
            onChange={(next) => setFilters((prev) => ({ ...prev, view: next }))}
          />
        }
        rightSlot={
          <>
            <Button size="sm" variant="outline" onClick={loadItems} disabled={loading}>
              Atualizar
            </Button>
            <div className="whitespace-nowrap text-[11px] text-muted-foreground">
              Total:{" "}
              <span className="font-mono tabular-nums text-foreground">
                {totalCount.toLocaleString("pt-BR")}
              </span>
            </div>
          </>
        }
      />

      <div className="w-full">
        {filters.view === "table" ? (
          <DataTable
            columns={columns}
            data={rows}
            manualPagination
            pageCount={resolvedPageCount}
            pagination={{ pageIndex: filters.pageIndex, pageSize: filters.pageSize }}
            onPaginationChange={(next) =>
              setFilters((prev) => ({
                ...prev,
                pageIndex: next.pageIndex,
                pageSize: next.pageSize,
              }))
            }
            totalCount={totalCount}
            toolbar={{ hidden: true }}
            rowActions={[
              { id: "move", label: "Movimentar", onSelect: openExitPage },
              { id: "edit", label: "Editar", onSelect: openEdit },
              { id: "delete", label: "Excluir", destructive: true, onSelect: onDelete },
            ]}
            onRowClick={(row) => openExitPage(row)}
          />
        ) : (
          <div className="space-y-3">
            <KanbanView<ApiPantryItem>
              items={rows}
              getColumnKey={(item) => {
                const field = filters.groupBy[0] ?? DEFAULT_GROUP_BY[0];
                if (field === "group") return item.group?.trim() || "Sem grupo";
                return item.defaultSector?.trim() || "Geral";
              }}
              renderCard={(item) => (
                <div
                  className="rounded-md border border-border/60 bg-background px-3 py-2 hover:bg-muted/20"
                  role="button"
                  tabIndex={0}
                  onClick={() => openExitPage(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openExitPage(item);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.group || "Sem grupo"} • Unidade: {item.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm tabular-nums text-foreground">
                        {Number(item.stock).toLocaleString("pt-BR")}
                      </div>
                      <div className="text-[11px] text-muted-foreground">saldo</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {resolveValidityBadge(item.validityStatus)}
                    {item.isBelowMin ? (
                      <Badge variant="destructive">Abaixo do mínimo</Badge>
                    ) : (
                      <Badge variant="secondary">OK</Badge>
                    )}
                  </div>
                </div>
              )}
            />
            <PaginationBar
              pageIndex={filters.pageIndex}
              pageCount={resolvedPageCount}
              pageSize={filters.pageSize}
              onPageIndexChange={(next) =>
                setFilters((prev) => ({ ...prev, pageIndex: next }))
              }
              onPageSizeChange={(next) =>
                setFilters((prev) => ({ ...prev, pageSize: next, pageIndex: 0 }))
              }
              disabled={loading}
            />
          </div>
        )}
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </div>

      <SectionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar alimento" : "Novo alimento"}
        description="Cadastro simplificado: nome, unidade e estoque mínimo."
      >
        <FormEngine<PantryItemFormValues>
          fields={formFields}
          initialValues={
            editing
              ? {
                  name: editing.name,
                  group: editing.group ?? "",
                  defaultSector: editing.defaultSector ?? "Geral",
                  newSector: "",
                  unit: editing.unit,
                  minStock: editing.minStock,
                }
              : { unit: "kg", defaultSector: "Geral", newSector: "", minStock: 0 }
          }
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
