"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DetentionQuickCreatePayload = {
  status: string;
  type?: string | null;
};

type DetentionQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: DetentionQuickCreatePayload) => void | Promise<void>;
};

export function DetentionQuickCreateDialog({
  open,
  onOpenChange,
  onSubmit,
}: DetentionQuickCreateDialogProps) {
  const [status, setStatus] = React.useState("");
  const [type, setType] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setStatus("");
    setType("");
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = status.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSubmit({ status: trimmed, type: type.trim() || null });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova reclusão</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Situação</label>
            <Input
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              placeholder="Ex: Em reclusão, Medida socioeducativa"
              disabled={saving}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo (opcional)</label>
            <Input
              value={type}
              onChange={(event) => setType(event.target.value)}
              placeholder="Ex: Fechado, Semiaberto, Internação"
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Unidade, período e observações podem ser ajustados depois, na tela da reclusão.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !status.trim()}>
            {saving ? "Salvando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
