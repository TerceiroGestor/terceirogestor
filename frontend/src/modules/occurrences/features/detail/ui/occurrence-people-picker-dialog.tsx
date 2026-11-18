"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname } from "next/navigation";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import { listPeople, type ApiPerson } from "@/modules/people/api";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { resolvePersonDisplayNames } from "@/modules/people/shared/domain/utils";
import type { OccurrencePersonRole } from "@/modules/occurrences/api";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { TableView } from "@/web-client/views/TableView";
import { useAuth } from "@/features/auth/auth-context";

type OccurrencePeoplePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (person: ApiPerson, role: OccurrencePersonRole) => void | Promise<void>;
};

export function OccurrencePeoplePickerDialog({
  open,
  onOpenChange,
  onPick,
}: OccurrencePeoplePickerDialogProps) {
  const { token } = useAuth();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const [rows, setRows] = React.useState<ApiPerson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [searchText, setSearchText] = React.useState("");
  const [addingId, setAddingId] = React.useState<string | null>(null);

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

  const handlePick = React.useCallback(
    async (person: ApiPerson, role: OccurrencePersonRole) => {
      setAddingId(person.id);
      try {
        await onPick(person, role);
      } finally {
        setAddingId(null);
      }
    },
    [onPick],
  );

  const columns = React.useMemo<ColumnDef<ApiPerson>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Pessoa",
        cell: ({ row }) => (
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
              {(() => {
                const display = resolvePersonDisplayNames(row.original.fullName, row.original.socialName);
                return (
                  <>
                    <p className="text-xs font-semibold text-foreground">{display.primary}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {row.original.personType ?? "-"} - {row.original.status ?? "-"}
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={addingId === row.original.id}
              onClick={(event) => {
                event.stopPropagation();
                void handlePick(row.original, "ENVOLVIDO");
              }}
            >
              Envolvido
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={addingId === row.original.id}
              onClick={(event) => {
                event.stopPropagation();
                void handlePick(row.original, "TESTEMUNHA");
              }}
            >
              Testemunha
            </Button>
          </div>
        ),
      },
    ],
    [addingId, handlePick, tenantSlug],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar pessoa à ocorrência"
      description="Escolha o papel da pessoa ao adicionar."
      contentClassName="max-w-[900px] overflow-hidden"
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex max-h-[72vh] flex-col gap-4 overflow-hidden">
        <SearchBar
          value={searchText}
          onChange={(next) => {
            setSearchText(next);
            setPagination((previous) => ({ ...previous, pageIndex: 0 }));
          }}
          placeholder="Pesquisar pessoa"
        />

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="min-w-0 overflow-x-auto">
            <TableView data={rows} columns={columns} minWidthClassName="min-w-[640px]" showColumnVisibilityButton={false} />
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
