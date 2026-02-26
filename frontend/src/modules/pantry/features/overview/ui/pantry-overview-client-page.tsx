"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Package, PackagePlus, Table2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRegisterUsageDocumentation } from "@/components/UsageDocumentation/UsageDocumentationProvider";
import { PantryEntryCreateDialog } from "@/modules/pantry/features/entries/ui/pantry-entry-create-dialog";
import { PantryEntryEditDialog } from "@/modules/pantry/features/entries/ui/pantry-entry-edit-dialog";
import { PantryExitEditDialog } from "@/modules/pantry/features/exits/ui/pantry-exit-edit-dialog";
import { PantryItemCreateDialog } from "@/modules/pantry/features/items/ui/pantry-item-create-dialog";
import { PantryItemEditDialog } from "@/modules/pantry/features/items/ui/pantry-item-edit-dialog";
import { pantryOverviewStockColumns } from "@/modules/pantry/features/overview/config/pantry-overview-stock-columns";
import { PANTRY_OVERVIEW_USAGE } from "@/modules/pantry/features/overview/domain/pantry-overview.constants";
import { usePantryOverviewModel } from "@/modules/pantry/features/overview/hooks/use-pantry-overview-model";
import { PantryAlertsDropdown } from "@/modules/pantry/features/overview/ui/components/pantry-alerts-dropdown";
import { PantryOverviewConsumptionSection } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-consumption-section";
import { PantryOverviewStockSection } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-stock-section";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { ViewSwitcher } from "@/web-client/control-panel/ViewSwitcher";
import { CreateDropdown } from "@/web-client/control-panel/CreateDropdown";
import { usePersistedUrlState } from "@/web-client/screen/usePersistedUrlState";
import type { RecordBrowserViewOption } from "@/components/record-browser/RecordBrowserViewSwitcher";

export function PantryOverviewClientPage() {
  const model = usePantryOverviewModel();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const [search, setSearch] = React.useState("");

  const [screenState, setScreenState] = usePersistedUrlState<{
    view: "table" | "cards";
  }>({
    storageKey: "screenState:pantry.overview",
    trackedKeys: ["v"],
    parse: (params) => {
      const raw = params.get("v");
      return { view: raw === "cards" ? "cards" : "table" };
    },
    serialize: (state) => ({ v: state.view === "table" ? undefined : state.view }),
  });

  const viewOptions = React.useMemo<RecordBrowserViewOption<"table" | "cards">[]>(
    () => [
      { value: "table", label: "Tabela", icon: <Table2 className="size-4" /> },
      { value: "cards", label: "Cards", icon: <LayoutGrid className="size-4" /> },
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
    toast({ variant: "destructive", title: "Falha ao carregar", description: model.error });
  }, [model.error, toast]);

  const filteredStockRows = React.useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    if (!q) return model.stockRows;

    return model.stockRows.filter((row) => {
      const haystack = `${row.name} ${row.group ?? ""} ${row.sector}`.toLocaleLowerCase();
      return haystack.includes(q);
    });
  }, [model.stockRows, search]);

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
                onSelect: () => model.setCreateItemOpen(true),
              },
              {
                id: "create-entry",
                label: "Nova entrada",
                icon: <PackagePlus className="size-4" />,
                onSelect: () => model.setCreateEntryOpen(true),
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
        searchSlot={<SearchBar value={search} onChange={setSearch} placeholder="Buscar por alimento" />}
        viewSwitcherSlot={
          <ViewSwitcher
            value={screenState.view}
            options={viewOptions}
            onChange={(next) => setScreenState((prev) => ({ ...prev, view: next }))}
          />
        }
        rightSlot={
          <>
            <Button size="sm" variant="outline" onClick={() => model.handleMovementSaved()}>
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
        view={screenState.view}
        rows={filteredStockRows}
        columns={pantryOverviewStockColumns}
        onlyLowStock={model.onlyLowStock}
        onToggleOnlyLowStock={() => model.setOnlyLowStock((prev) => !prev)}
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

      <PantryOverviewConsumptionSection
        consumption={model.consumption}
        consumptionLoading={model.consumptionLoading}
        consumptionError={model.consumptionError}
        flow={model.flow}
        flowError={model.flowError}
        usage={model.usage}
        usageError={model.usageError}
        onRefresh={model.loadConsumption}
        view={model.consumptionView}
        onViewChange={(value) => {
          model.setConsumptionView(value);
          model.setSelectedItemId("all");
          model.setSelectedGroup("all");
        }}
        exitType={model.consumptionExitType}
        eventName={model.consumptionEventName}
        onExitTypeChange={model.setConsumptionExitType}
        onEventNameChange={model.setConsumptionEventName}
        fromMonth={model.consumptionFromMonth}
        toMonth={model.consumptionToMonth}
        onFromMonthChange={model.setConsumptionFromMonth}
        onToMonthChange={model.setConsumptionToMonth}
        selectedItemId={model.selectedItemId}
        selectedGroup={model.selectedGroup}
        onSelectedItemIdChange={model.setSelectedItemId}
        onSelectedGroupChange={model.setSelectedGroup}
        groups={model.groups}
        items={model.items}
      />

      <PantryEntryCreateDialog
        open={model.createEntryOpen}
        onOpenChange={model.setCreateEntryOpen}
        onCreated={model.handleMovementSaved}
      />

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

      <PantryItemCreateDialog
        open={model.createItemOpen}
        onOpenChange={model.setCreateItemOpen}
        onCreated={async () => {
          await model.handleMovementSaved();
        }}
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

