"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { FormEngine } from "@/components/FormEngine";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantryExit,
  deletePantryExit,
  listPantryExits,
  listPantryItems,
  updatePantryExit,
  type ApiPantryExit,
  type ApiPantryItem,
} from "@/features/pantry/api";
import { buildPantryExitFormFields } from "@/features/pantry/config/pantry-exit-form-config";
import type { PantryExitFormValues } from "@/features/pantry/domain/types";
import { PantrySubnav } from "@/features/pantry/ui/pantry-subnav";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { formatDateOnlyPtBR, todayLocalIsoDate } from "@/lib/date";

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

function toDateOnly(value: string | null | undefined) {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function todayIsoDate() {
  return todayLocalIsoDate();
}

function exitTypeLabel(type: ApiPantryExit["type"] | string) {
  switch (type) {
    case "ATTENDED":
      return "Atendidos";
    case "DONATION":
      return "Doações";
    case "EVENT":
      return "Eventos";
    case "PARTY":
      return "Festas";
    case "CORRECTION":
      return "Correção";
    default:
      return type;
  }
}

export function PantryExitsClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");
  const canUpdate = permissions.includes("pantry.update");
  const canDelete = permissions.includes("pantry.delete");

  const [rows, setRows] = React.useState<ApiPantryExit[]>([]);
  const [items, setItems] = React.useState<ApiPantryItem[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiPantryExit | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const itemOptions = React.useMemo(
    () => items.map((item) => ({ label: item.name, value: item.id })),
    [items],
  );

  const columns = React.useMemo<ColumnDef<ApiPantryExit>[]>(
    () => [
      {
        accessorKey: "exitDate",
        header: "Data",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.exitDate)}
          </span>
        ),
      },
      {
        accessorKey: "item",
        header: "Alimento",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {row.original.item?.name ?? row.original.itemId}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Unidade: {row.original.item?.unit ?? row.original.unit}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "sector",
        header: "Setor",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.sector}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Uso",
        cell: ({ row }) => (
          <Badge variant="outline">{exitTypeLabel(row.original.type)}</Badge>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Qtd.",
        cell: ({ row }) => (
          <span className="text-xs font-mono tabular-nums text-foreground">
            {Number(row.original.quantity).toLocaleString("pt-BR")} {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: "eventName",
        header: "Evento",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.eventName || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const loadLookups = React.useCallback(async () => {
    if (!token || !canRead) return;
    try {
      const itemsResponse = await listPantryItems(token, { all: true, limit: 200 });
      setItems(itemsResponse.data);
    } catch {
      // lookup failure should not block listing
    }
  }, [token, canRead]);

  const loadExits = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listPantryExits(token, {
        q: search.trim() || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setRows(response.data);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar saídas.";
      setError(message);
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, canRead, pagination.pageIndex, pagination.pageSize, search]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canRead) {
      setLoading(false);
      return;
    }
    loadLookups();
    loadExits();
  }, [authLoading, token, isAuthenticated, canRead, loadLookups, loadExits]);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openEdit = React.useCallback(
    (exit: ApiPantryExit) => {
      if (!canUpdate) {
        setError("Você não tem permissão para editar saídas.");
        return;
      }
      setEditing(exit);
      setFormError(null);
      setDialogOpen(true);
    },
    [canUpdate],
  );

  const onDelete = React.useCallback(
    async (exit: ApiPantryExit) => {
      if (!token) return;
      if (!canDelete) {
        setError("Você não tem permissão para excluir saídas.");
        return;
      }
      const confirmed = await confirm({
        title: "Excluir saída",
        description: "Excluir esta saída?",
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deletePantryExit(token, exit.id);
        await loadExits();
        toast({ title: "Saída excluída", variant: "success" });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao excluir saída.";
        setError(message);
        toast({ title: "Falha ao excluir", description: message, variant: "destructive" });
      }
    },
    [token, canDelete, loadExits, confirm, toast],
  );

  const handleSubmit = React.useCallback(
    async (values: PantryExitFormValues) => {
      if (!token) return;
      if (editing && !canUpdate) {
        setFormError("Você não tem permissão para editar saídas.");
        return;
      }
      if (!editing && !canCreate) {
        setFormError("Você não tem permissão para criar saídas.");
        return;
      }

      const item = items.find((candidate) => candidate.id === values.itemId);
      const rawUnit = values.unit?.trim() ?? "";
      const rawNotes = values.notes?.trim() ?? "";
      const rawExitDate = values.exitDate?.trim() ?? "";
      const rawEventName = values.eventName?.trim() ?? "";
      const rawSector = values.sector?.trim() ?? "";
      const quantity =
        typeof values.quantity === "number" ? values.quantity : Number(values.quantity);

      if (!values.itemId) {
        setFormError("Selecione um alimento.");
        return;
      }
      if (!rawSector) {
        setFormError("Informe o setor (local físico).");
        return;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setFormError("Informe uma quantidade válida.");
        return;
      }
      if ((values.type === "EVENT" || values.type === "PARTY") && !rawEventName) {
        setFormError("Informe o nome do evento.");
        return;
      }

      const payload = {
        itemId: values.itemId,
        sector: rawSector,
        quantity,
        unit: rawUnit || item?.unit || "unidade",
        exitDate: rawExitDate || undefined,
        type: values.type,
        eventName: rawEventName ? rawEventName : null,
        notes: rawNotes ? rawNotes : null,
      };

      setSaving(true);
      setFormError(null);
      try {
        if (editing) {
          await updatePantryExit(token, editing.id, payload);
        } else {
          await createPantryExit(token, payload);
        }
        setDialogOpen(false);
        setEditing(null);
        await loadExits();
        toast({
          title: editing ? "Saída atualizada" : "Saída criada",
          variant: "success",
        });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar saída.";
        setFormError(message);
        toast({ title: "Falha ao salvar", description: message, variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [token, editing, canUpdate, canCreate, items, loadExits, toast],
  );

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Despensa · Saídas"
        items={[{ label: "Despensa", href: "/pantry" }, { label: "Saídas" }]}
      />

      <PantrySubnav />

      <SectionCard
        title="Saídas"
        subtitle="Registro rápido de consumo/uso."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadExits}>
              Atualizar
            </Button>
            <Button onClick={openCreate} disabled={!canCreate}>
              Nova saída
            </Button>
          </div>
        }
      >
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <DataTable
          columns={columns}
          data={rows}
          manualPagination
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalCount={totalCount}
          onGlobalFilterChange={setSearch}
          searchPlaceholder="Pesquisar saídas"
          summaryCards={{
            totalLabel: "Total",
            filteredLabel: "Filtrados",
          }}
          showExportMenu
          exportLabels={{ title: "Relatório", pdf: "Imprimir (PDF)", csv: "Baixar CSV" }}
          exportMeta={{ title: "Despensa - Saídas" }}
          rowActions={[
            { id: "edit", label: "Editar", onSelect: openEdit },
            { id: "delete", label: "Excluir", destructive: true, onSelect: onDelete },
          ]}
        />
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionCard>

      <SectionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar saída" : "Nova saída"}
        description="Registro rápido de consumo/uso da despensa."
        contentClassName="max-w-[720px]"
      >
        {formError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <FormEngine<PantryExitFormValues>
          fields={buildPantryExitFormFields({ itemOptions })}
          initialValues={
            editing
              ? {
                  itemId: editing.itemId,
                  sector: editing.sector ?? "Geral",
                  quantity: editing.quantity,
                  unit: editing.unit,
                  exitDate: toDateOnly(editing.exitDate),
                  type: editing.type,
                  eventName: editing.eventName ?? "",
                  notes: editing.notes ?? "",
                }
              : { sector: "Geral", type: "ATTENDED", exitDate: todayIsoDate() }
          }
          disabled={saving}
          onSubmit={handleSubmit}
          actions={{
            submit: {
              label: saving ? "Salvando..." : "Salvar",
              variant: "primary",
            },
            cancel: {
              label: "Cancelar",
              variant: "ghost",
              onClick: () => setDialogOpen(false),
            },
          }}
        />
      </SectionDialog>
    </div>
  );
}
