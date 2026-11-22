"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname } from "next/navigation";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import { listPeople, type ApiPerson } from "@/modules/people/api";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { resolvePersonDisplayNames } from "@/modules/people/shared/domain/utils";
import type { ActionPeopleParticipationRole } from "@/modules/actions/api";
import { ACTION_PEOPLE_PARTICIPATION_ROLE_OPTIONS } from "@/modules/actions/shared/domain/actions.constants";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { TableView } from "@/web-client/views/TableView";
import { useAuth } from "@/features/auth/auth-context";

/**
 * Cadastro direto na equipe do Projeto (revisão da hierarquia de equipe,
 * 2026-11-21) - mesma busca genérica (listPeople) do picker de
 * responsáveis do Encontro. Continua funcionando independente da cadeia
 * automática que a Atividade/Encontro também podem disparar.
 */
type ProjectTeamPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (personIds: string[], role: ActionPeopleParticipationRole) => Promise<void>;
};

export function ProjectTeamPickerDialog({
  open,
  onOpenChange,
  onConfirm,
}: ProjectTeamPickerDialogProps) {
  const { token } = useAuth();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const [rows, setRows] = React.useState<ApiPerson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [searchText, setSearchText] = React.useState("");
  const [role, setRole] = React.useState<ActionPeopleParticipationRole>("RESPONSAVEL_TECNICO");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setSearchText("");
      setError(null);
    }
  }, [open]);

  const load = React.useCallback(async () => {
    if (!token || !open) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listPeople(token, {
        q: searchText.trim() || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setRows(response.data);
      setPageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar pessoas.";
      setError(message);
      setRows([]);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, open, pagination.pageIndex, pagination.pageSize, searchText]);

  React.useEffect(() => {
    if (!open) return;
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }, [open, searchText]);

  React.useEffect(() => {
    if (!open) return;
    void load();
  }, [load, open]);

  const toggleSelected = React.useCallback((personId: string) => {
    setSelectedIds((previous) =>
      previous.includes(personId)
        ? previous.filter((id) => id !== personId)
        : [...previous, personId],
    );
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      await onConfirm(selectedIds, role);
      setSelectedIds([]);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }, [onConfirm, onOpenChange, role, selectedIds]);

  const columns = React.useMemo<ColumnDef<ApiPerson>[]>(
    () => [
      {
        id: "select",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.includes(row.original.id)}
            onCheckedChange={() => toggleSelected(row.original.id)}
            aria-label={`Selecionar ${row.original.fullName}`}
          />
        ),
      },
      {
        accessorKey: "fullName",
        header: "Pessoa",
        cell: ({ row }) => {
          const display = resolvePersonDisplayNames(
            row.original.fullName,
            row.original.socialName,
          );
          return (
            <div className="flex items-center gap-3">
              <PersonIdentityAvatarTrigger
                personId={row.original.id}
                tenantSlug={tenantSlug}
                fullName={row.original.fullName}
                socialName={row.original.socialName}
                birthDate={row.original.birthDate ?? null}
                avatarUrl={row.original.avatarUrl}
                hasHealthCondition={row.original.hasHealthCondition ?? false}
                hasMedication={row.original.hasMedication ?? false}
              />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">{display.primary}</p>
                <p className="text-[11px] text-muted-foreground">
                  {row.original.personType ?? "-"} - {row.original.status ?? "-"}
                </p>
              </div>
            </div>
          );
        },
      },
    ],
    [selectedIds, tenantSlug, toggleSelected],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar pessoa à equipe do projeto"
      contentClassName="max-w-[900px] overflow-hidden"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Selecionados: <strong>{selectedIds.length}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={saving || selectedIds.length === 0}
              onClick={() => void handleConfirm()}
            >
              {saving ? "Adicionando..." : `Adicionar (${selectedIds.length})`}
            </Button>
          </div>
        </div>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex max-h-[72vh] flex-col gap-4 overflow-hidden">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchText}
              onChange={(next) => {
                setSearchText(next);
                setPagination((previous) => ({ ...previous, pageIndex: 0 }));
              }}
              placeholder="Pesquisar pessoa"
            />
          </div>
          <div className="min-w-[220px]">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Papel</div>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as ActionPeopleParticipationRole)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_PEOPLE_PARTICIPATION_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="min-w-0 overflow-x-auto">
            <TableView
              data={rows}
              columns={columns}
              minWidthClassName="min-w-[640px]"
              showColumnVisibilityButton={false}
              onRowClick={(row) => toggleSelected(row.id)}
            />
          </div>
        </div>

        <div className="border-t border-border/50 pt-3">
          <PaginationBar
            pageIndex={pagination.pageIndex}
            pageCount={pageCount}
            pageSize={pagination.pageSize}
            onPageIndexChange={(next) => setPagination((previous) => ({ ...previous, pageIndex: next }))}
            onPageSizeChange={(next) => setPagination({ pageIndex: 0, pageSize: next })}
            disabled={loading}
          />
        </div>
      </div>

      {loading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}
    </SectionDialog>
  );
}
