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
import type { ApiPantryExit } from "@/modules/pantry/api";
import { resolveExitTypeLabel } from "@/modules/pantry/features/items/domain/pantry-item-detail.helpers";
import { PANTRY_EXIT_TYPE_OPTIONS } from "@/modules/pantry/shared/domain/pantry.constants";

export type PantryExitQuickCreatePayload = {
  sector: string;
  quantity: number;
  type: ApiPantryExit["type"];
  eventName: string | null;
};

type PantryExitQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectorOptions: string[];
  defaultSector: string;
  // Presente quando a saída está sendo criada a partir de um lote
  // (Entrada) específico - a saída só pode sair do mesmo setor do lote
  // (o backend valida isso ao resolver a alocação), então o setor fica
  // fixo em vez de um Select livre.
  lockedSector?: string;
  onSubmit: (payload: PantryExitQuickCreatePayload) => void | Promise<void>;
};

export function PantryExitQuickCreateDialog({
  open,
  onOpenChange,
  sectorOptions,
  defaultSector,
  lockedSector,
  onSubmit,
}: PantryExitQuickCreateDialogProps) {
  const [sector, setSector] = React.useState(defaultSector);
  const [quantity, setQuantity] = React.useState("");
  const [type, setType] = React.useState<ApiPantryExit["type"]>("ATTENDED");
  const [eventName, setEventName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setSector(lockedSector ?? defaultSector);
    setQuantity("");
    setType("ATTENDED");
    setEventName("");
  }, [open, defaultSector, lockedSector]);

  const parsedQuantity = Number(quantity);
  const isValid = sector.trim().length > 0 && Number.isFinite(parsedQuantity) && parsedQuantity > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await onSubmit({
        sector: sector.trim(),
        quantity: parsedQuantity,
        type,
        eventName: eventName.trim() ? eventName.trim() : null,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova saída</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Setor</label>
              {lockedSector ? (
                <Input value={lockedSector} disabled readOnly />
              ) : (
                <Select value={sector} onValueChange={setSector} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectorOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
              <Input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                inputMode="numeric"
                placeholder="Qtd."
                disabled={saving}
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as ApiPantryExit["type"])}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {PANTRY_EXIT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {resolveExitTypeLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Evento (opcional)
            </label>
            <Input
              value={eventName}
              onChange={(event) => setEventName(event.target.value)}
              placeholder="Nome do evento"
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Mais detalhes podem ser ajustados depois, na tela da saída.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !isValid}>
            {saving ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
