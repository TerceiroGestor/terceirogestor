"use client";

import * as React from "react";
import { CalendarRange } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateOnlyPtBR, parseLocalDateOnly, toLocalIsoDate } from "@/lib/date";

export type DateRangeValue = { from: string; to: string };

export function DateRangeFilterButton({
  label,
  value,
  onChange,
  placeholder = "Período",
  disabled,
}: {
  label?: string;
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const selected: DateRange | undefined = React.useMemo(() => {
    const from = parseLocalDateOnly(value.from) ?? undefined;
    const to = parseLocalDateOnly(value.to) ?? undefined;
    if (!from && !to) return undefined;
    return { from, to };
  }, [value.from, value.to]);

  const hasValue = Boolean(value.from || value.to);
  const buttonLabel = hasValue
    ? `${value.from ? formatDateOnlyPtBR(value.from) : "…"} – ${value.to ? formatDateOnlyPtBR(value.to) : "…"}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-9 shrink-0 gap-2 font-normal"
        >
          <CalendarRange className="size-4 text-muted-foreground" />
          {buttonLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto space-y-3 p-3">
        {label ? (
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </div>
        ) : null}
        <Calendar
          mode="range"
          selected={selected}
          defaultMonth={selected?.from}
          numberOfMonths={1}
          onSelect={(range) => {
            onChange({
              from: range?.from ? toLocalIsoDate(range.from) : "",
              to: range?.to ? toLocalIsoDate(range.to) : "",
            });
          }}
        />
        {hasValue ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-center text-muted-foreground"
            onClick={() => {
              onChange({ from: "", to: "" });
              setOpen(false);
            }}
          >
            Limpar
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
