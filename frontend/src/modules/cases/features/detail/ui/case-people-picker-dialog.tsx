"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { listPeople, type ApiPerson } from "@/modules/people/api";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { TableView } from "@/web-client/views/TableView";
import { useAuth } from "@/features/auth/auth-context";

type CasePeoplePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (person: ApiPerson) => void | Promise<void>;
};

export function CasePeoplePickerDialog({ open, onOpenChange, onPick }: CasePeoplePickerDialogProps) {
  const { token } = useAuth();
  const [rows, setRows] = React.useState<ApiPerson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pageCount, setPageCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [searchText, setSearchText] = React.useState("");
  const [pickingId, setPickingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token || !open) return;
    setLoading(true);
    try {
      const response = await listPeople(token, {
        q: searchText.trim() || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setRows(response.data);
      setPageCount(response.pagination.pages);
    } catch {
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
    async (person: ApiPerson) => {
      setPickingId(person.id);
      try {
        await onPick(person);
      } finally {
        setPickingId(null);
      }
    },
    [onPick],
  );

  const columns = React.useMemo<ColumnDef<ApiPerson>[]>(
    () => [
      { accessorKey: "fullName", header: "Pessoa" },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pickingId === row.original.id}
              onClick={(event) => {
                event.stopPropagation();
                void handlePick(row.original);
              }}
            >
              Selecionar
            </Button>
          </div>
        ),
      },
    ],
    [handlePick, pickingId],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Vincular pessoa ao caso"
      contentClassName="max-w-[700px] overflow-hidden"
    >
      <div className="flex max-h-[72vh] flex-col gap-4 overflow-hidden">
        <SearchBar
          value={searchText}
          onChange={(next) => setSearchText(next)}
          placeholder="Pesquisar pessoa"
        />
        <div className="min-h-0 flex-1 overflow-auto">
          <TableView data={rows} columns={columns} showColumnVisibilityButton={false} />
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
    </SectionDialog>
  );
}
