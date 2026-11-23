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
import { listActivityTypes, type ApiActivityType } from "@/modules/actions/api";

type ProjectActionQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onSubmit: (payload: { title: string; actionTypeId: string }) => void | Promise<void>;
};

export function ProjectActionQuickCreateDialog({
  open,
  onOpenChange,
  token,
  onSubmit,
}: ProjectActionQuickCreateDialogProps) {
  const [title, setTitle] = React.useState("");
  const [actionTypeId, setActionTypeId] = React.useState("");
  const [actionTypes, setActionTypes] = React.useState<ApiActivityType[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle("");
    setActionTypeId("");
  }, [open]);

  React.useEffect(() => {
    if (!open || !token) return;
    listActivityTypes(token, { isActive: true })
      .then((rows) => setActionTypes(rows.filter((row) => row.target === "PROJECT")))
      .catch(() => setActionTypes([]));
  }, [open, token]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !actionTypeId) return;
    setSaving(true);
    try {
      await onSubmit({ title: trimmedTitle, actionTypeId });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova atividade</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Título</label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título da atividade"
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <Select value={actionTypeId} onValueChange={setActionTypeId} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Mais detalhes podem ser ajustados depois, na tela da atividade.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={saving || !title.trim() || !actionTypeId}
          >
            {saving ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
