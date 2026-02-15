"use client";

import * as React from "react";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PantryItemMovementDialog } from "@/modules/pantry/shared/ui/pantry-item-movement-dialog";
import { PantryEntryCreateDialog } from "@/modules/pantry/features/entries/ui/pantry-entry-create-dialog";
import { PantryEntryEditDialog } from "@/modules/pantry/features/entries/ui/pantry-entry-edit-dialog";
import { PantryExitEditDialog } from "@/modules/pantry/features/exits/ui/pantry-exit-edit-dialog";
import { PantryItemCreateDialog } from "@/modules/pantry/features/items/ui/pantry-item-create-dialog";
import { PantryItemEditDialog } from "@/modules/pantry/features/items/ui/pantry-item-edit-dialog";
import { pantryOverviewStockColumns } from "@/modules/pantry/features/overview/config/pantry-overview-stock-columns";
import { usePantryOverviewModel } from "@/modules/pantry/features/overview/hooks/use-pantry-overview-model";
import { PantryOverviewHeaderActions } from "@/modules/pantry/features/overview/ui/components/pantry-overview-header-actions";
import { PantryOverviewConsumptionSection } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-consumption-section";
import { PantryOverviewStockSection } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-stock-section";

export function PantryOverviewClientPage() {
  const model = usePantryOverviewModel();

  if (!model.canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        VocÃª nÃ£o tem permissÃ£o para acessar esta Ã¡rea.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Despensa"
        items={[{ label: "Despensa", href: "/pantry" }]}
        action={{
          label: "Novo alimento",
          onClick: () => model.setCreateItemOpen(true),
          variant: "default",
          size: "sm",
        }}
        actionSlot={
          <PantryOverviewHeaderActions
            recentMovements={model.recentMovements}
            onMovementClick={model.openMovementEdit}
            expiredItems={model.expiredItems}
            onOpenMovement={model.openMovementDialog}
            onRefreshAlerts={model.handleAlertsRefresh}
            onCreateEntry={() => model.setCreateEntryOpen(true)}
          />
        }
      />

      {model.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {model.error}
        </div>
      ) : null}

      <PantryOverviewStockSection
        rows={model.stockRows}
        columns={pantryOverviewStockColumns}
        onlyLowStock={model.onlyLowStock}
        onToggleOnlyLowStock={() => model.setOnlyLowStock((prev) => !prev)}
        onRowClick={(row) => {
          model.openMovementDialog({
            itemId: row.itemId,
            name: row.name,
            unit: row.unit,
            sector: row.sector,
          });
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

      <PantryItemMovementDialog
        open={model.movementOpen}
        onOpenChange={(open) => {
          model.setMovementOpen(open);
          if (!open) {
            model.setMovementItem(null);
            model.setMovementPreferredSector(undefined);
          }
        }}
        item={model.movementItem}
        preferredSector={model.movementPreferredSector}
        onSaved={model.handleMovementSaved}
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
