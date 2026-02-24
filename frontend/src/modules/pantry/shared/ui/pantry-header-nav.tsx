"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { History, Package, PackagePlus, Truck, Users } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

  const items = [
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
  ] as const;

  const activeId = React.useMemo(() => {
    if (isStock) return "stock";
    if (isEntries) return "entries";
    if (isExit) return "exit";
    if (isHistory) return "history";
    if (isDonors) return "donors";
    return "stock";
  }, [isEntries, isExit, isHistory, isStock, isDonors]);

  const hrefById = React.useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => map.set(item.id, item.href));
    return map;
  }, [items]);

  return (
    <ToggleGroup
      type="single"
      value={activeId}
      onValueChange={(next) => {
        if (!next) return;
        const href = hrefById.get(next);
        if (!href) return;
        router.push(href);
      }}
      className={cn("rounded-full bg-background/40", className)}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <ToggleGroupItem
            key={item.id}
            value={item.id}
            aria-label={item.label}
            title={item.label}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs",
              "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
              "data-[state=off]:bg-transparent",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden md:inline">{item.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
