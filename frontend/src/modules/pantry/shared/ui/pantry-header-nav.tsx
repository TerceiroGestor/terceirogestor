"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, History, Package, PackagePlus, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

type PantryHeaderNavProps = {
  className?: string;
};

export function PantryHeaderNav({ className }: PantryHeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const stockHref = withTenantPath("/pantry", tenantSlug);
  const entriesHref = withTenantPath("/pantry/entries", tenantSlug);
  const exitHref = withTenantPath("/pantry/exit", tenantSlug);
  const exitsHref = withTenantPath("/pantry/exits", tenantSlug);
  const historyHref = withTenantPath("/pantry/history", tenantSlug);
  const donorsHref = withTenantPath("/pantry/donors", tenantSlug);

  const isStock = pathname === stockHref;
  const isEntries = pathname.startsWith(entriesHref);
  const isExit = pathname.startsWith(exitHref) || pathname.startsWith(exitsHref);
  const isHistory = pathname.startsWith(historyHref);
  const isDonors = pathname.startsWith(donorsHref);

  const items = React.useMemo(
    () =>
      [
        {
          id: "stock",
          label: "Estoque",
          href: stockHref,
          active: isStock,
          icon: Package,
        },
        {
          id: "entries",
          label: "Entrada",
          href: entriesHref,
          active: isEntries,
          icon: PackagePlus,
        },
        {
          id: "exit",
          label: "Saída",
          href: exitHref,
          active: isExit,
          icon: Truck,
        },
        {
          id: "history",
          label: "Histórico",
          href: historyHref,
          active: isHistory,
          icon: History,
        },
        {
          id: "donors",
          label: "Doadores",
          href: donorsHref,
          active: isDonors,
          icon: Users,
        },
      ] as const,
    [
      stockHref,
      entriesHref,
      exitHref,
      historyHref,
      donorsHref,
      isStock,
      isEntries,
      isExit,
      isHistory,
      isDonors,
    ],
  );

  const activeItem = React.useMemo(() => {
    return items.find((item) => item.active) ?? items[0];
  }, [items]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-8 gap-2 px-2.5 text-xs", className)}
          aria-label="Menu da despensa"
          title="Menu da despensa"
        >
          <activeItem.icon className="size-4" />
          <span className="hidden sm:inline">{activeItem.label}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => router.push(item.href)}
              className="gap-2 text-xs"
            >
              <Icon className="size-4 text-muted-foreground" />
              <span>{item.label}</span>
              {item.active ? <Check className="ml-auto size-4 opacity-70" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

