"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import {
  addEnrollmentToGroup,
  listProjectEnrollments,
  removeEnrollmentFromGroup,
  type ApiProjectEnrollment,
  type ApiProjectGroup,
} from "@/modules/projects/api";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { getAgeFromBirthDate } from "@/modules/people/shared/domain/utils";
import { usePathname } from "next/navigation";
import { getTenantSlugFromPath } from "@/lib/tenant-path";

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  run: (item: T) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.allSettled(batch.map((item) => run(item)));
  }
}

type ProjectGroupDetailCardProps = {
  token: string;
  projectId: string;
  group: ApiProjectGroup | null;
  canReadEnrollments: boolean;
  canUpdateEnrollments: boolean;
  canReadPeople: boolean;
};

export function ProjectGroupDetailCard({
  token,
  projectId,
  group,
  canReadEnrollments,
  canUpdateEnrollments,
  canReadPeople,
}: ProjectGroupDetailCardProps) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [rows, setRows] = React.useState<ApiProjectEnrollment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");

  const [linkOpen, setLinkOpen] = React.useState(false);
  const [availableRows, setAvailableRows] = React.useState<ApiProjectEnrollment[]>(
    [],
  );
  const [availableSelected, setAvailableSelected] = React.useState<
    ApiProjectEnrollment[]
  >([]);
  const [availableLoading, setAvailableLoading] = React.useState(false);
  const [availableError, setAvailableError] = React.useState<string | null>(null);
  const [availablePageCount, setAvailablePageCount] = React.useState(0);
  const [availableTotalCount, setAvailableTotalCount] = React.useState(0);
  const [availablePagination, setAvailablePagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [availableSearch, setAvailableSearch] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const loadMembers = React.useCallback(async () => {
    if (!group) {
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
      return;
    }
    if (!canReadEnrollments) {
      setError("Você não tem permissão para listar participantes.");
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await listProjectEnrollments(token, projectId, {
        groupId: group.id,
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
          : "Falha ao carregar participantes.";
      setError(message);
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    projectId,
    group,
    canReadEnrollments,
    search,
    pagination.pageIndex,
    pagination.pageSize,
  ]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setSearch("");
  }, [group?.id]);

  React.useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const loadAvailable = React.useCallback(async () => {
    if (!linkOpen) return;
    if (!group) return;
    if (!canReadEnrollments) {
      setAvailableError("Você não tem permissão para listar participantes.");
      setAvailableRows([]);
      return;
    }

    setAvailableLoading(true);
    setAvailableError(null);
    try {
      const response = await listProjectEnrollments(token, projectId, {
        status: "ACTIVE",
        excludeGroupId: group.id,
        q: availableSearch.trim() || undefined,
        page: availablePagination.pageIndex + 1,
        limit: availablePagination.pageSize,
      });
      setAvailableRows(response.data);
      setAvailableTotalCount(response.pagination.total);
      setAvailablePageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar participantes.";
      setAvailableError(message);
      setAvailableRows([]);
      setAvailableTotalCount(0);
      setAvailablePageCount(0);
    } finally {
      setAvailableLoading(false);
    }
  }, [
    linkOpen,
    group,
    canReadEnrollments,
    token,
    projectId,
    availableSearch,
    availablePagination.pageIndex,
    availablePagination.pageSize,
  ]);

  React.useEffect(() => {
    if (!linkOpen) return;
    setAvailablePagination((prev) => ({ ...prev, pageIndex: 0 }));
    setAvailableSelected([]);
  }, [linkOpen, availableSearch, group?.id]);

  React.useEffect(() => {
    loadAvailable();
  }, [loadAvailable]);

  const handleRemove = React.useCallback(
    async (item: ApiProjectEnrollment) => {
      if (!group) return;
      if (!canUpdateEnrollments) return;
      const confirmed = await confirm({
        title: "Encerrar vínculo com o grupo",
        description: `Encerrar o vínculo de "${item.person.fullName}" com o grupo "${group.name}" preservando o histórico?`,
        confirmLabel: "Encerrar",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await removeEnrollmentFromGroup(token, projectId, item.id, group.id);
        toast({ title: "Vínculo com o grupo encerrado" });
        loadMembers();
      } catch (err) {
        toast({
          title: "Falha ao encerrar vínculo",
          description:
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: string }).message)
              : "Tente novamente.",
          variant: "destructive",
        });
      }
    },
    [
      token,
      projectId,
      group,
      canUpdateEnrollments,
      confirm,
      toast,
      loadMembers,
    ],
  );

  const memberColumns = React.useMemo<ColumnDef<ApiProjectEnrollment>[]>(
    () => [
      {
        id: "person",
        header: "Pessoa",
        accessorFn: (item) => item.person.fullName,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonIdentityAvatarTrigger
              personId={row.original.person.id}
              tenantSlug={tenantSlug}
              fullName={row.original.person.fullName}
              birthDate={row.original.person.birthDate ?? null}
              avatarUrl={row.original.person.avatarUrl}
              hasHealthCondition={row.original.person.hasHealthCondition}
              hasMedication={row.original.person.hasMedication}
            />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                {row.original.person.fullName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {row.original.person.status ?? "-"}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "age",
        header: "Idade",
        accessorFn: (item) => getAgeFromBirthDate(item.person.birthDate) ?? null,
        meta: { dataType: "number" },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {getAgeFromBirthDate(row.original.person.birthDate) ?? "-"}
          </span>
        ),
      },
      ...(canReadPeople
        ? ([
            {
              id: "cycle",
              header: "Ciclo atual",
              accessorFn: (item) => item.cycle?.name ?? null,
              cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                  {row.original.cycle?.name ?? "-"}
                </span>
              ),
            },
          ] as ColumnDef<ApiProjectEnrollment>[])
        : []),
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "ENDED" ? "outline" : "secondary"}>
            {row.original.status === "ENDED" ? "Encerrada" : "Ativa"}
          </Badge>
        ),
      },
    ],
    [tenantSlug, canReadPeople],
  );

  const availableColumns = React.useMemo<ColumnDef<ApiProjectEnrollment>[]>(
    () => [
      {
        id: "person",
        header: "Pessoa",
        accessorFn: (item) => item.person.fullName,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonIdentityAvatarTrigger
              personId={row.original.person.id}
              tenantSlug={tenantSlug}
              fullName={row.original.person.fullName}
              birthDate={row.original.person.birthDate ?? null}
              avatarUrl={row.original.person.avatarUrl}
              hasHealthCondition={row.original.person.hasHealthCondition}
              hasMedication={row.original.person.hasMedication}
            />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                {row.original.person.fullName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {row.original.person.status ?? "-"}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "age",
        header: "Idade",
        accessorFn: (item) => getAgeFromBirthDate(item.person.birthDate) ?? null,
        meta: { dataType: "number" },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {getAgeFromBirthDate(row.original.person.birthDate) ?? "-"}
          </span>
        ),
      },
    ],
    [tenantSlug],
  );

  const handleLinkSelected = React.useCallback(async () => {
    if (!group) return;
    if (!canUpdateEnrollments) return;
    if (!availableSelected.length) return;
    setSaving(true);
    try {
      await runInBatches(availableSelected, 6, async (enrollment) => {
        await addEnrollmentToGroup(token, projectId, enrollment.id, {
          groupId: group.id,
        });
      });
      toast({
        title: "Vínculo concluído",
        description: `Vinculados: ${availableSelected.length}`,
      });
      setLinkOpen(false);
      loadMembers();
    } catch (err) {
      toast({
        title: "Falha ao vincular",
        description:
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [
    group,
    canUpdateEnrollments,
    availableSelected,
    token,
    projectId,
    toast,
    loadMembers,
  ]);

  if (!group) {
    return (
      <SectionCard
        title="Detalhes do grupo"
        subtitle="Selecione um grupo para ver os participantes."
      >
        <p className="text-xs text-muted-foreground">
          Clique em um grupo na lista ao lado.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={`Grupo • ${group.name}`}
      subtitle={group.description ?? "Sem descrição"}
      actions={
        canUpdateEnrollments ? (
          <Button type="button" onClick={() => setLinkOpen(true)}>
            <Plus className="mr-2 size-4" />
            Adicionar participantes
          </Button>
        ) : null
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <DataTable
        columns={memberColumns}
        data={rows}
        manualPagination
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(next) => setPagination(next)}
        totalCount={totalCount}
        onGlobalFilterChange={setSearch}
        searchPlaceholder="Pesquisar participantes no grupo"
        showExportMenu={false}
        rowActions={
          canUpdateEnrollments
            ? [
                {
                  id: "remove",
                  label: "Encerrar vínculo",
                  destructive: true,
                  onSelect: (row: ApiProjectEnrollment) => handleRemove(row),
                },
              ]
            : []
        }
        summaryCards={{
          totalLabel: "Total",
          filteredLabel: "Filtrados",
        }}
      />

      {loading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}

      <SectionDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        title={`Vincular pessoas • ${group.name}`}
        description="Selecione participantes já matriculados no projeto para adicionar neste grupo."
        contentClassName="max-w-[1100px]"
        headerSlot={
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Selecionados: <strong>{availableSelected.length}</strong>
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={saving || availableSelected.length === 0}
              onClick={handleLinkSelected}
            >
              {saving ? "Adicionando..." : "Adicionar selecionados"}
            </Button>
          </div>
        }
      >
        {availableError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {availableError}
          </div>
        ) : null}

        <DataTable
          columns={availableColumns}
          data={availableRows}
          manualPagination
          pageCount={availablePageCount}
          pagination={availablePagination}
          onPaginationChange={(next) => setAvailablePagination(next)}
          totalCount={availableTotalCount}
          onGlobalFilterChange={setAvailableSearch}
          searchPlaceholder="Pesquisar participantes"
          showExportMenu={false}
          enableRowSelection
          onSelectedRowsChange={setAvailableSelected}
          summaryCards={{
            totalLabel: "Total",
            filteredLabel: "Filtrados",
          }}
        />

        {availableLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionDialog>
    </SectionCard>
  );
}
