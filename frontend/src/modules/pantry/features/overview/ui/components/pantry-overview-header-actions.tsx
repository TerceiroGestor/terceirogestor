"use client";

import * as React from "react";
import { Bell, History, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PantryOverviewAlertsSection } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-alerts-section";
import {
  PantryOverviewMovementsSection,
  type PantryRecentMovement,
} from "@/modules/pantry/features/overview/ui/sections/pantry-overview-movements-section";
import { formatDate } from "@/modules/pantry/features/overview/domain/overview.helpers";
import type { PantryExpiringItem } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-alerts-section";

type PantryOverviewHeaderActionsProps = {
  recentMovements: PantryRecentMovement[];
  onMovementClick: (movement: PantryRecentMovement) => void;

  expiredItems: PantryExpiringItem[];
  onOpenMovement: (params: {
    itemId: string;
    name: string;
    unit: string;
    sector?: string;
  }) => void;
  onRefreshAlerts: () => void;

  onCreateEntry: () => void;
};

export function PantryOverviewHeaderActions({
  recentMovements,
  onMovementClick,
  expiredItems,
  onOpenMovement,
  onRefreshAlerts,
  onCreateEntry,
}: PantryOverviewHeaderActionsProps) {
  const expiredCount = expiredItems.length;

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Movimentos recentes"
            title="Movimentos recentes"
          >
            <History className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[calc(100vw-2rem)] sm:!max-w-[780px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Movimentos recentes</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 pt-12">
            <PantryOverviewMovementsSection
              movements={recentMovements}
              onMovementClick={onMovementClick}
              formatDate={formatDate}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Button
        variant="outline"
        size="icon"
        aria-label="Nova entrada (lote)"
        title="Nova entrada (lote)"
        onClick={onCreateEntry}
      >
        <PackagePlus className="size-4" />
      </Button>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Alertas"
            title="Alertas"
            className="relative"
          >
            <Bell className="size-4" />
            {expiredCount ? (
              <span className="absolute -right-0.5 -top-0.5 block size-2 rounded-full bg-rose-500" />
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[calc(100vw-2rem)] sm:!max-w-[780px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Alertas</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 pt-12">
            <PantryOverviewAlertsSection
              expiredItems={expiredItems}
              formatDate={formatDate}
              onOpenMovement={onOpenMovement}
              onRefresh={onRefreshAlerts}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
