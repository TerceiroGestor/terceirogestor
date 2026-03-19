"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionCard } from "@/components/section-card";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  listProjectCycles,
  listProjectEnrollments,
  setEnrollmentCycle,
  type ApiProjectCycle,
  type ApiProjectEnrollment,
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

type ProjectCycleParticipationsCardProps = {
  token: string;
  projectId: string;
  canReadStructure: boolean;
  canReadEnrollments: boolean;
  canUpdateEnrollments: boolean;
  canReadPeople: boolean;
};

export function ProjectCycleParticipationsCard({
  token,
  projectId,
  canReadStructure,
  canReadEnrollments,
  canUpdateEnrollments,
  canReadPeople,
}: ProjectCycleParticipationsCardProps) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { toast } = useToast();

  const [cycles, setCycles] = React.useState<ApiProjectCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = React.useState<string | null>(null);
  const [cyclesLoading, setCyclesLoading] = React.useState(true);

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

  const loadCycles = React.useCallback(async () => {
    if (!canReadStructure) {
      setCycles([]);
      setSelectedCycleId(null);
      setCyclesLoading(false);
      return;
    }

    setCyclesLoading(true);
    try {
      const data = await listProjectCycles(token, projectId);
      setCycles(data);
      setSelectedCycleId((prev) => {
        if (prev && data.some((c) => c.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch {
      setCycles([]);
      setSelectedCycleId(null);
    } finally {
      setCyclesLoading(false);
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
    loadCycles();
  }, [loadCycles]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setSelectedRows([]);
  }, [search, selectedCycleId]);

  React.useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const handleBulkSetCycle = React.useCallback(
    async (cycleId: string | null) => {
      if (!canUpdateEnrollments) return;
      if (selectedRows.length === 0) return;
      setSaving(true);
      let updated = 0;
      try {
        await runInBatches(selectedRows, 6, async (row) => {
          if (row.status === "ENDED") return;
          await setEnrollmentCycle(token, projectId, row.id, { cycleId });
          updated += 1;
        });
      toast({
        title: "Ciclo atualizado",
        description:
          cycleId === null
              ? `Vínculos encerrados: ${updated}`
              : `Definidos: ${updated}`,
        });
        setSelectedRows([]);
        await loadEnrollments();
      } catch (err) {
        toast({
          title: "Falha ao atualizar ciclo",
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
      canUpdateEnrollments,
      selectedRows,
      token,
      projectId,
      toast,
      loadEnrollments,
    ],
  );

  const columns = React.useMemo<ColumnDef<ApiProjectEnrollment>[]>(
    () => [
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
              hasHealthCondition={row.original.person.hasHealthCondition}
              hasMedication={row.original.person.hasMedication}
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
    [tenantSlug, canReadPeople],
  );

  const canManage = canUpdateEnrollments && !saving;

  return (
    <SectionCard
      title="Participantes no ciclo"
      subtitle="Defina ou encerre o ciclo atual de participantes já matriculados no projeto. As trocas preservam histórico."
      actions={
        canUpdateEnrollments ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!canManage || selectedRows.length === 0 || !selectedCycleId}
              onClick={() => handleBulkSetCycle(selectedCycleId)}
              title="Define o ciclo selecionado para os participantes marcados."
            >
              Definir ciclo
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!canManage || selectedRows.length === 0}
              onClick={() => handleBulkSetCycle(null)}
              title="Encerra o vínculo ativo com o ciclo atual."
            >
              Encerrar vínculo com ciclo
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
          <p className="text-xs font-medium text-foreground">Ciclo</p>
          <Select
            value={selectedCycleId ?? undefined}
            onValueChange={(value) => setSelectedCycleId(value)}
            disabled={cyclesLoading || cycles.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um ciclo" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!cyclesLoading && cycles.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Cadastre um ciclo para gerenciar participantes.
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
