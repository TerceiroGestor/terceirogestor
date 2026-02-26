"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { FormEngine } from "@/components/FormEngine";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantryDonor,
  deletePantryDonor,
  listPantryDonors,
  updatePantryDonor,
  type ApiPantryDonor,
} from "@/modules/pantry/api";
import { pantryDonorFormFields } from "@/modules/pantry/features/donors/config/pantry-donor-form-config";
import type { PantryDonorFormValues } from "@/modules/pantry/shared/domain/types";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { formatDateOnlyPtBR } from "@/lib/date";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { ViewSwitcher } from "@/web-client/control-panel/ViewSwitcher";
import { usePersistedUrlState } from "@/web-client/screen/usePersistedUrlState";
import type { RecordBrowserViewOption } from "@/components/record-browser/RecordBrowserViewSwitcher";
import { KanbanView } from "@/web-client/views/KanbanView";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { LayoutGrid, Table2 } from "lucide-react";

function formatDate(value: string) {
  return formatDateOnlyPtBR(value);
}

function normalizeDonorValues(values: PantryDonorFormValues) {
  const name = values.name?.trim() ?? "";
  const type: "PERSON" | "COMPANY" =
    values.type === "COMPANY" ? "COMPANY" : "PERSON";
  const contact = values.contact?.trim() || null;
  return { name, type, contact };
}

