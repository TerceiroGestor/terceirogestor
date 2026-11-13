"use client";

import * as React from "react";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionDialog } from "@/components/section-dialog";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { listPeopleGroups } from "@/modules/people-groups/api/people-groups";
import type { ApiPeopleGroup } from "@/modules/people-groups/api";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { ColumnVisibilityMenu } from "@/web-client/views/ListView";
import { TableView } from "@/web-client/views/TableView";

type ProjectPeopleGroupPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  purpose: "PUBLICO" | "EQUIPE";
  title?: string;
  actionLabel?: string;
  onPick: (peopleGroups: ApiPeopleGroup[]) => void | Promise<void>;
};

function formatAgeRange(ageMin: number | null | undefined, ageMax: number | null | undefined) {
  if (ageMin == null && ageMax == null) return "Livre";
  return `${ageMin ?? "-"} a ${ageMax ?? "-"}`;
}

function mergeUniqueGroups(current: ApiPeopleGroup[], incoming: ApiPeopleGroup[]) {
  return Array.from(
    new Map([...current, ...incoming].map((group) => [group.id, group])).values(),
  );
}

export function ProjectPeopleGroupPickerDialog({
  open,
  onOpenChange,
  token,
  purpose,
  title,
  actionLabel,
  onPick,
}: ProjectPeopleGroupPickerDialogProps) {
  const [rows, setRows] = React.useState<ApiPeopleGroup[]>([]);
  const [selected, setSelected] = React.useState<ApiPeopleGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const resolvedTitle =
    title ?? (purpose === "EQUIPE" ? "Vincular grupo de equipe" : "Vincular grupo de pessoas");
  const resolvedActionLabel = actionLabel ?? "Vincular";

  const handlePickOne = React.useCallback(
    (peopleGroup: ApiPeopleGroup) => {
      void onPick([peopleGroup]);
    },
    [onPick],
  );

  const columns = React.useMemo<ColumnDef<ApiPeopleGroup>[]>(
    () => [
      {
        id: "select",
        header: () => {
          const pageSelected =
            rows.length > 0 &&
            rows.every((group) => selected.some((item) => item.id === group.id));

          return (
            <Checkbox
              checked={pageSelected}
              onCheckedChange={(next) => {
                setSelected((previous) =>
                  next
                    ? mergeUniqueGroups(previous, rows)
                    : previous.filter((group) => !rows.some((row) => row.id === group.id)),
                );
              }}
              aria-label="Selecionar grupos da pagina"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const checked = selected.some((group) => group.id === row.original.id);
          return (
            <Checkbox
              checked={checked}
              onCheckedChange={(next) => {
                setSelected((previous) => {
                  if (next) return mergeUniqueGroups(previous, [row.original]);
                  return previous.filter((group) => group.id !== row.original.id);
                });
              }}
              aria-label={`Selecionar ${row.original.name}`}
            />
          );
        },
      },
      {
        accessorKey: "name",
        header: "Grupo institucional",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">{row.original.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.description?.trim() || "Sem descricao"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "purpose",
        header: "Finalidade",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.purpose === "EQUIPE" ? "Equipe" : "Publico"}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Categoria",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.category?.trim() || "-"}
          </span>
        ),
      },
      {
        id: "ageRange",
        header: "Faixa etaria",
        accessorFn: (row) => formatAgeRange(row.ageMin, row.ageMax),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatAgeRange(row.original.ageMin, row.original.ageMax)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                handlePickOne(row.original);
              }}
            >
              {resolvedActionLabel}
            </Button>
          </div>
        ),
      },
    ],
    [handlePickOne, resolvedActionLabel, rows, selected],
  );

  const load = React.useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listPeopleGroups(token, {
        q: search.trim() || undefined,
        purpose,
        isActive: true,
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
          : "Falha ao carregar grupos de pessoas.";
      setError(message);
      setRows([]);
      setPageCount(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [open, pagination.pageIndex, pagination.pageSize, purpose, search, token]);

  React.useEffect(() => {
    if (!open) return;
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }, [open, search]);

  React.useEffect(() => {
    if (!open) {
      setSelected([]);
    }
  }, [open]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handlePickSelected = React.useCallback(async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await onPick(selected);
      setSelected([]);
    } finally {
      setSaving(false);
    }
  }, [onPick, selected]);

  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={resolvedTitle}
      contentClassName="max-w-[980px]"
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Pesquisar"
              rightSlot={
                <div className="flex items-center gap-0.5">
                  <div className="whitespace-nowrap px-1 text-[11px] text-muted-foreground">
                    Total:{" "}
                    <span className="font-mono tabular-nums text-foreground">
                      {totalCount.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <ColumnVisibilityMenu
                    columns={columns}
                    visibility={columnVisibility}
                    onVisibilityChange={setColumnVisibility}
                    showTriggerLabel={false}
                    triggerVariant="ghost"
                    triggerSize="icon"
                  />
                </div>
              }
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="whitespace-nowrap text-muted-foreground">
              Selecionados: <strong>{selected.length}</strong>
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 px-3"
              disabled={saving || selected.length === 0}
              onClick={() => void handlePickSelected()}
            >
              {saving ? "Vinculando..." : resolvedActionLabel}
            </Button>
          </div>
        </div>

        <TableView
          data={rows}
          columns={columns}
          onRowClick={(row) => {
            setSelected((previous) =>
              previous.some((group) => group.id === row.id)
                ? previous.filter((group) => group.id !== row.id)
                : mergeUniqueGroups(previous, [row]),
            );
          }}
          showColumnVisibilityButton={false}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />

        <PaginationBar
          pageIndex={pagination.pageIndex}
          pageCount={pageCount}
          pageSize={pagination.pageSize}
          onPageIndexChange={(next) =>
            setPagination((previous) => ({ ...previous, pageIndex: next }))
          }
          onPageSizeChange={(next) => setPagination({ pageIndex: 0, pageSize: next })}
          disabled={loading}
        />
      </div>

      {loading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}
    </SectionDialog>
  );
}
