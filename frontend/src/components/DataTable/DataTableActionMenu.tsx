"use client";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ActionItem = {
  label: string;
  onSelect?: () => void;
  destructive?: boolean;
};

type DataTableActionMenuProps = {
  items: ActionItem[];
};

export function DataTableActionMenu({ items }: DataTableActionMenuProps) {
  const primaryItems = items.filter((item) => !item.destructive);
  const destructiveItems = items.filter((item) => item.destructive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border/60 bg-background hover:bg-muted/20"
          data-dt-stop-row-click
          aria-label="Ações"
          title="Ações"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        {primaryItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            data-dt-stop-row-click
            onSelect={(event) => {
              event.preventDefault();
              item.onSelect?.();
            }}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
        {destructiveItems.length ? <DropdownMenuSeparator /> : null}
        {destructiveItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            variant="destructive"
            data-dt-stop-row-click
            onSelect={(event) => {
              event.preventDefault();
              item.onSelect?.();
            }}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
