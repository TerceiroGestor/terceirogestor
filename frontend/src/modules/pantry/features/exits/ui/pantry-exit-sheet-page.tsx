"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/DataTable";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  listPantryExits,
  listPantryItems,
  type ApiPantryExit,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import {
  PantryMovementWorkspace,
  type PantryMovementDialogItem,
} from "@/modules/pantry/shared/ui/pantry-movement-workspace";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PantryExitEditDialog } from "@/modules/pantry/features/exits/ui/pantry-exit-edit-dialog";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";

export function PantryExitSheetPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const searchParams = useSearchParams();

  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const canRead = permissions.includes("pantry.read");
  const canUpdate = permissions.includes("pantry.update");
  const enabled = Boolean(token && isAuthenticated && canRead && !authLoading);

  const [items, setItems] = React.useState<ApiPantryItem[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);

  const itemId = searchParams.get("itemId") ?? "";
  const sectorParam = searchParams.get("sector") ?? "";
  const [exits, setExits] = React.useState<ApiPantryExit[]>([]);
  const [loadingExits, setLoadingExits] = React.useState(false);
  const [exitsPageCount, setExitsPageCount] = React.useState(0);
  const [exitsTotalCount, setExitsTotalCount] = React.useState(0);
  const [exitsPagination, setExitsPagination] = React.useState({
    pageIndex: 0,
    pageSize: 8,
  });
  const [exitsSearch, setExitsSearch] = React.useState("");
  const [exitsScope, setExitsScope] = React.useState<"item" | "all">(
    itemId ? "item" : "all",
  );
  const [editExitOpen, setEditExitOpen] = React.useState(false);
  const [editingExitId, setEditingExitId] = React.useState<string | null>(null);

  const itemsById = React.useMemo(() => {
    return new Map(items.map((item) => [item.id, item]));
  }, [items]);

  const selectedItem = React.useMemo(() => {
    if (!itemId) return null;
    return itemsById.get(itemId) ?? null;
  }, [itemId, itemsById]);

  const preferredSector = React.useMemo(() => {
    if (sectorParam.trim()) return sectorParam.trim();
    return selectedItem?.defaultSector?.trim() || "Geral";
  }, [sectorParam, selectedItem?.defaultSector]);

  const movementItem = React.useMemo<PantryMovementDialogItem | null>(() => {
    if (!selectedItem) return null;
    return {
      id: selectedItem.id,
      name: selectedItem.name,
      unit: selectedItem.unit,
      stock: selectedItem.stock,
      minStock: selectedItem.minStock,
    };
  }, [selectedItem]);

  const exitTypeLabel = React.useCallback((type: ApiPantryExit["type"] | string) => {
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
  }, []);

  const exitColumns = React.useMemo<ColumnDef<ApiPantryExit>[]>(() => {
    const showItem = exitsScope !== "item" || !itemId;

    const base: ColumnDef<ApiPantryExit>[] = [
      ...(showItem
        ? ([
            {
              id: "itemName",
              accessorFn: (row) => row.item?.name ?? row.itemId,
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
              meta: { dataType: "string" },
            } satisfies ColumnDef<ApiPantryExit>,
          ] as ColumnDef<ApiPantryExit>[])
        : []),
      {
        accessorKey: "sector",
        header: "Setor",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.sector}</span>
        ),
        meta: { dataType: "string" },
      },
      {
        id: "typeLabel",
        accessorFn: (row) => exitTypeLabel(row.type),
        header: "Uso",
        cell: ({ row }) => <Badge variant="outline">{exitTypeLabel(row.original.type)}</Badge>,
        meta: { dataType: "string" },
      },
      {
        accessorKey: "quantity",
        header: "Qtd.",
        cell: ({ row }) => (
          <span className="text-xs font-mono tabular-nums text-foreground">
            {Number(row.original.quantity).toLocaleString("pt-BR")} {row.original.unit}
          </span>
        ),
        meta: { dataType: "number" },
      },
      {
        accessorKey: "eventName",
        header: "Evento",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.eventName || "—"}
          </span>
        ),
        meta: { dataType: "string" },
      },
      {
        accessorKey: "exitDate",
        header: "Data",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {(row.original.exitDate ?? "").slice(0, 10) || "—"}
          </span>
        ),
        meta: { dataType: "date" },
      },
    ];

    return base;
  }, [exitTypeLabel, exitsScope, itemId]);

  const updateQuery = React.useCallback(
    (next: { itemId?: string; sector?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.itemId !== undefined) {
        if (next.itemId) params.set("itemId", next.itemId);
        else params.delete("itemId");
      }
      if (next.sector !== undefined) {
        if (next.sector) params.set("sector", next.sector);
        else params.delete("sector");
      }

      const query = params.toString();
      router.push(
        `${withTenantPath("/pantry/exit", tenantSlug)}${query ? `?${query}` : ""}`,
      );
    },
    [router, searchParams, tenantSlug],
  );

  const loadItems = React.useCallback(async () => {
    if (!enabled || !token) return;
    setLoadingItems(true);
    try {
      const response = await listPantryItems(token, { all: true, limit: 200 });
      setItems(response.data);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [enabled, token]);

  const loadExits = React.useCallback(async () => {
    if (!enabled || !token) return;
    setLoadingExits(true);
    try {
      const response = await listPantryExits(token, {
        q: exitsSearch.trim() || undefined,
        page: exitsPagination.pageIndex + 1,
        limit: exitsPagination.pageSize,
        itemId: exitsScope === "item" && itemId ? itemId : undefined,
      });
      setExits(response.data);
      setExitsTotalCount(response.pagination.total);
      setExitsPageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar saídas.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setExits([]);
      setExitsTotalCount(0);
      setExitsPageCount(0);
    } finally {
      setLoadingExits(false);
    }
  }, [
    enabled,
    exitsPagination.pageIndex,
    exitsPagination.pageSize,
    exitsScope,
    exitsSearch,
    itemId,
    toast,
    token,
  ]);

  React.useEffect(() => {
    void loadItems();
  }, [loadItems]);

  React.useEffect(() => {
    setExitsPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [exitsSearch, exitsScope, itemId]);

  React.useEffect(() => {
    void loadExits();
  }, [loadExits]);

  const itemOptions = React.useMemo(
    () => items.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  );

  if (!canRead) {
    return (
      <div className="px-4 py-4 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <PageControlPanel
        searchSlot={<SearchBar value={exitsSearch} onChange={setExitsSearch} placeholder="Pesquisar saídas" />}
        rightSlot={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void loadItems();
                void loadExits();
              }}
              disabled={loadingItems || loadingExits}
            >
              Atualizar
            </Button>
            <div className="text-xs text-muted-foreground">
              Total:{" "}
              <span className="font-mono tabular-nums text-foreground">
                {exitsTotalCount.toLocaleString("pt-BR")}
              </span>
            </div>
          </>
        }
      />

      <SectionCard
        title="Registrar saída"
        subtitle="Selecione o alimento e registre a saída por lote/validade."
        collapsible
        defaultOpen
      >
        <PantryMovementWorkspace
          enabled={enabled}
          item={movementItem}
          preferredSector={preferredSector}
          onSaved={async () => {
            await Promise.all([loadItems(), loadExits()]);
          }}
          leftTopSlot={
            <div>
              <p className="pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Alimento
              </p>
              <Select
                value={itemId}
                onValueChange={(nextItemId) => {
                  const nextItem = itemsById.get(nextItemId);
                  updateQuery({
                    itemId: nextItemId,
                    sector: nextItem?.defaultSector?.trim() || "Geral",
                  });
                }}
                disabled={!enabled || loadingItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingItems ? "Carregando..." : "Selecione um alimento"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[420px]">
                  {itemOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      </SectionCard>

      <SectionCard
        title="Saídas registradas"
        subtitle={
          exitsScope === "item" && selectedItem
            ? `Saídas do alimento: ${selectedItem.name}`
            : "Saídas recentes registradas na despensa."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {selectedItem ? (
              <ToggleGroup
                type="single"
                value={exitsScope}
                onValueChange={(value) => {
                  if (value === "item" || value === "all") setExitsScope(value);
                }}
              >
                <ToggleGroupItem value="item" aria-label="Somente este alimento">
                  Deste alimento
                </ToggleGroupItem>
                <ToggleGroupItem value="all" aria-label="Todas as saídas">
                  Todas
                </ToggleGroupItem>
              </ToggleGroup>
            ) : null}
          </div>
        }
        collapsible
        defaultOpen
      >
        <DataTable
          columns={exitColumns}
          data={exits}
          manualPagination
          pageCount={exitsPageCount}
          pagination={exitsPagination}
          onPaginationChange={setExitsPagination}
          totalCount={exitsTotalCount}
          toolbar={{ hideSearch: true, hideFiltersButton: true }}
          summaryCards={{ totalLabel: "Total", filteredLabel: "Filtrados" }}
          rowActions={[
            {
              id: "edit",
              label: "Editar",
              onSelect: (row) => {
                if (!canUpdate) return;
                setEditingExitId((row as ApiPantryExit).id);
                setEditExitOpen(true);
              },
            },
          ]}
          onRowClick={(row) => {
            if (!canUpdate) return;
            setEditingExitId((row as ApiPantryExit).id);
            setEditExitOpen(true);
          }}
        />
        {loadingExits ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionCard>

      <PantryExitEditDialog
        open={editExitOpen}
        onOpenChange={(open) => {
          setEditExitOpen(open);
          if (!open) setEditingExitId(null);
        }}
        exitId={editingExitId}
        onSaved={async () => {
          await loadExits();
          await loadItems();
        }}
      />
    </div>
  );
}
