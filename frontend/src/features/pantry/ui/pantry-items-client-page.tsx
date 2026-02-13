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
  createPantryItem,
  deletePantryItem,
  listPantryItems,
  updatePantryItem,
  type ApiPantryItem,
} from "@/features/pantry/api";
import { pantryItemFormFields } from "@/features/pantry/config/pantry-item-form-config";
import type { PantryItemFormValues } from "@/features/pantry/domain/types";
import { PantryItemMovementDialog } from "@/features/pantry/ui/pantry-item-movement-dialog";
import { PantrySubnav } from "@/features/pantry/ui/pantry-subnav";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { formatDateOnlyPtBR } from "@/lib/date";

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

function resolveValidityBadge(status: ApiPantryItem["validityStatus"]) {
  switch (status) {
    case "Normal":
      return <Badge variant="secondary">Normal</Badge>;
    case "Atencao":
      return (
        <Badge className="border-transparent bg-amber-500 text-white">
          Atenção
        </Badge>
      );
    case "Alerta":
      return (
        <Badge className="border-transparent bg-orange-500 text-white">
          Alerta
        </Badge>
      );
    case "Urgente":
      return <Badge variant="destructive">Urgente</Badge>;
    case "Vencido":
      return <Badge variant="destructive">Vencido</Badge>;
    default:
      return <Badge variant="outline">Sem validade</Badge>;
  }
}

function normalizeItemValues(values: PantryItemFormValues) {
  const name = values.name?.trim() ?? "";
  const group = values.group?.trim() || null;
  const unit = values.unit?.trim() ?? "";
  const minStock =
    typeof values.minStock === "number" ? values.minStock : Number(values.minStock);

  return {
    name,
    group,
    unit,
    minStock: Number.isFinite(minStock) ? minStock : 0,
  };
}

