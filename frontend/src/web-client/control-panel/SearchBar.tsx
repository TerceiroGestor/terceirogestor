"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export function SearchBar({
  value,
  onChange,
  placeholder = "Pesquisar...",
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className ?? "min-w-[220px] flex-1"}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  );
}
