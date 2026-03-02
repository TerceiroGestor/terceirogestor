"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getWeek,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function toDateOnlyKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type CalendarMode = "day" | "week" | "month" | "year";

const weekdayLabels = ["DOM.", "SEG.", "TER.", "QUA.", "QUI.", "SEX.", "SÁB."] as const;

type DateFieldOption = { value: string; label: string };

export function CalendarView<TItem>({
  items,
  getDate,
  renderItem,
  mode: controlledMode,
  onModeChange,
  selected: controlledSelected,
  onSelectedChange,
  dateFieldOptions,
  activeDateField,
  onActiveDateFieldChange,
  rangeFrom,
  rangeTo,
  onRangeFromChange,
  onRangeToChange,
  className,
  emptyState = "Nenhum evento neste dia.",
}: {
  items: TItem[];
  getDate: (item: TItem) => Date | null;
  renderItem: (item: TItem) => React.ReactNode;
  mode?: CalendarMode;
  onModeChange?: (mode: CalendarMode) => void;
  selected?: Date;
  onSelectedChange?: (date: Date) => void;
  dateFieldOptions?: DateFieldOption[];
  activeDateField?: string;
  onActiveDateFieldChange?: (field: string) => void;
  rangeFrom?: string;
  rangeTo?: string;
  onRangeFromChange?: (value: string) => void;
  onRangeToChange?: (value: string) => void;
  className?: string;
  emptyState?: string;
}) {
  const [uncontrolledSelected, setUncontrolledSelected] = React.useState<Date>(new Date());
  const selected = controlledSelected ?? uncontrolledSelected;
  const setSelected = React.useCallback(
    (next: Date) => {
      onSelectedChange?.(next);
      if (!controlledSelected) setUncontrolledSelected(next);
    },
    [controlledSelected, onSelectedChange],
  );

  const [uncontrolledMode, setUncontrolledMode] = React.useState<CalendarMode>("month");
  const mode = controlledMode ?? uncontrolledMode;
  const setMode = React.useCallback(
    (next: CalendarMode) => {
      onModeChange?.(next);
      if (!controlledMode) setUncontrolledMode(next);
    },
    [controlledMode, onModeChange],
  );

  const byDay = React.useMemo(() => {
    const fromKey = rangeFrom?.trim() ? rangeFrom.trim() : null;
    const toKey = rangeTo?.trim() ? rangeTo.trim() : null;
    const map = new Map<string, TItem[]>();
    items.forEach((item) => {
      const date = getDate(item);
      if (!date) return;
      const key = toDateOnlyKey(date);
      if (fromKey && key < fromKey) return;
      if (toKey && key > toKey) return;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });
    return map;
  }, [getDate, items, rangeFrom, rangeTo]);

  const isKeyInRange = React.useCallback(
    (key: string) => {
      const fromKey = rangeFrom?.trim() ? rangeFrom.trim() : null;
      const toKey = rangeTo?.trim() ? rangeTo.trim() : null;
      if (fromKey && key < fromKey) return false;
      if (toKey && key > toKey) return false;
      return true;
    },
    [rangeFrom, rangeTo],
  );

  const selectedKey = selected ? toDateOnlyKey(selected) : null;
  const selectedItems = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  const title = React.useMemo(() => {
    if (mode === "year") return format(selected, "yyyy", { locale: ptBR });
    if (mode === "month") return format(selected, "MMMM yyyy", { locale: ptBR });
    if (mode === "week") {
      const start = startOfWeek(selected, { weekStartsOn: 0 });
      const end = addDays(start, 6);
      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
      return sameMonth
        ? `${format(start, "d", { locale: ptBR })}–${format(end, "d 'de' MMMM yyyy", { locale: ptBR })}`
        : `${format(start, "d 'de' MMM", { locale: ptBR })} – ${format(end, "d 'de' MMM yyyy", { locale: ptBR })}`;
    }
    return format(selected, "d 'de' MMMM yyyy", { locale: ptBR });
  }, [mode, selected]);

  const goPrev = React.useCallback(() => {
    if (mode === "day") setSelected(addDays(selected, -1));
    else if (mode === "week") setSelected(addWeeks(selected, -1));
    else if (mode === "month") setSelected(addMonths(selected, -1));
    else setSelected(addYears(selected, -1));
  }, [mode, selected, setSelected]);

  const goNext = React.useCallback(() => {
    if (mode === "day") setSelected(addDays(selected, 1));
    else if (mode === "week") setSelected(addWeeks(selected, 1));
    else if (mode === "month") setSelected(addMonths(selected, 1));
    else setSelected(addYears(selected, 1));
  }, [mode, selected, setSelected]);

  const goToday = React.useCallback(() => setSelected(new Date()), [setSelected]);

  const monthGrid = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(selected), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(selected), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [selected]);

  const weekGrid = React.useMemo(() => {
    const start = startOfWeek(selected, { weekStartsOn: 0 });
    const end = addDays(start, 6);
    return eachDayOfInterval({ start, end });
  }, [selected]);

  const yearMonths = React.useMemo(() => {
    const base = startOfYear(selected);
    return Array.from({ length: 12 }, (_, idx) => addMonths(base, idx));
  }, [selected]);

  const renderMonthGrid = ({
    days,
    compact,
  }: {
    days: Date[];
    compact: boolean;
  }) => {
    const rows = Math.ceil(days.length / 7);
    const showWeekNumbers = !compact;
    return (
      <div
        className={cn(
          "grid border border-border/60 bg-background",
          compact ? "rounded-md" : "rounded-md",
        )}
        style={{
          gridTemplateColumns: showWeekNumbers
            ? "auto repeat(7, minmax(0, 1fr))"
            : "repeat(7, minmax(0, 1fr))",
        }}
      >
        {Array.from({ length: rows }).map((_, r) => {
          const weekStart = days[r * 7]!;
          return (
            <React.Fragment key={`${weekStart.toISOString()}-row`}>
              {showWeekNumbers ? (
                <div
                  className={cn(
                    "flex items-center justify-center border-b border-r border-border/60 text-[11px] font-medium text-muted-foreground",
                    compact ? "h-10" : "h-16",
                  )}
                >
                  {getWeek(weekStart, { weekStartsOn: 0 })}
                </div>
              ) : null}
              {days.slice(r * 7, r * 7 + 7).map((day) => {
                const key = toDateOnlyKey(day);
                const count = byDay.get(key)?.length ?? 0;
                const isInMonth = isSameMonth(day, selected);
                const isSelected = isSameDay(day, selected);
                const today = isToday(day);
                const inRange = isKeyInRange(key);

                return (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      "relative border-b border-r border-border/60 text-left transition-colors hover:bg-muted/20 focus:outline-none",
                      compact ? "h-10 px-1.5" : "h-16 px-2",
                      !showWeekNumbers && (day.getDay() === 6) ? "border-r-0" : undefined,
                      !isInMonth ? "bg-muted/5 text-muted-foreground/60" : undefined,
                      isSelected ? "bg-primary/8 ring-1 ring-inset ring-primary/40" : undefined,
                      !inRange ? "opacity-40 hover:bg-transparent" : undefined,
                    )}
                    onClick={inRange ? () => setSelected(day) : undefined}
                    disabled={!inRange}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={cn(
                          "text-xs tabular-nums",
                          today ? "font-semibold text-primary" : "text-foreground",
                        )}
                      >
                        {format(day, "d", { locale: ptBR })}
                      </div>
                      {count ? (
                        <div
                          className={cn(
                            "rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] font-medium text-primary",
                            compact ? "leading-none" : undefined,
                          )}
                          title={`${count} evento(s)`}
                        >
                          {count}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start", className)}>
      <div className="rounded-md border border-border/60 bg-background">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
          <div className="flex items-center gap-1">
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={goPrev} aria-label="Anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={goNext} aria-label="Próximo">
              <ChevronRight className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="secondary" className="h-8 px-3 text-xs" onClick={goToday}>
              Hoje
            </Button>
          </div>

          <div className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{title}</div>

          <Select value={mode} onValueChange={(value) => setMode(value as CalendarMode)}>
            <SelectTrigger className="h-8 w-[7rem] text-xs">
              <SelectValue placeholder="Visão..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>

          {dateFieldOptions?.length && onActiveDateFieldChange ? (
            <Select
              value={
                dateFieldOptions.some((opt) => opt.value === activeDateField)
                  ? (activeDateField as string)
                  : dateFieldOptions[0]!.value
              }
              onValueChange={(value) => onActiveDateFieldChange(value)}
            >
              <SelectTrigger className="h-8 w-[12rem] text-xs">
                <SelectValue placeholder="Data..." />
              </SelectTrigger>
              <SelectContent>
                {dateFieldOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {onRangeFromChange ? (
            <Input
              type="date"
              value={rangeFrom ?? ""}
              onChange={(e) => onRangeFromChange(e.target.value)}
              className="h-8 w-[9rem] text-xs"
              title="Início"
            />
          ) : null}
          {onRangeToChange ? (
            <Input
              type="date"
              value={rangeTo ?? ""}
              onChange={(e) => onRangeToChange(e.target.value)}
              className="h-8 w-[9rem] text-xs"
              title="Fim"
            />
          ) : null}
        </div>

        <div className="p-3">
          {mode === "month" ? (
            <div className="space-y-2">
              <div className="grid text-xs font-semibold text-muted-foreground" style={{ gridTemplateColumns: "auto repeat(7, minmax(0, 1fr))" }}>
                <div className="px-2 py-1" />
                {weekdayLabels.map((w) => (
                  <div key={w} className="px-2 py-1 text-center">
                    {w}
                  </div>
                ))}
              </div>
              {renderMonthGrid({ days: monthGrid, compact: false })}
            </div>
          ) : mode === "week" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-2">
                {weekGrid.map((day) => {
                  const key = toDateOnlyKey(day);
                  const selectedDay = isSameDay(day, selected);
                  const count = byDay.get(key)?.length ?? 0;
                  const inRange = isKeyInRange(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={cn(
                        "flex flex-col gap-2 rounded-md border border-border/60 bg-background px-2 py-2 text-left hover:bg-muted/20",
                        selectedDay ? "ring-1 ring-inset ring-primary/40" : undefined,
                        !inRange ? "opacity-40 hover:bg-transparent" : undefined,
                      )}
                      onClick={inRange ? () => setSelected(day) : undefined}
                      disabled={!inRange}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className={cn("text-xs font-semibold", isToday(day) ? "text-primary" : "text-foreground")}>
                          {weekdayLabels[day.getDay()]}
                        </div>
                        {count ? (
                          <div className="rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            {count}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-sm font-semibold tabular-nums text-foreground">
                        {format(day, "d", { locale: ptBR })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : mode === "day" ? (
            <div className="rounded-md border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              Selecione uma data no calendário.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {yearMonths.map((monthDate) => {
                const monthDays = eachDayOfInterval({
                  start: startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 }),
                  end: endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 }),
                });

                return (
                  <div key={monthDate.toISOString()} className="rounded-md border border-border/60 bg-background p-2">
                    <div className="mb-2 text-xs font-semibold text-foreground">
                      {format(monthDate, "MMMM", { locale: ptBR })}
                    </div>
                    <div className="grid grid-cols-7 text-[10px] font-semibold text-muted-foreground">
                      {weekdayLabels.map((w) => (
                        <div key={w} className="text-center">
                          {w.slice(0, 1)}
                        </div>
                      ))}
                    </div>
                    {renderMonthGrid({ days: monthDays, compact: true })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border/60 bg-background p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-muted-foreground">{selectedKey ?? "Selecione uma data"}</div>
          <div className="text-xs text-muted-foreground">
            {selectedItems.length ? `${selectedItems.length} evento(s)` : "—"}
          </div>
        </div>
        {selectedItems.length ? (
          <div className="space-y-2">
            {selectedItems.map((item, index) => (
              <div key={index}>{renderItem(item)}</div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            {emptyState}
          </div>
        )}
      </div>
    </div>
  );
}
