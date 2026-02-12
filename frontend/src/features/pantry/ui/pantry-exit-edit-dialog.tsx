"use client";

import * as React from "react";
import { FormEngine } from "@/components/FormEngine";
import { SectionDialog } from "@/components/section-dialog";
import { SectionList, SectionListItem } from "@/components/section-list";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  getPantryExit,
  reversePantryExit,
  updatePantryExit,
  type ApiPantryExit,
} from "@/features/pantry/api";
import type { PantryExitFormValues } from "@/features/pantry/domain/types";
import { formatDateOnlyPtBR } from "@/lib/date";
import type { FormField } from "@/components/FormEngine/types";
import { Undo2 } from "lucide-react";

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
  const canUpdate = permissions.includes("pantry.update");

  const [exit, setExit] = React.useState<ApiPantryExit | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [reversing, setReversing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token || !exitId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getPantryExit(token, exitId);
      setExit(response);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar saída.";
      setError(message);
      setExit(null);
    } finally {
      setLoading(false);
    }
  }, [token, exitId]);

  React.useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

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
        type: "text",
        required: true,
        helperText: "Informe de onde o item está sendo retirado.",
      },
      { name: "quantity", label: "Quantidade", type: "number", required: true },
      {
        name: "unit",
        label: "Unidade",
        type: "text",
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
        const message = "Você não tem permissão para editar saídas.";
        setError(message);
        throw new Error(message);
      }

      const sector = values.sector?.trim() ?? "";
      const quantity =
        typeof values.quantity === "number" ? values.quantity : Number(values.quantity);
      const rawUnit = values.unit?.trim() ?? "";
      const rawExitDate = values.exitDate?.trim() ?? "";
      const eventName = values.eventName?.trim() ?? "";
      const rawNotes = values.notes?.trim() ?? "";

      if (!sector) {
        setError("Informe o setor (local físico).");
        return;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError("Informe uma quantidade válida.");
        return;
      }
      if ((values.type === "EVENT" || values.type === "PARTY") && !eventName) {
        setError("Informe o nome do evento.");
        return;
      }

      setSaving(true);
      setError(null);
      try {
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
        onOpenChange(false);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao editar saída.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token, exitId, exit, canUpdate, onSaved, onOpenChange],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setError(null);
          setExit(null);
        }
      }}
      title="Editar saída"
      description="Ajuste a saída. A alocação por lote é recalculada automaticamente (FEFO), salvo quando o sistema já selecionou um lote específico."
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

              const confirmed = window.confirm(
                "Estornar esta saída vai criar uma ou mais ENTRADAS de correção devolvendo o estoque ao(s) lote(s) (validade/setor). Deseja continuar?",
              );
              if (!confirmed) return;

              setReversing(true);
              setError(null);
              try {
                await reversePantryExit(token, exitId);
                await Promise.resolve(onSaved?.());
                onOpenChange(false);
              } catch (err) {
                const message =
                  err && typeof err === "object" && "message" in err
                    ? String((err as { message?: string }).message)
                    : "Falha ao estornar saída.";
                setError(message);
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
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

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
