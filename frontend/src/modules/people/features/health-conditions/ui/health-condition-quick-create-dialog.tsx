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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  healthConditionSeverityOptions,
  healthConditionTypeOptions,
} from "@/modules/people/features/health-conditions/config/health-condition-form-config";

type HealthConditionQuickCreatePayload = {
  type: string;
  severity?: string | null;
};

type HealthConditionQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: HealthConditionQuickCreatePayload) => void | Promise<void>;
};

export function HealthConditionQuickCreateDialog({
  open,
  onOpenChange,
  onSubmit,
}: HealthConditionQuickCreateDialogProps) {
  const [type, setType] = React.useState("");
  const [severity, setSeverity] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setType("");
    setSeverity("");
  }, [open]);

  const handleSubmit = async () => {
    if (!type) return;
    setSaving(true);
    try {
      await onSubmit({ type, severity: severity || null });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova condição de saúde</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo de condição</label>
            <Select value={type} onValueChange={setType} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {healthConditionTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Severidade (opcional)</label>
            <Select value={severity} onValueChange={setSeverity} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {healthConditionSeverityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Descrição, data do diagnóstico, documento e observações podem ser ajustados depois, na tela da condição.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !type}>
            {saving ? "Salvando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
