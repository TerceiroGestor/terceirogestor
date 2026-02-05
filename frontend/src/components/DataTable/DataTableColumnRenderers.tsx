"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ColumnConfig, ColumnRenderer } from "@/components/DataTable/DataTableColumnConfig";

export type DefaultColumnType =
  | "id"
  | "user"
  | "badge-outline"
  | "badge-secondary"
  | "text"
  | "number"
  | "status"
  | "health"
  | "money";

type UserMeta<TData> = {
  emailAccessor: (row: TData) => string;
  avatarAccessor?: (row: TData) => string | undefined;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

export const createDefaultColumnRenderers = <TData,>() =>
  ({
    id: (config: ColumnConfig<TData, DefaultColumnType>) => ({
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground">
          {row.getValue(config.id)}
        </span>
      ),
    }),
    user: (config: ColumnConfig<TData, DefaultColumnType>) => {
      const meta = config.meta as UserMeta<TData> | undefined;
      return {
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={meta?.avatarAccessor?.(row.original) || ""} />
              <AvatarFallback>
                {getInitials(String(row.getValue(config.id)))}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.getValue(config.id)}</p>
              <p className="text-xs text-muted-foreground">
                {meta?.emailAccessor(row.original) ?? ""}
              </p>
            </div>
          </div>
        ),
      };
    },
    "badge-outline": (config: ColumnConfig<TData, DefaultColumnType>) => ({
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue(config.id)}</Badge>
      ),
    }),
    "badge-secondary": (config: ColumnConfig<TData, DefaultColumnType>) => ({
      cell: ({ row }) => (
        <Badge variant="secondary">{row.getValue(config.id)}</Badge>
      ),
    }),
    text: () => ({}),
    number: (config: ColumnConfig<TData, DefaultColumnType>) => ({
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.getValue(config.id)}</span>
      ),
    }),
    status: (config: ColumnConfig<TData, DefaultColumnType>) => ({
      cell: ({ row }) => {
        const status = row.getValue(config.id) as "Active" | "Trial" | "Paused";
        const variant =
          status === "Active"
            ? "default"
            : status === "Trial"
              ? "secondary"
              : "outline";
        return <Badge variant={variant}>{status}</Badge>;
      },
    }),
    health: (config: ColumnConfig<TData, DefaultColumnType>) => ({
      cell: ({ row }) => {
        const health = row.getValue(config.id) as
          | "Healthy"
          | "Needs Attention"
          | "At Risk";
        const variant =
          health === "Healthy"
            ? "default"
            : health === "Needs Attention"
              ? "secondary"
              : "outline";
        return <Badge variant={variant}>{health}</Badge>;
      },
    }),
    money: (config: ColumnConfig<TData, DefaultColumnType>) => ({
      cell: ({ row }) => (
        <span className="font-medium">
          ${Number(row.getValue(config.id)).toLocaleString("en-US")}
        </span>
      ),
    }),
  }) satisfies Record<DefaultColumnType, ColumnRenderer<TData, DefaultColumnType>>;
