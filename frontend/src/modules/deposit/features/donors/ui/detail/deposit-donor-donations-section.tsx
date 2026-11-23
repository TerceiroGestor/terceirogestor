"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiDepositEntry } from "@/modules/deposit/api";
import { formatOptionalDate } from "@/modules/deposit/features/items/domain/deposit-item-detail.helpers";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";
import type { Domain } from "@/web-client/domain/types";

function filterDonationRows(rows: ApiDepositEntry[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [row.item?.name ?? "", row.sector, row.internalNotes ?? ""]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function donationColumns(): ColumnDef<ApiDepositEntry>[] {
  return [
    {
      id: "item",
      header: "Objeto",
      accessorFn: (row) => row.item?.name ?? "",
      cell: ({ row }) => (
        <div className="min-w-0 truncate font-medium">{row.original.item?.name ?? "Objeto"}</div>
      ),
    },
    {
      id: "sector",
      header: "Setor",
      accessorKey: "sector",
      cell: ({ row }) => <div className="truncate text-sm text-muted-foreground">{row.original.sector}</div>,
    },
    {
      id: "quantity",
      header: "Quantidade",
      accessorKey: "quantity",
      cell: ({ row }) => (
        <div className="font-mono tabular-nums">
          {Number(row.original.quantity).toLocaleString("pt-BR")}
        </div>
      ),
    },
    {
      id: "unit",
      header: "Un.",
      accessorKey: "unit",
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.unit}</div>,
    },
    {
      id: "entryDate",
      header: "Data",
      accessorKey: "entryDate",
      cell: ({ row }) => formatOptionalDate(row.original.entryDate),
    },
    {
      id: "expiryDate",
      header: "Data limite",
      accessorKey: "expiryDate",
      cell: ({ row }) => formatOptionalDate(row.original.expiryDate),
    },
    {
      id: "notes",
      header: "Notas",
      accessorKey: "internalNotes",
      cell: ({ row }) => (
        <TruncatedTextCell text={row.original.internalNotes} className="text-xs text-muted-foreground" />
      ),
    },
  ];
}

export function DepositDonorDonationsSection({
  rows,
  loading,
  onOpenEntry,
}: {
  rows: ApiDepositEntry[];
  loading: boolean;
  onOpenEntry: (entryId: string) => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);

  const columns = React.useMemo(() => donationColumns(), []);

  const filteredRows = React.useMemo(
    () => filterDonationRows(rows, searchText),
    [rows, searchText],
  );

  return (
    <RelationListHost<ApiDepositEntry>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar doações por objeto, setor ou notas"
      filteredCount={filteredRows.length}
      searchActionId="deposit.donor.donations"
      columns={columns}
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando doações...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Sem doações.</p>
      ) : (
        <ListView<ApiDepositEntry>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => onOpenEntry(row.id)}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
