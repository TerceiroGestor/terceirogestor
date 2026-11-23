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
import {
  EDUCATION_LEVEL_SUGGESTIONS,
  EDUCATION_STATUS_OPTIONS,
} from "@/modules/people/features/education/config/education.constants";

type EducationQuickCreatePayload = {
  level: string;
  status?: string | null;
};

type EducationQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: EducationQuickCreatePayload) => void | Promise<void>;
};

export function EducationQuickCreateDialog({
  open,
  onOpenChange,
  onSubmit,
}: EducationQuickCreateDialogProps) {
  const [level, setLevel] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLevel("");
    setStatus("");
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = level.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSubmit({ level: trimmed, status: status || null });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova escolaridade</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nível</label>
            <Input
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              placeholder="Ex: Ensino médio completo"
              list="education-level-suggestions"
              disabled={saving}
            />
            <datalist id="education-level-suggestions">
              {EDUCATION_LEVEL_SUGGESTIONS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Situação (opcional)</label>
            <Select value={status} onValueChange={setStatus} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Instituição, série, período e observações podem ser ajustados depois, na tela da escolaridade.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !level.trim()}>
            {saving ? "Salvando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
