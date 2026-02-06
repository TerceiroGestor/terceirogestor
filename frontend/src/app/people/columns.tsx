"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PeopleTableItem } from "./types";
import { formatDate, getInitials } from "./utils";
import { resolveMediaUrl } from "@/lib/api";

const getStatusVariant = (status?: PeopleTableItem["status"]) => {
  if (status === "Ativo") return "default";
  if (status === "Inativo") return "secondary";
  return "outline";
};

export function usePeopleColumns() {
  const columns: ColumnDef<PeopleTableItem>[] = [
    {
      accessorKey: "fullName",
      header: "Pessoa",
      meta: { dataType: "string" },
      cell: ({ row }) => {
        const person = row.original;
        const avatarSrc = resolveMediaUrl(person.avatarUrl || "/avatar.jpg");
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback>{getInitials(person.fullName)}</AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <p className="font-medium">{person.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {person.socialName ?? "-"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      meta: { dataType: "string" },
      cell: ({ row }) => row.original.email ?? "-",
    },
    {
      accessorKey: "phone",
      header: "Telefone",
      meta: { dataType: "string" },
      cell: ({ row }) => row.original.phone ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { dataType: "string" },
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status ?? "Sem status"}
        </Badge>
      ),
    },
    {
      accessorKey: "document",
      header: "CPF",
      meta: { dataType: "string" },
      cell: ({ row }) => row.original.document ?? "-",
    },
    {
      accessorKey: "rg",
      header: "RG",
      meta: { dataType: "string" },
      cell: ({ row }) => row.original.rg ?? "-",
    },
    {
      accessorKey: "nis",
      header: "NIS",
      meta: { dataType: "string" },
      cell: ({ row }) => row.original.nis ?? "-",
    },
    {
      accessorKey: "birthDate",
      header: "Nascimento",
      meta: { dataType: "date" },
      cell: ({ row }) => formatDate(row.original.birthDate),
    },
    {
      accessorKey: "createdAt",
      header: "Cadastro",
      meta: { dataType: "date" },
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ];

  return columns;
}
