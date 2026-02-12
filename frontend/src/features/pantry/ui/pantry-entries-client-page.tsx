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
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantryEntry,
  deletePantryEntry,
  listPantryDonors,
  listPantryEntries,
  listPantryItems,
  updatePantryEntry,
  type ApiPantryDonor,
  type ApiPantryEntry,
  type ApiPantryItem,
} from "@/features/pantry/api";
import { buildPantryEntryFormFields } from "@/features/pantry/config/pantry-entry-form-config";
import type { PantryEntryFormValues } from "@/features/pantry/domain/types";
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

export function PantryEntriesClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");
  const canUpdate = permissions.includes("pantry.update");
  const canDelete = permissions.includes("pantry.delete");

  const [rows, setRows] = React.useState<ApiPantryEntry[]>([]);
  const [items, setItems] = React.useState<ApiPantryItem[]>([]);
  const [donors, setDonors] = React.useState<ApiPantryDonor[]>([]);

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
  const [editing, setEditing] = React.useState<ApiPantryEntry | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const itemOptions = React.useMemo(
    () => items.map((item) => ({ label: item.name, value: item.id })),
    [items],
  );

  const donorOptions = React.useMemo(
    () => donors.map((donor) => ({ label: donor.name, value: donor.id })),
    [donors],
  );

  const columns = React.useMemo<ColumnDef<ApiPantryEntry>[]>(
    () => [
      {
        accessorKey: "entryDate",
        header: "Data",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.entryDate)}
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
        accessorKey: "quantity",
        header: "Qtd.",
        cell: ({ row }) => (
          <span className="text-xs font-mono tabular-nums text-foreground">
            {Number(row.original.quantity).toLocaleString("pt-BR")} {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: "donor",
        header: "Doador",
        cell: ({ row }) =>
          row.original.donor ? (
            <span className="text-xs text-muted-foreground">
              {row.original.donor.name}
            </span>
          ) : (
            <Badge variant="outline">Sem doador</Badge>
          ),
      },
      {
        accessorKey: "expiryDate",
        header: "Validade",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.expiryDate)}
          </span>
        ),
      },
    ],
    [],
  );

  const loadLookups = React.useCallback(async () => {
    if (!token || !canRead) return;
    try {
      const [itemsResponse, donorsResponse] = await Promise.all([
        listPantryItems(token, { all: true, limit: 200 }),
        listPantryDonors(token, { all: true, limit: 200 }),
      ]);
      setItems(itemsResponse.data);
      setDonors(donorsResponse.data);
    } catch {
      // lookup failure should not block listing
    }
  }, [token, canRead]);

  const loadEntries = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listPantryEntries(token, {
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
          : "Falha ao carregar entradas.";
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
    loadEntries();
  }, [authLoading, token, isAuthenticated, canRead, loadLookups, loadEntries]);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openEdit = React.useCallback(
    (entry: ApiPantryEntry) => {
      if (!canUpdate) {
        setError("Você não tem permissão para editar entradas.");
        return;
      }
      setEditing(entry);
      setFormError(null);
      setDialogOpen(true);
    },
    [canUpdate],
  );

  const onDelete = React.useCallback(
    async (entry: ApiPantryEntry) => {
      if (!token) return;
      if (!canDelete) {
        setError("Você não tem permissão para excluir entradas.");
        return;
      }
      const confirmed = window.confirm("Excluir esta entrada?");
      if (!confirmed) return;
      try {
        await deletePantryEntry(token, entry.id);
        await loadEntries();
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao excluir entrada.";
        setError(message);
      }
    },
    [token, canDelete, loadEntries],
  );

  const handleSubmit = React.useCallback(
    async (values: PantryEntryFormValues) => {
      if (!token) return;
      if (editing && !canUpdate) {
        setFormError("Você não tem permissão para editar entradas.");
        return;
      }
      if (!editing && !canCreate) {
        setFormError("Você não tem permissão para criar entradas.");
        return;
      }

      const item = items.find((candidate) => candidate.id === values.itemId);
      const rawUnit = values.unit?.trim() ?? "";
      const rawNotes = values.notes?.trim() ?? "";
      const rawExpiry = values.expiryDate?.trim() ?? "";
      const rawEntryDate = values.entryDate?.trim() ?? "";
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

      const payload = {
        itemId: values.itemId,
        donorId:
          values.donorId && values.donorId !== "none" ? values.donorId : null,
        sector: rawSector,
        quantity,
        unit: rawUnit || item?.unit || "unidade",
        entryDate: rawEntryDate || undefined,
        expiryDate: rawExpiry ? rawExpiry : null,
        notes: rawNotes ? rawNotes : null,
      };

      setSaving(true);
      setFormError(null);
      try {
        if (editing) {
          await updatePantryEntry(token, editing.id, payload);
        } else {
          await createPantryEntry(token, payload);
        }
        setDialogOpen(false);
        setEditing(null);
        await loadEntries();
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar entrada.";
        setFormError(message);
      } finally {
        setSaving(false);
      }
    },
    [token, editing, canUpdate, canCreate, items, loadEntries],
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
        title="Despensa · Entradas"
        items={[{ label: "Despensa", href: "/pantry" }, { label: "Entradas" }]}
      />

      <PantrySubnav />

      <SectionCard
        title="Entradas"
        subtitle="Registro rápido do que chegou na despensa."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadEntries}>
              Atualizar
            </Button>
            <Button onClick={openCreate} disabled={!canCreate}>
              Nova entrada
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
          searchPlaceholder="Pesquisar entradas"
          summaryCards={{
            totalLabel: "Total",
            filteredLabel: "Filtrados",
          }}
          showExportMenu
          exportLabels={{ title: "Relatório", pdf: "Imprimir (PDF)", csv: "Baixar CSV" }}
          exportMeta={{ title: "Despensa - Entradas" }}
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
        title={editing ? "Editar entrada" : "Nova entrada"}
        description="Registro rápido do que chegou na despensa."
        contentClassName="max-w-[720px]"
      >
        {formError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <FormEngine<PantryEntryFormValues>
          fields={buildPantryEntryFormFields({ itemOptions, donorOptions })}
          initialValues={
            editing
              ? {
                  itemId: editing.itemId,
                  donorId: editing.donorId ?? "none",
                  sector: editing.sector ?? "Geral",
                  quantity: editing.quantity,
                  unit: editing.unit,
                  entryDate: toDateOnly(editing.entryDate),
                  expiryDate: toDateOnly(editing.expiryDate),
                  notes: editing.notes ?? "",
                }
              : { donorId: "none", sector: "Geral", entryDate: todayIsoDate() }
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
