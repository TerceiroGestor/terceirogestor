"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Person } from "./types";
import { formatCurrency, getInitials } from "./utils";

export function usePeopleColumns() {
  const columns: ColumnDef<Person>[] = [
    {
      accessorKey: "fullName",
      header: "Pessoa",
      cell: ({ row }) => {
        const person = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={String(person.avatar ?? "")} />
              <AvatarFallback>{getInitials(person.fullName)}</AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <p className="font-medium">{person.fullName}</p>
              <p className="text-xs text-muted-foreground">{person.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "cpf",
      header: "CPF",
    },
    {
      accessorKey: "addressCity",
      header: "Cidade",
    },
    {
      accessorKey: "income",
      header: "Renda",
      cell: ({ row }) => formatCurrency(row.original.income),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variant =
          status === "Ativo"
            ? "default"
            : status === "Em analise"
              ? "secondary"
              : "outline";
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
  ];

  return columns;
}
