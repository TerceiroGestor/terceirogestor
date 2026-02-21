"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { useToast } from "@/components/ui/use-toast";
import { useRegisterUsageDocumentation } from "@/components/UsageDocumentation/UsageDocumentationProvider";
import { PantryEntryCreateDialog } from "@/modules/pantry/features/entries/ui/pantry-entry-create-dialog";
import { PantryEntryEditDialog } from "@/modules/pantry/features/entries/ui/pantry-entry-edit-dialog";
import { PantryExitEditDialog } from "@/modules/pantry/features/exits/ui/pantry-exit-edit-dialog";
import { PantryItemCreateDialog } from "@/modules/pantry/features/items/ui/pantry-item-create-dialog";
import { PantryItemEditDialog } from "@/modules/pantry/features/items/ui/pantry-item-edit-dialog";
import { Button } from "@/components/ui/button";
import { pantryOverviewStockColumns } from "@/modules/pantry/features/overview/config/pantry-overview-stock-columns";
import { PANTRY_OVERVIEW_USAGE } from "@/modules/pantry/features/overview/domain/pantry-overview.constants";
import { usePantryOverviewModel } from "@/modules/pantry/features/overview/hooks/use-pantry-overview-model";
import { PantryAlertsDropdown } from "@/modules/pantry/features/overview/ui/components/pantry-alerts-dropdown";
import { PantryOverviewConsumptionSection } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-consumption-section";
import { PantryOverviewStockSection } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-stock-section";
import { PantryHeaderNav } from "@/modules/pantry/shared/ui/pantry-header-nav";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

export function PantryOverviewClientPage() {
  const model = usePantryOverviewModel();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const openExitPage = React.useCallback(
    (params: { itemId: string; sector?: string }) => {
      const qs = new URLSearchParams();
      qs.set("itemId", params.itemId);
      if (params.sector) qs.set("sector", params.sector);
      router.push(`${withTenantPath("/pantry/exit", tenantSlug)}?${qs.toString()}`);
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

  if (!model.canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Despensa"
        items={[{ label: "Despensa", href: "/pantry" }]}
        actionSlot={<PantryHeaderNav />}
      />

      <PantryOverviewStockSection
        rows={model.stockRows}
        columns={pantryOverviewStockColumns}
        onlyLowStock={model.onlyLowStock}
        onToggleOnlyLowStock={() => model.setOnlyLowStock((prev) => !prev)}
        headerActionsSlot={
          <>
            <PantryAlertsDropdown
              expiringAlerts={model.expiringAlerts}
              showLabel
              onOpenMovement={(params) =>
                openExitPage({ itemId: params.itemId, sector: params.sector })
              }
              onRefreshAlerts={model.handleAlertsRefresh}
            />
            <Button
              size="sm"
              onClick={() => model.setCreateItemOpen(true)}
              className="whitespace-nowrap"
            >
              Novo alimento
            </Button>
          </>
        }
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
