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
import type { PersonSummary } from "@/modules/people/shared/domain/types";

const RELATION_TYPE_OPTIONS = [
  "Pai",
  "Mae",
  "Filho(a)",
  "Irmao(a)",
  "Conjuge",
  "Responsavel",
  "Dependente",
  "Avo(a)",
  "Tio(a)",
  "Primo(a)",
  "Outro",
];

type FamilyRelationQuickCreatePayload = {
  relatedPersonId: string;
  type: string;
};

type FamilyRelationQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peopleOptions: PersonSummary[];
  onSubmit: (payload: FamilyRelationQuickCreatePayload) => void | Promise<void>;
};

export function FamilyRelationQuickCreateDialog({
  open,
  onOpenChange,
  peopleOptions,
  onSubmit,
}: FamilyRelationQuickCreateDialogProps) {
  const [relatedPersonId, setRelatedPersonId] = React.useState("");
  const [type, setType] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setRelatedPersonId("");
    setType("");
  }, [open]);

  const handleSubmit = async () => {
    if (!relatedPersonId || !type) return;
    setSaving(true);
    try {
      await onSubmit({ relatedPersonId, type });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo vínculo familiar</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Pessoa</label>
            <Select value={relatedPersonId} onValueChange={setRelatedPersonId} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a pessoa" />
              </SelectTrigger>
              <SelectContent>
                {peopleOptions.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Vínculo</label>
            <Select value={type} onValueChange={setType} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {RELATION_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Convivência, responsabilidade legal e observações podem ser ajustados depois, na tela do vínculo.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !relatedPersonId || !type}>
            {saving ? "Salvando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
