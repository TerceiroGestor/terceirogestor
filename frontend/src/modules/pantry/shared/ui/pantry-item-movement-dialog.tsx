"use client";

import * as React from "react";
import { SectionDialog } from "@/components/section-dialog";
import {
  PantryMovementWorkspace,
  type PantryMovementDialogItem,
} from "@/modules/pantry/shared/ui/pantry-movement-workspace";

type PantryItemMovementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PantryMovementDialogItem | null;
  preferredSector?: string;
  onSaved?: () => void | Promise<void>;
};

export function PantryItemMovementDialog({
  open,
  onOpenChange,
  item,
  preferredSector,
  onSaved,
}: PantryItemMovementDialogProps) {
  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? item.name : "Movimentar estoque"}
      description="Registre saídas e consulte entradas por validade."
      contentClassName="sm:!max-w-[1200px]"
    >
      <PantryMovementWorkspace
        enabled={open}
        item={item}
        preferredSector={preferredSector}
        onSaved={onSaved}
        onClose={() => onOpenChange(false)}
      />
    </SectionDialog>
  );
}

export type { PantryMovementDialogItem };

