"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateOnlyPtBR } from "@/lib/date";
import type { ApiPantryItem } from "@/modules/pantry/api";
import type {
  ItemDraft,
  PantryItemDetailMode,
} from "@/modules/pantry/features/items/domain/pantry-item-detail.types";
import { toInt } from "@/modules/pantry/features/items/domain/pantry-item-detail.helpers";

export type PantryItemDetailFormProps = {
  mode: PantryItemDetailMode;
  readOnly: boolean;
  draft: ItemDraft;
  setDraft: React.Dispatch<React.SetStateAction<ItemDraft>>;
  onCommitField: (key: keyof ItemDraft) => void;
  item: ApiPantryItem | null;
  sectorsLoading: boolean;
  sectorOptions: string[];
  onDefaultSectorChange: (value: string) => void;
  onOpenNewSector: () => void;
  inputLineClassName: string;
  unitSuggestions: string[];
  groupSuggestions: string[];
  movements: React.ReactNode;
};

export function PantryItemDetailForm({
  mode,
  readOnly,
  draft,
  setDraft,
  onCommitField,
  item,
  sectorsLoading,
  sectorOptions,
  onDefaultSectorChange,
  onOpenNewSector,
  inputLineClassName,
  unitSuggestions,
  groupSuggestions,
  movements,
}: PantryItemDetailFormProps) {
  return (
    <div className="rounded-md border border-border/60 bg-card p-4">
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">Nome</div>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              onBlur={() => onCommitField("name")}
              placeholder="Ex: Arroz"
              className={inputLineClassName}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">Unidade</div>
            <Input
              value={draft.unit}
              onChange={(e) => setDraft((prev) => ({ ...prev, unit: e.target.value }))}
              onBlur={() => onCommitField("unit")}
              placeholder="Ex: kg"
              list="pantry-item-unit-options"
              className={inputLineClassName}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">Grupo de alimentos</div>
            <Input
              value={draft.group ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, group: e.target.value || null }))}
              onBlur={() => onCommitField("group")}
              placeholder="Opcional"
              list="pantry-item-group-options"
              className={inputLineClassName}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">Setor</div>
            <div className="flex items-center gap-2">
              <Select
                value={draft.defaultSector}
                onValueChange={(value) => {
                  setDraft((prev) => ({ ...prev, defaultSector: value }));
                  onDefaultSectorChange(value);
                }}
                disabled={readOnly || sectorsLoading}
              >
                <SelectTrigger className={inputLineClassName}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {sectorOptions.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Novo setor"
                  aria-label="Novo setor"
                  onClick={onOpenNewSector}
                >
                  <Plus className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">Estoque mínimo</div>
            <Input
              type="number"
              value={String(draft.minStock)}
              onChange={(e) => setDraft((prev) => ({ ...prev, minStock: toInt(e.target.value) }))}
              onBlur={() => onCommitField("minStock")}
              className={inputLineClassName}
              readOnly={readOnly}
            />
          </div>
        </div>

        {mode === "edit" && item ? (
          <div className="grid grid-cols-1 gap-3 pt-2 lg:grid-cols-3">
            <div className="rounded-md border border-border/60 bg-muted/5 p-3">
              <div className="text-[11px] text-muted-foreground">Saldo</div>
              <div className="font-mono text-lg tabular-nums text-foreground">
                {Number(item.stock).toLocaleString("pt-BR")}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {item.isBelowMin ? (
                  <Badge variant="destructive">Abaixo do mínimo</Badge>
                ) : (
                  <Badge variant="secondary">OK</Badge>
                )}
              </div>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/5 p-3">
              <div className="text-[11px] text-muted-foreground">Próx. validade</div>
              <div className="text-sm font-medium text-foreground">
                {item.nextExpiryDate ? formatDateOnlyPtBR(item.nextExpiryDate) : "—"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {item.daysToExpire !== null ? `${item.daysToExpire} dia(s)` : ""}
              </div>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/5 p-3">
              <div className="text-[11px] text-muted-foreground">Último movimento</div>
              <div className="text-sm font-medium text-foreground">
                {item.lastMovementDate ? formatDateOnlyPtBR(item.lastMovementDate) : "—"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Criado em {formatDateOnlyPtBR(item.createdAt)}
              </div>
            </div>
          </div>
        ) : null}

        {movements}

        {readOnly ? (
          <div className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
            {mode === "create"
              ? "Você não tem permissão para criar."
              : "Você não tem permissão para editar."}
          </div>
        ) : null}
      </div>

      <datalist id="pantry-item-unit-options">
        {unitSuggestions.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
      <datalist id="pantry-item-group-options">
        {groupSuggestions.map((group) => (
          <option key={group} value={group} />
        ))}
      </datalist>
    </div>
  );
}
