"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/section-card";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import {
  createProjectActionPeopleParticipation,
  endProjectActionPeopleParticipation,
  listProjectActionPeopleParticipations,
  type ActionPeopleParticipationRole,
  type ApiProjectActionPeopleParticipation,
} from "@/modules/actions/api";
import {
  ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS,
  ACTION_PEOPLE_PARTICIPATION_ROLE_OPTIONS,
} from "@/modules/actions/shared/domain/actions.constants";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { PROJECT_PARTICIPATION_ROLE_LABELS } from "@/modules/projects/shared/domain/projects.constants";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { TableView } from "@/web-client/views/TableView";
import { ActionPeopleParticipationPickerDialog } from "./action-people-participation-picker-dialog";

type ActionPeopleParticipationsCardProps = {
  token: string;
  projectId: string;
  actionId: string;
  canUpdate: boolean;
};

export function ActionPeopleParticipationsCard({
  token,
  projectId,
  actionId,
  canUpdate,
}: ActionPeopleParticipationsCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [rows, setRows] = React.useState<ApiProjectActionPeopleParticipation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("__all__");
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listProjectActionPeopleParticipations(token, projectId, actionId, {
        q: search.trim() || undefined,
        role: roleFilter === "__all__" ? undefined : roleFilter,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setRows(response.data);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (nextError) {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao carregar people da acao.";
      setError(message);
      setRows([]);
      setPageCount(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [actionId, pagination.pageIndex, pagination.pageSize, projectId, roleFilter, search, token]);

  React.useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }, [search, roleFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const columns = React.useMemo<ColumnDef<ApiProjectActionPeopleParticipation>[]>(
    () => [
      {
        id: "person",
        header: "People",
        accessorFn: (row) => row.person.fullName,
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
              <div className="font-medium text-foreground">{row.original.person.fullName}</div>
              <div className="text-xs text-muted-foreground">
                {row.original.person.status ?? "-"}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Papel",
        accessorFn: (row) => ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[row.role],
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[row.original.role]}
          </span>
        ),
      },
      {
        id: "source",
        header: "Origem",
        accessorFn: (row) =>
          row.enrollment?.role
            ? PROJECT_PARTICIPATION_ROLE_LABELS[row.enrollment.role] ?? row.enrollment.role
            : "",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.enrollment?.role
              ? PROJECT_PARTICIPATION_ROLE_LABELS[row.original.enrollment.role] ??
                row.original.enrollment.role
              : "Sem participacao ativa no projeto"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          canUpdate ? (
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 rounded-none border-b border-border/60 px-1"
                onClick={async (event) => {
                  event.stopPropagation();
                  const accepted = await confirm({
                    title: "Encerrar participacao",
                    description: `Encerrar a participacao de "${row.original.person.fullName}" nesta acao preservando o historico?`,
                    confirmLabel: "Encerrar",
                    cancelLabel: "Cancelar",
                    confirmVariant: "destructive",
                  });
                  if (!accepted) return;
                  try {
                    await endProjectActionPeopleParticipation(
                      token,
                      projectId,
                      actionId,
                      row.original.id,
                    );
                    toast({ title: "Participacao encerrada" });
                    await load();
                  } catch (nextError) {
                    const message =
                      nextError && typeof nextError === "object" && "message" in nextError
                        ? String((nextError as { message?: string }).message)
                        : "Falha ao encerrar participacao.";
                    toast({
                      title: "Falha ao encerrar",
                      description: message,
                      variant: "destructive",
                    });
                  }
                }}
              >
                Encerrar
              </Button>
            </div>
          ) : null,
      },
    ],
    [actionId, canUpdate, confirm, load, projectId, tenantSlug, toast, token],
  );

  return (
    <>
      <SectionCard
        title="Equipe e apoio"
        subtitle="Registre quem executou, apoiou ou participou da acao com papel proprio."
        actions={
          canUpdate ? (
            <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
              Adicionar people
            </Button>
          ) : null
        }
      >
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar"
                className="h-9 rounded-none border-x-0 border-t-0 border-border/70 pl-6 pr-14 text-sm shadow-none focus-visible:ring-0"
              />
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[11px] font-medium tabular-nums text-muted-foreground">
                {totalCount.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="min-w-[240px]">
              <div className="mb-2 text-xs font-medium text-muted-foreground">Papel</div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 rounded-none border-x-0 border-t-0 border-border/70 bg-transparent px-0 text-sm shadow-none focus:ring-0">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {ACTION_PEOPLE_PARTICIPATION_ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TableView
            data={rows}
            columns={columns}
            minWidthClassName="min-w-[900px]"
            onRowClick={(row) =>
              router.push(withTenantPath(`/people/${row.person.id}`, tenantSlug))
            }
          />

          <PaginationBar
            pageIndex={pagination.pageIndex}
            pageCount={pageCount}
            pageSize={pagination.pageSize}
            onPageIndexChange={(next) =>
              setPagination((previous) => ({ ...previous, pageIndex: next }))
            }
            onPageSizeChange={(next) =>
              setPagination({ pageIndex: 0, pageSize: next })
            }
            disabled={loading}
          />
        </div>

        {loading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}
      </SectionCard>

      <ActionPeopleParticipationPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        token={token}
        projectId={projectId}
        actionId={actionId}
        onPick={async ({ enrollment, role }) => {
          try {
            await createProjectActionPeopleParticipation(token, projectId, actionId, {
              personId: enrollment.person.id,
              enrollmentId: enrollment.id,
              role,
            });
            toast({ title: "People adicionada" });
            await load();
          } catch (nextError) {
            const message =
              nextError && typeof nextError === "object" && "message" in nextError
                ? String((nextError as { message?: string }).message)
                : "Falha ao adicionar people.";
            toast({
              title: "Falha ao adicionar",
              description: message,
              variant: "destructive",
            });
          }
        }}
      />
    </>
  );
}
