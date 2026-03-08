"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DetailRelationItemDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onDelete,
  saveLabel = "Salvar",
  deleteLabel = "Excluir",
  saving = false,
  deleting = false,
  disableSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  deleteLabel?: string;
  saving?: boolean;
  deleting?: boolean;
  disableSave?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(96vw,42rem)] gap-0 overflow-hidden rounded-none border-0 p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              disabled={saving || deleting}
              className="mr-auto"
            >
              {deleting ? "Excluindo..." : deleteLabel}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" onClick={onSave} disabled={disableSave || saving || deleting}>
            {saving ? "Salvando..." : saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
