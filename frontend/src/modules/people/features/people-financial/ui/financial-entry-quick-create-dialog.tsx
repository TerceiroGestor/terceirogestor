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
  FINANCIAL_CATEGORY_OPTIONS,
  FINANCIAL_ENTRY_TYPE_OPTIONS,
  FINANCIAL_FREQUENCY_OPTIONS,
} from "@/modules/people/features/people-financial/config/people-financial.constants";
import type { PersonFinancialEntryType } from "@/modules/people/shared/domain/types";

type FinancialEntryQuickCreatePayload = {
  entryType: PersonFinancialEntryType;
  category: string;
  frequency: string;
  amount?: number | null;
};

type FinancialEntryQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: FinancialEntryQuickCreatePayload) => void | Promise<void>;
};

export function FinancialEntryQuickCreateDialog({
  open,
  onOpenChange,
  onSubmit,
}: FinancialEntryQuickCreateDialogProps) {
  const [entryType, setEntryType] = React.useState<PersonFinancialEntryType>("INCOME");
  const [category, setCategory] = React.useState("");
  const [frequency, setFrequency] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setEntryType("INCOME");
    setCategory("");
    setFrequency("");
    setAmount("");
  }, [open]);

  const categoryOptions = FINANCIAL_CATEGORY_OPTIONS[entryType];

  const handleSubmit = async () => {
    if (!category || !frequency) return;
    setSaving(true);
    try {
      await onSubmit({
        entryType,
        category,
        frequency,
        amount: amount.trim() ? Number(amount) : null,
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
          <DialogTitle>Novo registro financeiro</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <Select
              value={entryType}
              onValueChange={(value) => {
                setEntryType(value as PersonFinancialEntryType);
                setCategory("");
              }}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_ENTRY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Categoria</label>
            <Select value={category} onValueChange={setCategory} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Frequência</label>
            <Select value={frequency} onValueChange={setFrequency} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Valor (opcional)</label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Residência/fluxo, status, contrato e observações podem ser ajustados depois, na tela do registro.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !category || !frequency}>
            {saving ? "Salvando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
