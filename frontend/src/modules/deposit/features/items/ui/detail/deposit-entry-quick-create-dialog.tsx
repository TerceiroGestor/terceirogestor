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
import type { ApiDepositDonor } from "@/modules/deposit/api";

const NONE_DONOR_VALUE = "__none__";

export type DepositEntryQuickCreatePayload = {
  donorId: string | null;
  sector: string;
  quantity: number;
  expiryDate: string | null;
};

type DepositEntryQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donors: ApiDepositDonor[];
  sectorOptions: string[];
  defaultSector: string;
  onSubmit: (payload: DepositEntryQuickCreatePayload) => void | Promise<void>;
};

export function DepositEntryQuickCreateDialog({
  open,
  onOpenChange,
  donors,
  sectorOptions,
  defaultSector,
  onSubmit,
}: DepositEntryQuickCreateDialogProps) {
  const [donorId, setDonorId] = React.useState<string | null>(null);
  const [sector, setSector] = React.useState(defaultSector);
  const [quantity, setQuantity] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setDonorId(null);
    setSector(defaultSector);
    setQuantity("");
    setExpiryDate("");
  }, [open, defaultSector]);

  const parsedQuantity = Number(quantity);
  const isValid = sector.trim().length > 0 && Number.isFinite(parsedQuantity) && parsedQuantity > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await onSubmit({
        donorId,
        sector: sector.trim(),
        quantity: parsedQuantity,
        expiryDate: expiryDate.trim() ? expiryDate.trim() : null,
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
          <DialogTitle>Nova entrada</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Fonte</label>
            <Select
              value={donorId ?? NONE_DONOR_VALUE}
              onValueChange={(value) => setDonorId(value === NONE_DONOR_VALUE ? null : value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_DONOR_VALUE}>Sem fonte</SelectItem>
                {donors.map((donor) => (
                  <SelectItem key={donor.id} value={donor.id}>
                    {donor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Setor</label>
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
            <label className="text-xs font-medium text-muted-foreground">
              Data limite (opcional)
            </label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Mais detalhes podem ser ajustados depois, na tela da entrada.
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
