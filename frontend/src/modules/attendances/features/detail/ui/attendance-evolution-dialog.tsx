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
import { Textarea } from "@/components/ui/textarea";
import { todayLocalIsoDate } from "@/lib/date";

type AttendanceEvolutionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { date: string; notes: string }) => void | Promise<void>;
};

export function AttendanceEvolutionDialog({
  open,
  onOpenChange,
  onSubmit,
}: AttendanceEvolutionDialogProps) {
  const [date, setDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setDate(todayLocalIsoDate());
    setNotes("");
  }, [open]);

  const handleSubmit = async () => {
    const trimmedNotes = notes.trim();
    if (!date || !trimmedNotes) return;
    setSaving(true);
    try {
      await onSubmit({ date, notes: trimmedNotes });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova evolução</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Data</label>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Registro</label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="O que foi observado/trabalhado nesta visita ou sessão"
              className="min-h-[140px]"
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Mais detalhes podem ser ajustados depois, na tela da evolução.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !date || !notes.trim()}>
            {saving ? "Salvando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
