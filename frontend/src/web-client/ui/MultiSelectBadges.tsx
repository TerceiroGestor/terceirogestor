"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MultiSelectBadgesOption = {
  value: string;
  label: string;
  description?: string | null;
};

type MultiSelectBadgesProps = {
  options: MultiSelectBadgesOption[];
  selectedValues: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /** Texto do botão que abre o seletor de busca. */
  addLabel?: string;
  searchPlaceholder?: string;
  /** Mostrado quando não há nenhuma opção disponível (lista vazia). */
  noOptionsLabel?: string;
  /** Mostrado quando a busca não encontra nada entre as opções restantes. */
  noMatchLabel?: string;
  /** Mostrado abaixo do seletor quando nada está selecionado ainda. */
  emptyLabel?: string;
  className?: string;
};

/**
 * Seletor reutilizável: busca contra uma lista de opções e cada item
 * escolhido vira um badge removível diretamente (sem precisar reabrir o
 * popover). Pensado para substituir listas de checkbox em formulários
 * (ex.: Grupos de uma Atividade/Encontro) por algo mais
 * compacto e menos "poluído" visualmente.
 */
export function MultiSelectBadges({
  options,
  selectedValues,
  onChange,
  disabled = false,
  addLabel = "Adicionar",
  searchPlaceholder = "Pesquisar...",
  noOptionsLabel = "Nenhuma opção disponível.",
  noMatchLabel = "Nada encontrado.",
  emptyLabel = "Nada selecionado ainda.",
  className,
}: MultiSelectBadgesProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selectedSet = React.useMemo(() => new Set(selectedValues), [selectedValues]);
  const selectedOptions = React.useMemo(
    () => options.filter((option) => selectedSet.has(option.value)),
    [options, selectedSet],
  );
  const availableOptions = React.useMemo(
    () => options.filter((option) => !selectedSet.has(option.value)),
    [options, selectedSet],
  );
  const filteredOptions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableOptions;
    return availableOptions.filter((option) =>
      `${option.label} ${option.description ?? ""}`.toLowerCase().includes(q),
    );
  }, [availableOptions, query]);

  const handleAdd = (value: string) => {
    onChange([...selectedValues, value]);
  };

  const handleRemove = (value: string) => {
    onChange(selectedValues.filter((entry) => entry !== value));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedOptions.map((option) => (
          <Badge
            key={option.value}
            variant="secondary"
            className="gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs"
          >
            {option.label}
            {!disabled ? (
              <button
                type="button"
                className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-background/60 hover:text-foreground"
                aria-label={`Remover ${option.label}`}
                onClick={() => handleRemove(option.value)}
              >
                <X className="size-3" />
              </button>
            ) : null}
          </Badge>
        ))}

        {!disabled ? (
          <Popover
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) setQuery("");
            }}
          >
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1 rounded-full px-2.5 text-xs">
                <Plus className="size-3.5" />
                {addLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[20rem] p-2">
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 text-sm"
              />
              <div className="mt-2 flex max-h-[220px] flex-col gap-0.5 overflow-y-auto">
                {options.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">{noOptionsLabel}</p>
                ) : filteredOptions.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">{noMatchLabel}</p>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="flex flex-col items-start rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        handleAdd(option.value);
                        setQuery("");
                      }}
                    >
                      <span className="text-foreground">{option.label}</span>
                      {option.description?.trim() ? (
                        <span className="text-[11px] text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      {selectedOptions.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      ) : null}
    </div>
  );
}
