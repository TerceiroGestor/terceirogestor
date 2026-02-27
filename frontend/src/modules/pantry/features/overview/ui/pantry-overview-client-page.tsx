"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Package,
  PackagePlus,
  SlidersHorizontal,
  Table2,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRegisterUsageDocumentation } from "@/components/UsageDocumentation/UsageDocumentationProvider";
import { PantryEntryEditDialog } from "@/modules/pantry/features/entries/ui/pantry-entry-edit-dialog";
import { PantryExitEditDialog } from "@/modules/pantry/features/exits/ui/pantry-exit-edit-dialog";
import { PantryItemEditDialog } from "@/modules/pantry/features/items/ui/pantry-item-edit-dialog";
import { pantryOverviewStockColumns } from "@/modules/pantry/features/overview/config/pantry-overview-stock-columns";
import { PANTRY_OVERVIEW_USAGE } from "@/modules/pantry/features/overview/domain/pantry-overview.constants";
import { usePantryOverviewModel } from "@/modules/pantry/features/overview/hooks/use-pantry-overview-model";
import { PantryAlertsDropdown } from "@/modules/pantry/features/overview/ui/components/pantry-alerts-dropdown";
import { PantryOverviewStockSection } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-stock-section";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { ViewSwitcher } from "@/web-client/control-panel/ViewSwitcher";
import { CreateDropdown } from "@/web-client/control-panel/CreateDropdown";
import { SearchPanelMenu } from "@/web-client/control-panel/SearchPanelMenu";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import type { Domain } from "@/web-client/domain/types";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import { pantryStockSearchView } from "@/web-client/registry/searchViews/pantry";
import { createRestDataProvider } from "@/web-client/data-provider";
import { useAuth } from "@/features/auth/auth-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePersistedUrlState } from "@/web-client/screen/usePersistedUrlState";
import type { RecordBrowserViewOption } from "@/components/record-browser/RecordBrowserViewSwitcher";
import type { PantryDashboardResponse } from "@/modules/pantry/api";
import { PaginationBar } from "@/web-client/ui/PaginationBar";

type StockRow = PantryDashboardResponse["stockRows"][number];

type PantryStockView = "list" | "kanban";

