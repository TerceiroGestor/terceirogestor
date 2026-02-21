"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, History, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PantryExpiringAlerts } from "@/modules/pantry/features/overview/hooks/use-pantry-dashboard";
import type { PantryExpiringItem } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-alerts-section";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

type PantryOverviewHeaderActionsProps = {
  expiringAlerts: PantryExpiringAlerts;
  onCreateEntry: () => void;
  onOpenMovement: (params: {
    itemId: string;
    name: string;
    unit: string;
    sector?: string;
  }) => void;
  onRefreshAlerts?: () => void;
};

export function PantryOverviewHeaderActions({
  expiringAlerts,
  onCreateEntry,
  onOpenMovement,
  onRefreshAlerts,
}: PantryOverviewHeaderActionsProps) {
  const totalCount = expiringAlerts.totalCount;
  const { expired, due7, due15, due30 } = expiringAlerts;
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const formatDate = React.useCallback(
    (value: string | null) => formatDateOnlyPtBR(value),
    [],
  );

  const sections = React.useMemo(
    () =>
      [
        { key: "expired", title: `Vencidos (${expired.length})`, rows: expired },
        { key: "due7", title: `Vence em até 7 dias (${due7.length})`, rows: due7 },
        { key: "due15", title: `Vence em até 15 dias (${due15.length})`, rows: due15 },
        { key: "due30", title: `Vence em até 30 dias (${due30.length})`, rows: due30 },
      ].filter((section) => section.rows.length),
    [due15, due30, due7, expired],
  );

  const renderRows = React.useCallback(
    (rows: PantryExpiringItem[]) =>
      rows.slice(0, 12).map((row) => (
        <DropdownMenuItem
          key={`${row.itemId}-${row.sector}-${row.nextExpiryDate ?? ""}`}
          className="cursor-pointer items-start"
          onSelect={() => {
            onOpenMovement({
              itemId: row.itemId,
              name: row.name,
              unit: row.unit,
              sector: row.sector,
            });
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{row.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Setor: {row.sector}
                  {row.nextExpiryDate ? ` • Validade: ${formatDate(row.nextExpiryDate)}` : ""}
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <div className="font-mono tabular-nums text-foreground">
                  {Number(row.stock).toLocaleString("pt-BR")} {row.unit}
                </div>
                {row.daysToExpire !== null ? (
                  <div>
                    {row.daysToExpire < 0
                      ? `Venceu há ${Math.abs(row.daysToExpire)}d`
                      : row.daysToExpire === 0
                        ? "Vence hoje"
                        : `Vence em ${row.daysToExpire}d`}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </DropdownMenuItem>
      )),
    [formatDate, onOpenMovement],
  );

  return (
    <>
      <Button asChild variant="outline" size="icon" aria-label="Histórico" title="Histórico">
        <Link href={withTenantPath("/pantry/history", tenantSlug)}>
          <History className="size-4" />
        </Link>
      </Button>

      <Button
        variant="outline"
        size="icon"
        aria-label="Nova entrada (lote)"
        title="Nova entrada (lote)"
        onClick={onCreateEntry}
      >
        <PackagePlus className="size-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Alertas"
            title="Alertas"
            className="relative"
          >
            <Bell className="size-4" />
            {totalCount ? (
              <span className="absolute -right-0.5 -top-0.5 block size-2 rounded-full bg-rose-500" />
            ) : null}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[360px]">
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span>Alertas</span>
            <span className="text-xs text-muted-foreground">
              {totalCount ? `${totalCount} alerta(s)` : "Sem alertas"}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {totalCount ? (
            <div className="max-h-[420px] overflow-auto">
              {sections.map((section, index) => (
                <React.Fragment key={section.key}>
                  {index ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuLabel className="py-1 text-xs text-muted-foreground">
                    {section.title}
                  </DropdownMenuLabel>
                  {renderRows(section.rows)}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              Nenhum alerta no momento.
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          {onRefreshAlerts ? (
            <DropdownMenuItem className="cursor-pointer" onSelect={onRefreshAlerts}>
              Atualizar alertas
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={withTenantPath("/pantry/history", tenantSlug)}>Abrir histórico</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

