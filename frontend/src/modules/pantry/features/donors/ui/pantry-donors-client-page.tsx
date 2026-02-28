"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { SearchPanelMenu } from "@/web-client/control-panel/SearchPanelMenu";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import type { Domain } from "@/web-client/domain/types";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { pantryDonorsSearchView } from "@/web-client/registry/searchViews/pantry";
import { usePersistedUrlState } from "@/web-client/screen/usePersistedUrlState";
import { createRestDataProvider } from "@/web-client/data-provider";
import { ListView } from "@/web-client/views/ListView";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import type { ApiPantryDonor } from "@/modules/pantry/api";
import { PantryDonorCreateDialog } from "@/modules/pantry/features/donors/ui/pantry-donor-create-dialog";
import { PANTRY_ACTION_IDS, PANTRY_ROUTES, PANTRY_SCREEN_STATE_KEYS } from "@/modules/pantry/shared/domain/pantry.constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PantryDonorsFilters = {
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

type PantryDonorsFavoriteState = Pick<PantryDonorsFilters, "searchText" | "domain" | "groupBy" | "pageSize">;

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const parseFilters = (params: URLSearchParams): PantryDonorsFilters => {
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
  const limit = parsePositiveInt(params.get("limit"), 50);

  return {
    searchText,
    domain,
    groupBy: groupParam === "none" ? [] : groupBy,
    pageIndex: page - 1,
    pageSize: Math.min(Math.max(limit, 1), 200),
  };
};

const serializeFilters = (state: PantryDonorsFilters) => ({
  q: state.searchText.trim() ? state.searchText.trim() : undefined,
  d: state.domain ? serializeDomain(state.domain) : undefined,
  g: state.groupBy.length ? state.groupBy.join(",") : undefined,
  page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
  limit: state.pageSize === 50 ? undefined : String(state.pageSize),
});

function typeLabel(value: ApiPantryDonor["type"]) {
  return value === "COMPANY" ? "Empresa" : "Pessoa";
}

export function PantryDonorsClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");

  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const [filters, setFilters] = usePersistedUrlState<PantryDonorsFilters>({
    storageKey: PANTRY_SCREEN_STATE_KEYS.donors,
    trackedKeys: ["q", "d", "g", "page", "limit"],
    parse: parseFilters,
    serialize: serializeFilters,
  });

  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<ApiPantryDonor[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageCount, setPageCount] = React.useState(0);

  const requestKey = React.useMemo(
    () => JSON.stringify({ q: filters.searchText, d: filters.domain, p: filters.pageIndex, l: filters.pageSize }),
    [filters.domain, filters.pageIndex, filters.pageSize, filters.searchText],
  );

  const loadRows = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    try {
      const res = await dataProvider.search<ApiPantryDonor>("pantry.donors", {
        domain: filters.domain,
        searchText: filters.searchText.trim() ? filters.searchText.trim() : undefined,
        pagination: { pageIndex: filters.pageIndex, pageSize: filters.pageSize },
      });
      setRows(res.data ?? []);
      setTotalCount(res.pagination.total);
      setPageCount(res.pagination.pages);
    } finally {
      setLoading(false);
    }
  }, [canRead, dataProvider, filters.domain, filters.pageIndex, filters.pageSize, filters.searchText, token]);

  React.useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const removeDomainCondition = React.useCallback(
    (index: number) => {
      setFilters((prev) => ({
        ...prev,
        domain: removeConditionAtIndex(prev.domain, "and", index),
        pageIndex: 0,
      }));
    },
    [setFilters],
  );

  const queryFacets = React.useMemo(
    () =>
      buildQueryFacets({
        domain: filters.domain,
        groupBy: filters.groupBy,
        searchView: pantryDonorsSearchView,
        onClearGroupBy: () => setFilters((prev) => ({ ...prev, groupBy: [] })),
        onClearDomain: () => setFilters((prev) => ({ ...prev, domain: null, pageIndex: 0 })),
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [filters.domain, filters.groupBy, removeDomainCondition, setFilters],
  );

  const valueSuggestions = React.useMemo(() => {
    const types = Array.from(new Set(rows.map((r) => r.type))).sort();
    return (fieldName: string) => {
      if (fieldName === "type") return types;
      return [];
    };
  }, [rows]);

  const columns = React.useMemo<ColumnDef<ApiPantryDonor, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => <div className="text-sm text-muted-foreground">{typeLabel(row.original.type)}</div>,
      },
      {
        accessorKey: "contact",
        header: "Contato",
        cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.contact ?? "—"}</div>,
      },
      {
        accessorKey: "createdAt",
        header: "Criado em",
        cell: ({ row }) => <div className="text-sm text-muted-foreground">{formatDateOnlyPtBR(row.original.createdAt)}</div>,
      },
    ],
    [],
  );

  const [newDonorOpen, setNewDonorOpen] = React.useState(false);

  if (!canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Você não tem permissão.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <PageControlPanel
        primaryActionSlot={
          canCreate ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" className="h-8 gap-2">
                  <Plus className="size-4" />
                  Novo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => router.push(withTenantPath(PANTRY_ROUTES.itemsNew, tenantSlug))}>
                  Novo alimento
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setNewDonorOpen(true)}>Novo doador</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : undefined
        }
        searchSlot={
          <SearchBar
            value={filters.searchText}
            onChange={(next) => setFilters((prev) => ({ ...prev, searchText: next }))}
            placeholder="Pesquisar"
            facets={queryFacets}
            rightSlot={
              <SearchPanelMenu<PantryDonorsFavoriteState>
                actionId={PANTRY_ACTION_IDS.donors}
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
                searchView={pantryDonorsSearchView}
                domain={filters.domain}
                onDomainChange={(domain) => setFilters((prev) => ({ ...prev, domain }))}
                groupBy={filters.groupBy}
                onGroupByChange={(groupBy) => setFilters((prev) => ({ ...prev, groupBy }))}
                snapshot={{
                  searchText: filters.searchText,
                  domain: filters.domain,
                  groupBy: filters.groupBy,
                  pageSize: filters.pageSize,
                }}
                onApplyFavorite={(state) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchText: state.searchText,
                    domain: state.domain,
                    groupBy: state.groupBy,
                    pageSize: state.pageSize,
                    pageIndex: 0,
                  }))
                }
              />
            }
          />
        }
        rightSlot={
          <div className="whitespace-nowrap text-[11px] text-muted-foreground">
            Total:{" "}
            <span className="font-mono tabular-nums text-foreground">
              {totalCount.toLocaleString("pt-BR")}
            </span>
          </div>
        }
      />

      <div className="flex flex-col gap-2">
        <ListView<ApiPantryDonor>
          data={rows}
          columns={columns}
          groupByFields={filters.groupBy}
          resolveGroupLabel={(field, groupValue) => (field === "type" ? typeLabel(groupValue as ApiPantryDonor["type"]) : String(groupValue))}
          enableRowSelection={false}
        />

        <PaginationBar
          pageIndex={filters.pageIndex}
          pageCount={pageCount}
          pageSize={filters.pageSize}
          disabled={loading}
          onPageIndexChange={(pageIndex) => setFilters((prev) => ({ ...prev, pageIndex }))}
          onPageSizeChange={(pageSize) =>
            setFilters((prev) => ({ ...prev, pageIndex: 0, pageSize }))
          }
        />
      </div>

      <PantryDonorCreateDialog
        open={newDonorOpen}
        onOpenChange={setNewDonorOpen}
        onCreated={() => loadRows()}
      />
    </div>
  );
}
