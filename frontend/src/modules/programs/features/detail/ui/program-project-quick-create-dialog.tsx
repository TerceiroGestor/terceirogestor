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

type ProgramProjectQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { name: string }) => void | Promise<void>;
};

export function ProgramProjectQuickCreateDialog({
  open,
  onOpenChange,
  onSubmit,
}: ProgramProjectQuickCreateDialogProps) {
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName("");
  }, [open]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      await onSubmit({ name: trimmedName });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nome</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do projeto"
              disabled={saving}
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Mais detalhes podem ser ajustados depois, na tela do projeto.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !name.trim()}>
            {saving ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
