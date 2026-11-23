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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { medicationReasonOptions } from "@/modules/people/features/medications/config/medication-form-config";

type MedicationQuickCreatePayload = {
  medication: string;
  reason?: string | null;
  dosage?: string | null;
};

type MedicationQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: MedicationQuickCreatePayload) => void | Promise<void>;
};

export function MedicationQuickCreateDialog({
  open,
  onOpenChange,
  onSubmit,
}: MedicationQuickCreateDialogProps) {
  const [medication, setMedication] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [dosage, setDosage] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setMedication("");
    setReason("");
    setDosage("");
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = medication.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSubmit({ medication: trimmed, reason: reason || null, dosage: dosage.trim() || null });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova medicação</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Medicamento</label>
            <Input
              value={medication}
              onChange={(event) => setMedication(event.target.value)}
              placeholder="Nome do medicamento"
              disabled={saving}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Motivo (opcional)</label>
            <Select value={reason} onValueChange={setReason} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {medicationReasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Dosagem (opcional)</label>
            <Input
              value={dosage}
              onChange={(event) => setDosage(event.target.value)}
              placeholder="Ex: 10mg"
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Horários, período, profissional e documentos podem ser ajustados depois, na tela da medicação.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !medication.trim()}>
            {saving ? "Salvando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
