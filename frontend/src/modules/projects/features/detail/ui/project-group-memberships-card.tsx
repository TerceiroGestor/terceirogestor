"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionCard } from "@/components/section-card";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  addEnrollmentToGroup,
  listProjectEnrollments,
  listProjectGroups,
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

type ProjectGroupMembershipsCardProps = {
  token: string;
  projectId: string;
  canReadStructure: boolean;
  canReadEnrollments: boolean;
  canUpdateEnrollments: boolean;
  canReadPeople: boolean;
};

export function ProjectGroupMembershipsCard({
  token,
  projectId,
  canReadStructure,
  canReadEnrollments,
  canUpdateEnrollments,
  canReadPeople,
}: ProjectGroupMembershipsCardProps) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { toast } = useToast();

  const [groups, setGroups] = React.useState<ApiProjectGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(
    null,
  );
  const [groupsLoading, setGroupsLoading] = React.useState(true);

  const [rows, setRows] = React.useState<ApiProjectEnrollment[]>([]);
  const [selectedRows, setSelectedRows] = React.useState<ApiProjectEnrollment[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const loadGroups = React.useCallback(async () => {
    if (!canReadStructure) {
      setGroups([]);
      setSelectedGroupId(null);
      setGroupsLoading(false);
      return;
    }

    setGroupsLoading(true);
    try {
      const data = await listProjectGroups(token, projectId);
      setGroups(data);
      setSelectedGroupId((prev) => {
        if (prev && data.some((g) => g.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch {
      setGroups([]);
      setSelectedGroupId(null);
    } finally {
      setGroupsLoading(false);
    }
  }, [token, projectId, canReadStructure]);

  const loadEnrollments = React.useCallback(async () => {
    if (!canReadEnrollments) {
      setLoading(false);
      setError("Você não tem permissão para listar participantes.");
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await listProjectEnrollments(token, projectId, {
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
    canReadEnrollments,
    search,
    pagination.pageIndex,
    pagination.pageSize,
  ]);

  React.useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setSelectedRows([]);
  }, [search, selectedGroupId]);

  React.useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const canManageMemberships =
    canUpdateEnrollments && Boolean(selectedGroupId) && !saving;

  const isRowMember = React.useCallback(
    (row: ApiProjectEnrollment) => {
      if (!selectedGroupId) return false;
      return (row.groups ?? []).some((group) => group.id === selectedGroupId);
    },
    [selectedGroupId],
  );

  const toggleMembership = React.useCallback(
    async (row: ApiProjectEnrollment, next: boolean) => {
      if (!selectedGroupId) return;
      if (!canUpdateEnrollments) return;
      if (row.status === "ENDED") return;
      setSaving(true);
      try {
        if (next) {
          await addEnrollmentToGroup(token, projectId, row.id, {
            groupId: selectedGroupId,
          });
        } else {
          await removeEnrollmentFromGroup(token, projectId, row.id, selectedGroupId);
        }
        await loadEnrollments();
      } catch (err) {
        toast({
          title: "Falha ao atualizar grupo",
          description:
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: string }).message)
              : "Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [
      token,
      projectId,
      selectedGroupId,
      canUpdateEnrollments,
      loadEnrollments,
      toast,
    ],
  );

  const handleBulkAdd = React.useCallback(async () => {
    if (!selectedGroupId) return;
    if (!canUpdateEnrollments) return;
    if (!selectedRows.length) return;
    setSaving(true);
    let updated = 0;
    try {
      await runInBatches(selectedRows, 6, async (row) => {
        if (row.status === "ENDED") return;
        if (isRowMember(row)) return;
        await addEnrollmentToGroup(token, projectId, row.id, {
          groupId: selectedGroupId,
        });
        updated += 1;
      });
      toast({
        title: "Grupo atualizado",
        description: `Adicionados: ${updated}`,
      });
      setSelectedRows([]);
      await loadEnrollments();
    } catch (err) {
      toast({
        title: "Falha ao adicionar",
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
    selectedGroupId,
    canUpdateEnrollments,
    selectedRows,
    isRowMember,
    token,
    projectId,
    toast,
    loadEnrollments,
  ]);

  const handleBulkRemove = React.useCallback(async () => {
    if (!selectedGroupId) return;
    if (!canUpdateEnrollments) return;
    if (!selectedRows.length) return;
    setSaving(true);
    let updated = 0;
    try {
      await runInBatches(selectedRows, 6, async (row) => {
        if (row.status === "ENDED") return;
        if (!isRowMember(row)) return;
        await removeEnrollmentFromGroup(token, projectId, row.id, selectedGroupId);
        updated += 1;
      });
      toast({
        title: "Grupo atualizado",
        description: `Removidos: ${updated}`,
      });
      setSelectedRows([]);
      await loadEnrollments();
    } catch (err) {
      toast({
        title: "Falha ao remover",
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
    selectedGroupId,
    canUpdateEnrollments,
    selectedRows,
    isRowMember,
    token,
    projectId,
    toast,
    loadEnrollments,
  ]);

  const columns = React.useMemo<ColumnDef<ApiProjectEnrollment>[]>(
    () => [
      {
        id: "member",
        header: "No grupo",
        size: 100,
        minSize: 100,
        maxSize: 140,
        cell: ({ row }) => {
          const disabled =
            !selectedGroupId ||
            !canUpdateEnrollments ||
            saving ||
            row.original.status === "ENDED";
          return (
            <div className="flex justify-center">
              <Switch
                checked={isRowMember(row.original)}
                disabled={disabled}
                onCheckedChange={(checked) => toggleMembership(row.original, checked)}
              />
            </div>
          );
        },
      },
      {
        id: "person",
        header: "Pessoa",
        accessorFn: (item) => item.person.fullName,
        size: 360,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonIdentityAvatarTrigger
              personId={row.original.person.id}
              tenantSlug={tenantSlug}
              fullName={row.original.person.fullName}
              birthDate={row.original.person.birthDate ?? null}
              avatarUrl={row.original.person.avatarUrl}
              isBirthdayToday={false}
            />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                {row.original.person.fullName}
              </p>
              {row.original.person.status ? (
                <p className="text-[11px] text-muted-foreground">
                  {row.original.person.status}
                </p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "age",
        header: "Idade",
        accessorFn: (item) => getAgeFromBirthDate(item.person.birthDate) ?? null,
        meta: { dataType: "number" },
        size: 90,
        maxSize: 120,
        cell: ({ row }) => {
          const age = getAgeFromBirthDate(row.original.person.birthDate);
          return <span className="text-xs text-muted-foreground">{age ?? "-"}</span>;
        },
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
    ],
    [
      tenantSlug,
      canReadPeople,
      selectedGroupId,
      canUpdateEnrollments,
      saving,
      isRowMember,
      toggleMembership,
    ],
  );

  return (
    <SectionCard
      title="Participantes no grupo"
      subtitle="Selecione um grupo e adicione/remova participantes já vinculados ao projeto."
      actions={
        canUpdateEnrollments ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!canManageMemberships || selectedRows.length === 0}
              onClick={handleBulkAdd}
            >
              Adicionar selecionados
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!canManageMemberships || selectedRows.length === 0}
              onClick={handleBulkRemove}
            >
              Remover selecionados
            </Button>
            <span className="text-xs text-muted-foreground">
              Selecionados: <strong>{selectedRows.length}</strong>
            </span>
          </div>
        ) : null
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Grupo</p>
          <Select
            value={selectedGroupId ?? undefined}
            onValueChange={(value) => setSelectedGroupId(value)}
            disabled={groupsLoading || groups.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um grupo" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!groupsLoading && groups.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Cadastre um grupo para gerenciar participantes.
            </p>
          ) : null}
        </div>
      </div>

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
        onPaginationChange={(next) => setPagination(next)}
        totalCount={totalCount}
        onGlobalFilterChange={setSearch}
        searchPlaceholder="Pesquisar participantes"
        showExportMenu={false}
        enableRowSelection
        onSelectedRowsChange={setSelectedRows}
        summaryCards={{
          totalLabel: "Total",
          filteredLabel: "Filtrados",
        }}
      />

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}
    </SectionCard>
  );
}
