"use client";

import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type RecordBrowserViewOption<V extends string> = {
  value: V;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

export function RecordBrowserViewSwitcher<V extends string>({
  value,
  options,
  onChange,
  className,
  size = "sm",
  showLabels = false,
}: {
  value: V;
  options: RecordBrowserViewOption<V>[];
  onChange: (next: V) => void;
  className?: string;
  size?: "sm" | "md";
  showLabels?: boolean;
}) {
  const itemClassName =
    size === "sm" ? "h-8 px-2 text-xs gap-1" : "h-9 px-3 text-sm gap-2";

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (!next) return;
        onChange(next as V);
      }}
      className={cn(size === "sm" ? "shrink-0 p-0.5" : "shrink-0", className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          title={option.label}
          aria-label={option.label}
          className={cn("px-2", itemClassName)}
        >
          {option.icon ? (
            <span className="text-muted-foreground">{option.icon}</span>
          ) : null}
          <span
            className={cn(
              option.icon ? (showLabels ? "hidden sm:inline" : "sr-only") : "",
            )}
          >
            {option.label}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
