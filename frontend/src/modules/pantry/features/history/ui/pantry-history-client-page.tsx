"use client";

import * as React from "react";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { useToast } from "@/components/ui/use-toast";
import { PantryEntryEditDialog } from "@/modules/pantry/features/entries/ui/pantry-entry-edit-dialog";
import { PantryExitEditDialog } from "@/modules/pantry/features/exits/ui/pantry-exit-edit-dialog";
import { PantryOverviewMovementsSection } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-movements-section";
import { usePantryHistoryModel } from "@/modules/pantry/features/history/hooks/use-pantry-history-model";
import { PantryHeaderNav } from "@/modules/pantry/shared/ui/pantry-header-nav";
import { formatDateOnlyPtBR, formatDateTimePtBR } from "@/lib/date";

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
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Histórico"
        items={[
          { label: "Despensa", href: "/pantry" },
          { label: "Histórico", href: "/pantry/history" },
        ]}
        actionSlot={<PantryHeaderNav />}
      />

      <PantryOverviewMovementsSection
        movements={model.recentMovements}
        onMovementClick={model.openMovementEdit}
        formatDate={formatPantryMovementDate}
      />

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
