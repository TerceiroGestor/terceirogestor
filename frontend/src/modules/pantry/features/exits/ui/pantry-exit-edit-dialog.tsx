"use client";

import * as React from "react";
import { FormEngine } from "@/components/FormEngine";
import { SectionDialog } from "@/components/section-dialog";
import { SectionList, SectionListItem } from "@/components/section-list";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantrySector,
  getPantryExit,
  listPantrySectors,
  reversePantryExit,
  updatePantryExit,
  type ApiPantryExit,
} from "@/modules/pantry/api";
import { PANTRY_NEW_SECTOR_VALUE } from "@/modules/pantry/features/items/config/pantry-item-form-config";
import type { PantryExitFormValues } from "@/modules/pantry/shared/domain/types";
import { formatDateOnlyPtBR } from "@/lib/date";
import type { FormField } from "@/components/FormEngine/types";
import { Undo2 } from "lucide-react";
import { PANTRY_ITEM_UNIT } from "@/modules/pantry/shared/domain/pantry.constant";

function toDateOnly(value: string | null | undefined) {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

type PantryExitEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exitId: string | null;
  onSaved?: () => void | Promise<void>;
};

export function PantryExitEditDialog({
  open,
  onOpenChange,
  exitId,
  onSaved,
}: PantryExitEditDialogProps) {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const canUpdate = permissions.includes("pantry.update");

  const [exit, setExit] = React.useState<ApiPantryExit | null>(null);
  const [sectors, setSectors] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [reversing, setReversing] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!token || !exitId) return;
    setLoading(true);
    try {
      const [exitResponse, sectorsResponse] = await Promise.all([
        getPantryExit(token, exitId),
        listPantrySectors(token),
      ]);
      setExit(exitResponse);
      setSectors(sectorsResponse.data ?? []);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar saída.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setExit(null);
    } finally {
      setLoading(false);
    }
  }, [token, exitId, toast]);

  React.useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const sectorOptions = React.useMemo(() => {
    const set = new Set<string>();
    const list: Array<{ label: string; value: string }> = [];

    const push = (name: string) => {
      const normalized = name.trim();
      if (!normalized) return;
      if (set.has(normalized)) return;
      set.add(normalized);
      list.push({ label: normalized, value: normalized });
    };

    (sectors ?? []).forEach((sector) => push(sector.name));
    if (exit?.sector) push(exit.sector);
    push("Geral");

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [exit?.sector, sectors]);

  const fields = React.useMemo<FormField<PantryExitFormValues>[]>(() => {
    if (!exit) return [];
    return [
      {
        name: "itemId",
        label: "Alimento",
        type: "select",
        required: true,
        disabled: true,
        options: [{ label: exit.item?.name ?? "Alimento", value: exit.itemId }],
      },
      {
        name: "sector",
        label: "Setor (local físico)",
        type: "select",
        required: true,
        options: [
          ...sectorOptions,
          { label: "Adicionar setor...", value: PANTRY_NEW_SECTOR_VALUE },
        ],
        helperText: "Informe de onde o item está sendo retirado.",
      },
      {
        name: "newSector",
        label: "Novo setor",
        type: "text",
        requiredWhen: (values) => values.sector === PANTRY_NEW_SECTOR_VALUE,
        visibleWhen: (values) => values.sector === PANTRY_NEW_SECTOR_VALUE,
        helperText: "Digite o nome do setor e ele ficará disponível para toda a despensa.",
      },
      { name: "quantity", label: "Quantidade", type: "number", required: true },
      {
        name: "unit",
        label: "Unidade",
        type: "select",
        options: PANTRY_ITEM_UNIT.slice(),
        helperText: "Se vazio, usa a unidade padrão do alimento.",
      },
      { name: "exitDate", label: "Data da saída", type: "date" },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        required: true,
        disabled: exit.type === "CORRECTION",
        options: [
          { label: "Atendidos", value: "ATTENDED" },
          { label: "Doações", value: "DONATION" },
          { label: "Eventos", value: "EVENT" },
          { label: "Festas", value: "PARTY" },
          { label: "Correção", value: "CORRECTION" },
        ],
      },
      {
        name: "eventName",
        label: "Evento",
        type: "text",
        helperText: "Obrigatório para Eventos e Festas.",
        disabled: exit.type === "CORRECTION",
        requiredWhen: (values: PantryExitFormValues) =>
          values.type === "EVENT" || values.type === "PARTY",
      },
      { name: "notes", label: "Observações", type: "textarea", rows: 2 },
    ];
  }, [exit]);

  const initialValues = React.useMemo<PantryExitFormValues | null>(() => {
    if (!exit) return null;
    return {
      itemId: exit.itemId,
      sector: exit.sector,
      newSector: "",
      quantity: exit.quantity,
      unit: exit.unit,
      exitDate: toDateOnly(exit.exitDate),
      type: exit.type,
      eventName: exit.eventName ?? "",
      notes: exit.notes ?? "",
      entryId: undefined,
    };
  }, [exit]);

  const handleSubmit = React.useCallback(
    async (values: PantryExitFormValues) => {
      if (!token || !exitId || !exit) return;
      if (!canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar saídas.",
        });
        return;
      }

      const rawSector = values.sector?.trim() ?? "";
      const rawNewSector = values.newSector?.trim() ?? "";
      const sector =
        rawSector === PANTRY_NEW_SECTOR_VALUE ? rawNewSector : rawSector;
      const quantity =
        typeof values.quantity === "number" ? values.quantity : Number(values.quantity);
      const rawUnit = values.unit?.trim() ?? "";
      const rawExitDate = values.exitDate?.trim() ?? "";
      const eventName = values.eventName?.trim() ?? "";
      const rawNotes = values.notes?.trim() ?? "";

      if (!sector) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe o setor (local físico).",
        });
        return;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe uma quantidade válida.",
        });
        return;
      }
      if ((values.type === "EVENT" || values.type === "PARTY") && !eventName) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe o nome do evento.",
        });
        return;
      }

      setSaving(true);
      try {
        if (rawSector === PANTRY_NEW_SECTOR_VALUE) {
          try {
            await createPantrySector(token, { name: sector });
          } catch {
            // best-effort
          }
        }
        await updatePantryExit(token, exitId, {
          itemId: exit.itemId,
          sector,
          quantity,
          unit: rawUnit || exit.unit,
          exitDate: rawExitDate || undefined,
          type: values.type,
          eventName: eventName ? eventName : null,
          notes: rawNotes ? rawNotes : null,
        });
        await Promise.resolve(onSaved?.());
        toast({ variant: "success", title: "Saída atualizada" });
        onOpenChange(false);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao editar saída.";
        toast({ variant: "destructive", title: "Falha ao salvar", description: message });
      } finally {
        setSaving(false);
      }
    },
    [token, exitId, exit, canUpdate, onSaved, onOpenChange, toast],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setExit(null);
        }
      }}
      title="Editar saída"
      description="Ajuste a saída. O sistema recalcula a alocação por lote automaticamente quando necessário."
      showBackButton
      contentClassName="sm:!max-w-[820px]"
      headerSlot={
        exit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={reversing || saving || !canUpdate}
            title="Estornar saída"
            onClick={async () => {
              if (!token || !exitId || !exit) return;
              if (!canUpdate) return;

              const confirmed = await confirm({
                title: "Estornar saída",
                description:
                  "Estornar esta saída vai criar uma ou mais ENTRADAS de correção devolvendo o estoque ao(s) lote(s) (validade/setor). Deseja continuar?",
                confirmLabel: "Estornar",
                cancelLabel: "Cancelar",
                confirmVariant: "destructive",
              });
              if (!confirmed) return;

              setReversing(true);
              try {
                await reversePantryExit(token, exitId);
                await Promise.resolve(onSaved?.());
                onOpenChange(false);
                toast({ title: "Saída estornada", variant: "success" });
              } catch (err) {
                const message =
                    err && typeof err === "object" && "message" in err
                      ? String((err as { message?: string }).message)
                      : "Falha ao estornar saída.";
                  toast({ title: "Falha ao estornar", description: message, variant: "destructive" });
                } finally {
                  setReversing(false);
                }
              }}
          >
            <Undo2 className="size-4" />
            Estornar
          </Button>
        ) : null
      }
    >
      {loading || !exit || !initialValues ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {exit.allocations?.length ? (
            <div className="rounded-lg border border-border/60 bg-card/40 px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Lotes consumidos
              </p>
              <SectionList className="mt-2">
                {exit.allocations.map((allocation) => (
                  <SectionListItem
                    key={allocation.entryId}
                    title={
                      <span className="text-xs font-semibold text-foreground">
                        {allocation.sector}
                      </span>
                    }
                    subtitle={
                      allocation.expiryDate
                        ? `Validade: ${formatDateOnlyPtBR(allocation.expiryDate)}`
                        : "Sem validade"
                    }
                    meta={
                      <span className="font-mono tabular-nums">
                        {Number(allocation.quantity).toLocaleString("pt-BR")} {exit.unit}
                      </span>
                    }
                    showActionsOnHover={false}
                  />
                ))}
              </SectionList>
            </div>
          ) : null}

          <FormEngine<PantryExitFormValues>
            fields={fields}
            initialValues={initialValues}
            disabled={saving}
            onSubmit={handleSubmit}
            actions={{
              submit: { label: saving ? "Salvando..." : "Salvar", variant: "primary" },
              cancel: {
                label: "Cancelar",
                variant: "ghost",
                onClick: () => onOpenChange(false),
              },
            }}
          />
        </div>
      )}
    </SectionDialog>
  );
}
