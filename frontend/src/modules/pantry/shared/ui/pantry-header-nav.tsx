"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  History,
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageSearch,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

type PantryHeaderNavProps = {
  className?: string;
};

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  section: "Painel" | "Registros" | "Relatórios";
};

export function PantryHeaderNav({ className }: PantryHeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const panelHref = withTenantPath("/pantry", tenantSlug);
  const stockHref = withTenantPath("/pantry/stock", tenantSlug);
  const itemsHref = withTenantPath("/pantry/items", tenantSlug);
  const entriesHref = withTenantPath("/pantry/entries", tenantSlug);
  const exitsHref = withTenantPath("/pantry/exits", tenantSlug);
  const historyHref = withTenantPath("/pantry/history", tenantSlug);

  const isPanel = pathname === panelHref;
  const isStock = pathname.startsWith(stockHref);
  const isItems = pathname.startsWith(itemsHref);
  const isEntries = pathname.startsWith(entriesHref);
  const isExits = pathname.startsWith(exitsHref) || pathname.startsWith(withTenantPath("/pantry/exit", tenantSlug));
  const isHistory = pathname.startsWith(historyHref);

  const items = React.useMemo<NavItem[]>(
    () => [
      {
        id: "panel",
        label: "Painel",
        href: panelHref,
        active: isPanel,
        icon: LayoutDashboard,
        section: "Painel",
      },
      {
        id: "stock",
        label: "Estoque",
        href: stockHref,
        active: isStock,
        icon: Package,
        section: "Painel",
      },
      {
        id: "items",
        label: "Itens",
        href: itemsHref,
        active: isItems,
        icon: PackageSearch,
        section: "Registros",
      },
      {
        id: "exits",
        label: "Saídas",
        href: exitsHref,
        active: isExits,
        icon: Truck,
        section: "Registros",
      },
      {
        id: "entries",
        label: "Entradas",
        href: entriesHref,
        active: isEntries,
        icon: PackagePlus,
        section: "Registros",
      },
      {
        id: "history",
        label: "Histórico",
        href: historyHref,
        active: isHistory,
        icon: History,
        section: "Relatórios",
      },
    ],
    [
      entriesHref,
      exitsHref,
      historyHref,
      isEntries,
      isExits,
      isHistory,
      isItems,
      isPanel,
      isStock,
      itemsHref,
      panelHref,
      stockHref,
    ],
  );

  const activeItem = React.useMemo(() => {
    return items.find((item) => item.active) ?? items[0];
  }, [items]);

  const bySection = React.useMemo(() => {
    const map = new Map<NavItem["section"], NavItem[]>();
    items.forEach((item) => {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    });
    return map;
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
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {(["Painel", "Registros", "Relatórios"] as const).map((section, index) => {
          const sectionItems = bySection.get(section) ?? [];
          if (!sectionItems.length) return null;
          return (
            <React.Fragment key={section}>
              {index > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuLabel className="text-[11px]">{section}</DropdownMenuLabel>
              {sectionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onSelect={() => router.push(item.href)}
                    className="gap-2 text-xs"
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{item.label}</span>
                    {item.active ? (
                      <Check className="ml-auto size-4 opacity-70" />
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
