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
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        {primaryItems.map((item) => (
          <DropdownMenuItem key={item.label} onSelect={item.onSelect}>
            {item.label}
          </DropdownMenuItem>
        ))}
        {destructiveItems.length ? <DropdownMenuSeparator /> : null}
        {destructiveItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            variant="destructive"
            onSelect={item.onSelect}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