export function PantryDonorsClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");
  const canUpdate = permissions.includes("pantry.update");
  const canDelete = permissions.includes("pantry.delete");

  const [rows, setRows] = React.useState<ApiPantryDonor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");

  const [screenState, setScreenState] = usePersistedUrlState<{
    view: "table" | "kanban";
  }>({
    storageKey: "screenState:pantry.donors",
    trackedKeys: ["v"],
    parse: (params) => {
      const raw = params.get("v");
      return { view: raw === "kanban" ? "kanban" : "table" };
    },
    serialize: (state) => ({ v: state.view === "table" ? undefined : state.view }),
  });

  const viewOptions = React.useMemo<RecordBrowserViewOption<"table" | "kanban">[]>(
    () => [
      { value: "table", label: "Tabela", icon: <Table2 className="size-4" /> },
      { value: "kanban", label: "Kanban", icon: <LayoutGrid className="size-4" /> },
    ],
    [],
  );

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiPantryDonor | null>(null);
  const [saving, setSaving] = React.useState(false);

  const columns = React.useMemo<ColumnDef<ApiPantryDonor>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Doador",
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-foreground">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.type === "COMPANY" ? "Empresa" : "Pessoa"}
          </Badge>
        ),
      },
      {
        accessorKey: "contact",
        header: "Contato",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.contact || "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Criado em",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const loadDonors = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    try {
      const response = await listPantryDonors(token, {
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
          : "Falha ao carregar doadores.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, canRead, pagination.pageIndex, pagination.pageSize, search, toast]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canRead) {
      setLoading(false);
      return;
    }
    loadDonors();
  }, [authLoading, token, isAuthenticated, canRead, loadDonors]);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEdit = React.useCallback(
    (donor: ApiPantryDonor) => {
      if (!canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar doadores.",
        });
        return;
      }
      setEditing(donor);
      setDialogOpen(true);
    },
    [canUpdate, toast],
  );

  const onDelete = React.useCallback(
    async (donor: ApiPantryDonor) => {
      if (!token) return;
      if (!canDelete) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para excluir doadores.",
        });
        return;
      }
      const confirmed = await confirm({
        title: "Excluir doador",
        description: `Excluir o doador "${donor.name}"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deletePantryDonor(token, donor.id);
        await loadDonors();
        toast({ title: "Doador excluído", variant: "success" });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao excluir doador.";
        toast({ title: "Falha ao excluir", description: message, variant: "destructive" });
      }
    },
    [token, canDelete, loadDonors, confirm, toast],
  );

  const handleSubmit = React.useCallback(
    async (values: PantryDonorFormValues) => {
      if (!token) return;
      if (editing && !canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar doadores.",
        });
        return;
      }
      if (!editing && !canCreate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para criar doadores.",
        });
        return;
      }

      const payload = normalizeDonorValues(values);
      if (!payload.name) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Preencha o nome.",
        });
        return;
      }

      setSaving(true);
      try {
        if (editing) {
          await updatePantryDonor(token, editing.id, payload);
        } else {
          await createPantryDonor(token, payload);
        }
        setDialogOpen(false);
        setEditing(null);
        await loadDonors();
        toast({
          title: editing ? "Doador atualizado" : "Doador criado",
          variant: "success",
        });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar doador.";
        toast({ title: "Falha ao salvar", description: message, variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [token, editing, canUpdate, canCreate, loadDonors, toast],
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
      <PageControlPanel
        searchSlot={
          <SearchBar value={search} onChange={setSearch} placeholder="Pesquisar doadores" />
        }
        viewSwitcherSlot={
          <ViewSwitcher
            value={screenState.view}
            options={viewOptions}
            onChange={(next) => setScreenState((prev) => ({ ...prev, view: next }))}
          />
        }
        rightSlot={
          <>
            <Button size="sm" variant="outline" onClick={loadDonors} disabled={loading}>
              Atualizar
            </Button>
            <Button size="sm" onClick={openCreate} disabled={!canCreate}>
              Novo
            </Button>
            <div className="text-xs text-muted-foreground">
              Total:{" "}
              <span className="font-mono tabular-nums text-foreground">
                {totalCount.toLocaleString("pt-BR")}
              </span>
            </div>
          </>
        }
      />

      <SectionCard
        title="Doadores"
        subtitle="Cadastro rápido para vincular entradas."
      >
        {screenState.view === "table" ? (
          <DataTable
            columns={columns}
            data={rows}
            manualPagination
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={totalCount}
            toolbar={{ hideSearch: true, hideFiltersButton: true }}
            showExportMenu
            exportLabels={{ title: "Relatório", pdf: "Imprimir (PDF)", csv: "Baixar CSV" }}
            exportMeta={{ title: "Despensa - Doadores" }}
            rowActions={[
              { id: "edit", label: "Editar", onSelect: openEdit },
              { id: "delete", label: "Excluir", destructive: true, onSelect: onDelete },
            ]}
          />
        ) : (
          <div className="space-y-3">
            <KanbanView<ApiPantryDonor>
              items={rows}
              getColumnKey={(row) => (row.type === "COMPANY" ? "Empresa" : "Pessoa")}
              renderCard={(row) => (
                <div className="rounded-md border border-border/60 bg-background px-3 py-2 hover:bg-muted/20">
                  <div className="truncate text-sm font-semibold text-foreground">{row.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Tipo: {row.type === "COMPANY" ? "Empresa" : "Pessoa"}
                  </div>
                  {row.contact ? (
                    <div className="mt-1 text-xs text-muted-foreground truncate">{row.contact}</div>
                  ) : null}
                </div>
              )}
            />
            <PaginationBar
              pageIndex={pagination.pageIndex}
              pageCount={pageCount}
              pageSize={pagination.pageSize}
              onPageIndexChange={(next) =>
                setPagination((prev) => ({ ...prev, pageIndex: next }))
              }
              onPageSizeChange={(next) =>
                setPagination((prev) => ({ ...prev, pageSize: next, pageIndex: 0 }))
              }
              disabled={loading}
            />
          </div>
        )}
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
        title={editing ? "Editar doador" : "Novo doador"}
        description="Cadastro rápido para vincular entradas."
      >
        <FormEngine<PantryDonorFormValues>
          fields={pantryDonorFormFields}
          initialValues={
            editing
              ? {
                  name: editing.name,
                  type: editing.type,
                  contact: editing.contact ?? "",
                }
              : { type: "PERSON" }
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