type PantryStockFilters = {
  view: PantryStockView;
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

type PantryStockFavoriteState = Pick<
  PantryStockFilters,
  "view" | "searchText" | "domain" | "groupBy" | "pageSize"
>;

function normalizeView(value: string | null): PantryStockView {
  switch (value) {
    case "kanban":
    // legacy alias from overview
    case "cards":
      return "kanban";
    default:
      return "list";
  }
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const parsePantryStockFilters = (
  params: URLSearchParams,
): PantryStockFilters => {
  const view = normalizeView(params.get("view") ?? params.get("v"));
  const searchText = params.get("q") ?? "";
  const domain = parseDomain(params.get("d")) ?? null;
  const groupParam = params.get("g");
  const groupBy =
    groupParam === "none"
      ? []
      : (groupParam ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
  const page = parsePositiveInt(params.get("page"), 1);
  const limit = parsePositiveInt(params.get("limit"), 100);

  return {
    view,
    searchText,
    domain,
    groupBy: groupParam === "none" ? [] : groupBy,
    pageIndex: page - 1,
    pageSize: Math.min(Math.max(limit, 1), 200),
  };
};

const serializePantryStockFilters = (state: PantryStockFilters) => ({
  view: state.view === "list" ? undefined : state.view,
  q: state.searchText.trim() ? state.searchText.trim() : undefined,
  d: state.domain ? serializeDomain(state.domain) : undefined,
  g: state.groupBy.length ? state.groupBy.join(",") : undefined,
  page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
  limit: state.pageSize === 100 ? undefined : String(state.pageSize),
});

export function PantryOverviewClientPage() {
  const { token } = useAuth();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const model = usePantryOverviewModel();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const dataProvider = React.useMemo(
    () => createRestDataProvider({ token }),
    [token],
  );

  const [filters, setFilters] = usePersistedUrlState<PantryStockFilters>({
    storageKey: "screenState:pantry.overview.stock",
    trackedKeys: ["view", "v", "q", "d", "g", "page", "limit"],
    parse: parsePantryStockFilters,
    serialize: serializePantryStockFilters,
  });

  const [rows, setRows] = React.useState<StockRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);

  const enabled = Boolean(
    token && isAuthenticated && model.canRead && !authLoading,
  );

  const viewOptions = React.useMemo<RecordBrowserViewOption<PantryStockView>[]>(
    () => [
      { value: "list", label: "Tabela", icon: <Table2 className="size-4" /> },
      {
        value: "kanban",
        label: "Kanban",
        icon: <LayoutGrid className="size-4" />,
      },
    ],
    [],
  );

  const openExitPage = React.useCallback(
    (params?: { itemId?: string; sector?: string }) => {
      const base = withTenantPath("/pantry/exit", tenantSlug);
      if (!params?.itemId) {
        router.push(base);
        return;
      }
      const qs = new URLSearchParams();
      qs.set("itemId", params.itemId);
      if (params.sector) qs.set("sector", params.sector);
      router.push(`${base}?${qs.toString()}`);
    },
    [router, tenantSlug],
  );

  const openCreateItemPage = React.useCallback(() => {
    router.push(withTenantPath("/pantry/items/new", tenantSlug));
  }, [router, tenantSlug]);

  const openCreateEntryPage = React.useCallback(() => {
    router.push(withTenantPath("/pantry/entries/new", tenantSlug));
  }, [router, tenantSlug]);

  const usageItems = React.useMemo(
    () =>
      PANTRY_OVERVIEW_USAGE.sections.map((section, index) => ({
        id: `pantry-overview-${index}`,
        title: section.title,
        searchText: section.items.join(" "),
        content: (
          <ul className="list-disc space-y-1 pl-5">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ),
      })),
    [],
  );

  useRegisterUsageDocumentation({
    title: PANTRY_OVERVIEW_USAGE.title,
    items: usageItems,
  });

  React.useEffect(() => {
    if (!model.error) return;
    toast({
      variant: "destructive",
      title: "Falha ao carregar",
      description: model.error,
    });
  }, [model.error, toast]);

  React.useEffect(() => {
    if (!error) return;
    toast({
      variant: "destructive",
      title: "Falha ao carregar",
      description: error,
    });
  }, [error, toast]);

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [debouncedDomainKey, setDebouncedDomainKey] = React.useState("");

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.searchText.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [filters.searchText]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDomainKey(
        filters.domain ? serializeDomain(filters.domain) : "",
      );
    }, 350);
    return () => clearTimeout(handler);
  }, [filters.domain]);

  const resetPaginationKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const key = `${debouncedSearch}:${debouncedDomainKey}`;
    if (resetPaginationKeyRef.current === null) {
      resetPaginationKeyRef.current = key;
      return;
    }
    if (resetPaginationKeyRef.current === key) return;
    resetPaginationKeyRef.current = key;
    setFilters((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [debouncedSearch, debouncedDomainKey, setFilters]);

  const requestKey = React.useMemo(() => {
    return `${filters.pageIndex}:${filters.pageSize}:${debouncedSearch}:${debouncedDomainKey}`;
  }, [
    debouncedDomainKey,
    debouncedSearch,
    filters.pageIndex,
    filters.pageSize,
  ]);

  const inFlightRequestRef = React.useRef<string | null>(null);
  const lastRequestRef = React.useRef<string | null>(null);

  const loadStock = React.useCallback(
    async (force = false) => {
      if (!enabled) return;

      if (!force) {
        if (inFlightRequestRef.current === requestKey) return;
        if (lastRequestRef.current === requestKey) return;
      }

      inFlightRequestRef.current = requestKey;
      setLoading(true);
      setError(null);
      try {
        const response = await dataProvider.search<StockRow>("pantry.stock", {
          domain: filters.domain,
          searchText: debouncedSearch || undefined,
          pagination: {
            pageIndex: filters.pageIndex,
            pageSize: filters.pageSize,
          },
        });

        setRows(response.data);
        setTotalCount(response.pagination.total);
        setPageCount(response.pagination.pages);
        lastRequestRef.current = requestKey;
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao carregar estoque.";
        setError(message);
        setRows([]);
        setTotalCount(0);
        setPageCount(0);
        lastRequestRef.current = requestKey;
      } finally {
        inFlightRequestRef.current = null;
        setLoading(false);
      }
    },
    [
      dataProvider,
      debouncedSearch,
      enabled,
      filters.domain,
      filters.pageIndex,
      filters.pageSize,
      requestKey,
    ],
  );

  React.useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void loadStock();
  }, [enabled, loadStock, requestKey]);

  const removeDomainCondition = React.useCallback(
    (index: number) => {
      setFilters((prev) => {
        const nextDomain = removeConditionAtIndex(prev.domain, "and", index);
        return { ...prev, domain: nextDomain, pageIndex: 0 };
      });
    },
    [setFilters],
  );

  const queryFacets = React.useMemo(
    () =>
      buildQueryFacets({
        domain: filters.domain,
        groupBy: filters.groupBy,
        searchView: pantryStockSearchView,
        onClearGroupBy: () => setFilters((prev) => ({ ...prev, groupBy: [] })),
        onClearDomain: () =>
          setFilters((prev) => ({ ...prev, domain: null, pageIndex: 0 })),
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [filters.domain, filters.groupBy, removeDomainCondition, setFilters],
  );

  const valueSuggestions = React.useMemo(() => {
    const sectors = new Set<string>();
    const groups = new Set<string>();

    model.stockRows.forEach((row) => {
      const sector = String(row.sector ?? "").trim();
      if (sector) sectors.add(sector);
      const group = String(row.group ?? "").trim();
      if (group) groups.add(group);
    });

    const sectorList = Array.from(sectors).sort((a, b) => a.localeCompare(b));
    const groupList = Array.from(groups).sort((a, b) => a.localeCompare(b));

    return (fieldName: string) => {
      if (fieldName === "sector") return sectorList;
      if (fieldName === "group") return groupList;
      return [];
    };
  }, [model.stockRows]);

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
        primaryActionSlot={
          <CreateDropdown
            items={[
              {
                id: "create-item",
                label: "Novo alimento",
                icon: <Package className="size-4" />,
                onSelect: openCreateItemPage,
              },
              {
                id: "create-entry",
                label: "Nova entrada",
                icon: <PackagePlus className="size-4" />,
                onSelect: openCreateEntryPage,
              },
              {
                id: "create-exit",
                label: "Nova saída",
                icon: <Truck className="size-4" />,
                onSelect: () => openExitPage(),
              },
            ]}
          />
        }
        searchSlot={
          <SearchBar
            value={filters.searchText}
            onChange={(next) =>
              setFilters((prev) => ({ ...prev, searchText: next }))
            }
            placeholder="Pesquisar"
            facets={queryFacets}
            rightSlot={
              <SearchPanelMenu<PantryStockFavoriteState>
                actionId="pantry.stock"
                variant="compact"
                allowEmptyGroupBy
                groupByMode="multi"
                valueSuggestions={valueSuggestions}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Filtros"
                    aria-label="Filtros"
                  >
                    <SlidersHorizontal className="size-4" />
                  </Button>
                }
                searchView={pantryStockSearchView}
                domain={filters.domain}
                onDomainChange={(domain) =>
                  setFilters((prev) => ({ ...prev, domain }))
                }
                groupBy={filters.groupBy}
                onGroupByChange={(groupBy) =>
                  setFilters((prev) => ({ ...prev, groupBy }))
                }
                snapshot={{
                  view: filters.view,
                  searchText: filters.searchText,
                  domain: filters.domain,
                  groupBy: filters.groupBy,
                  pageSize: filters.pageSize,
                }}
                onApplyFavorite={(state) =>
                  setFilters((prev) => ({
                    ...prev,
                    ...state,
                    groupBy: Array.isArray(state.groupBy)
                      ? state.groupBy
                      : [],
                    pageIndex: 0,
                  }))
                }
              />
            }
          />
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
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await model.handleMovementSaved();
                await loadStock(true);
              }}
              disabled={loading}
            >
              Atualizar
            </Button>
            <PantryAlertsDropdown
              expiringAlerts={model.expiringAlerts}
              onOpenMovement={(params) =>
                openExitPage({ itemId: params.itemId, sector: params.sector })
              }
              onRefreshAlerts={model.handleAlertsRefresh}
            />
          </>
        }
      />

      <PantryOverviewStockSection
        rows={rows}
        columns={pantryOverviewStockColumns}
        view={filters.view}
        groupBy={filters.groupBy}
        onRowClick={(row) => {
          openExitPage({ itemId: row.itemId, sector: row.sector });
        }}
        rowActions={[
          {
            id: "edit",
            label: "Editar alimento",
            onSelect: (row) => {
              model.setEditingItem({
                itemId: row.itemId,
                name: row.name,
                group: row.group,
                unit: row.unit,
                minStock: row.minStock,
                sector: row.sector,
              });
              model.setEditItemOpen(true);
            },
          },
        ]}
      />

      {pageCount > 1 ? (
        <PaginationBar
          pageIndex={filters.pageIndex}
          pageCount={pageCount}
          pageSize={filters.pageSize}
          onPageIndexChange={(next) =>
            setFilters((prev) => ({ ...prev, pageIndex: next }))
          }
          onPageSizeChange={(next) =>
            setFilters((prev) => ({ ...prev, pageSize: next, pageIndex: 0 }))
          }
          disabled={loading}
        />
      ) : null}

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}
      {!loading && totalCount === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum registro.</p>
      ) : null}

      <PantryEntryEditDialog
        open={model.editEntryOpen}
        onOpenChange={(open) => {
          model.setEditEntryOpen(open);
          if (!open) model.setEditingEntryId(null);
        }}
        entryId={model.editingEntryId}
        onSaved={model.handleMovementSaved}
      />

      <PantryExitEditDialog
        open={model.editExitOpen}
        onOpenChange={(open) => {
          model.setEditExitOpen(open);
          if (!open) model.setEditingExitId(null);
        }}
        exitId={model.editingExitId}
        onSaved={model.handleMovementSaved}
      />

      <PantryItemEditDialog
        open={model.editItemOpen}
        onOpenChange={(open) => {
          model.setEditItemOpen(open);
          if (!open) model.setEditingItem(null);
        }}
        item={
          model.editingItem
            ? {
                id: model.editingItem.itemId,
                name: model.editingItem.name,
                group: model.editingItem.group ?? null,
                defaultSector: model.editingItem.sector ?? "Geral",
                unit: model.editingItem.unit,
                minStock: model.editingItem.minStock,
              }
            : null
        }
        onSaved={async () => {
          await model.handleMovementSaved();
        }}
      />
    </div>
  );
}