export function PantryItemsClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");
  const canUpdate = permissions.includes("pantry.update");
  const canDelete = permissions.includes("pantry.delete");

  const [rows, setRows] = React.useState<ApiPantryItem[]>([]);
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
  const [editing, setEditing] = React.useState<ApiPantryItem | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [selectedItem, setSelectedItem] = React.useState<ApiPantryItem | null>(
    null,
  );
  const [movementOpen, setMovementOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<ApiPantryItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Alimento",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {row.original.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.group || "Sem grupo"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "unit",
        header: "Unidade",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: "stock",
        header: "Saldo",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-mono tabular-nums text-foreground">
              {Number(row.original.stock).toLocaleString("pt-BR")}
            </p>
            {row.original.isBelowMin ? (
              <Badge variant="destructive">Abaixo do mínimo</Badge>
            ) : (
              <Badge variant="secondary">OK</Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "minStock",
        header: "Mínimo",
        cell: ({ row }) => (
          <span className="text-xs font-mono tabular-nums text-muted-foreground">
            {Number(row.original.minStock).toLocaleString("pt-BR")}
          </span>
        ),
      },
      {
        accessorKey: "validityStatus",
        header: "Validade",
        cell: ({ row }) => (
          <div className="space-y-1">
            {resolveValidityBadge(row.original.validityStatus)}
            <p className="text-[11px] text-muted-foreground">
              {row.original.nextExpiryDate
                ? `${formatDate(row.original.nextExpiryDate)}${
                    row.original.daysToExpire !== null
                      ? ` • ${row.original.daysToExpire} dia(s)`
                      : ""
                  }`
                : "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "lastMovementDate",
        header: "Último movimento",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.lastMovementDate)}
          </span>
        ),
      },
    ],
    [],
  );

  const loadItems = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listPantryItems(token, {
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
          : "Falha ao carregar alimentos.";
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
    loadItems();
  }, [authLoading, token, isAuthenticated, canRead, loadItems]);

  const openMovement = React.useCallback((item: ApiPantryItem) => {
    setSelectedItem(item);
    setMovementOpen(true);
  }, []);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openEdit = React.useCallback(
    (item: ApiPantryItem) => {
      if (!canUpdate) {
        setError("Você não tem permissão para editar alimentos.");
        return;
      }
      setEditing(item);
      setFormError(null);
      setDialogOpen(true);
    },
    [canUpdate],
  );

  const onDelete = React.useCallback(
    async (item: ApiPantryItem) => {
      if (!token) return;
      if (!canDelete) {
        setError("Você não tem permissão para excluir alimentos.");
        return;
      }
      const confirmed = await confirm({
        title: "Excluir alimento",
        description: `Excluir o alimento "${item.name}"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deletePantryItem(token, item.id);
        await loadItems();
        toast({ title: "Alimento excluído", variant: "success" });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao excluir alimento.";
        setError(message);
        toast({ title: "Falha ao excluir", description: message, variant: "destructive" });
      }
    },
    [token, canDelete, loadItems, confirm, toast],
  );

  const handleSubmit = React.useCallback(
    async (values: PantryItemFormValues) => {
      if (!token) return;
      if (editing && !canUpdate) {
        setFormError("Você não tem permissão para editar alimentos.");
        return;
      }
      if (!editing && !canCreate) {
        setFormError("Você não tem permissão para criar alimentos.");
        return;
      }

      const payload = normalizeItemValues(values);
      if (!payload.name || !payload.unit) {
        setFormError("Preencha nome e unidade.");
        return;
      }

      setSaving(true);
      setFormError(null);
      try {
        if (editing) {
          await updatePantryItem(token, editing.id, payload);
        } else {
          await createPantryItem(token, payload);
        }
        setDialogOpen(false);
        setEditing(null);
        await loadItems();
        toast({
          title: editing ? "Alimento atualizado" : "Alimento criado",
          variant: "success",
        });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar alimento.";
        setFormError(message);
        toast({ title: "Falha ao salvar", description: message, variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [token, editing, canUpdate, canCreate, loadItems, toast],
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
        title="Despensa · Alimentos"
        items={[{ label: "Despensa", href: "/pantry" }, { label: "Alimentos" }]}
      />

      <PantrySubnav />

      <SectionCard
        title="Alimentos"
        subtitle="Cadastro e saldo calculado automaticamente."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadItems}>
              Atualizar
            </Button>
            <Button onClick={openCreate} disabled={!canCreate}>
              Novo
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
          searchPlaceholder="Pesquisar alimentos"
          summaryCards={{
            totalLabel: "Total",
            filteredLabel: "Filtrados",
          }}
          showExportMenu
          exportLabels={{ title: "Relatório", pdf: "Imprimir (PDF)", csv: "Baixar CSV" }}
          exportMeta={{ title: "Despensa - Alimentos" }}
          rowActions={[
            { id: "move", label: "Movimentar", onSelect: openMovement },
            { id: "edit", label: "Editar", onSelect: openEdit },
            { id: "delete", label: "Excluir", destructive: true, onSelect: onDelete },
          ]}
          onRowClick={(row) => openMovement(row)}
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
        title={editing ? "Editar alimento" : "Novo alimento"}
        description="Cadastro simplificado: nome, unidade e estoque mínimo."
      >
        {formError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <FormEngine<PantryItemFormValues>
          fields={pantryItemFormFields}
          initialValues={
            editing
              ? {
                  name: editing.name,
                  group: editing.group ?? "",
                  unit: editing.unit,
                  minStock: editing.minStock,
                }
              : { unit: "kg", minStock: 0 }
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

      <PantryItemMovementDialog
        open={movementOpen}
        onOpenChange={(open) => {
          setMovementOpen(open);
          if (!open) setSelectedItem(null);
        }}
        item={
          selectedItem
            ? {
                id: selectedItem.id,
                name: selectedItem.name,
                unit: selectedItem.unit,
                stock: selectedItem.stock,
                minStock: selectedItem.minStock,
              }
            : null
        }
        onSaved={loadItems}
      />
    </div>
  );
}
