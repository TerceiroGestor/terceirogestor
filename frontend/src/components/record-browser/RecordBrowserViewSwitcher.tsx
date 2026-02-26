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
}: {
  value: V;
  options: RecordBrowserViewOption<V>[];
  onChange: (next: V) => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (!next) return;
        onChange(next as V);
      }}
      className={cn("shrink-0", className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          title={option.label}
          aria-label={option.label}
          className="px-2"
        >
          {option.icon ? (
            <span className="text-muted-foreground">{option.icon}</span>
          ) : null}
          <span className={cn(option.icon ? "hidden sm:inline" : "")}>
            {option.label}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

