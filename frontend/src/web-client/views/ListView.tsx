"use client";

import * as React from "react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import type {
  Column,
  ColumnDef,
  ColumnPinningState,
  Row,
  RowSelectionState,
  SortingState,
  Table as TanstackTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Columns3,
  MoreHorizontal,
  PinIcon,
  PinOff,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ModuleEmptyState,
  ModuleSurface,
} from "@/web-client/ui/ModulePrimitives";

const COLUMN_VISIBILITY_STORAGE_PREFIX = "listview.columnVisibility.";

export function readStoredColumnVisibility(storageKey?: string): VisibilityState | null {
  if (!storageKey || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${COLUMN_VISIBILITY_STORAGE_PREFIX}${storageKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as VisibilityState) : null;
  } catch {
    return null;
  }
}

export function writeStoredColumnVisibility(storageKey: string, visibility: VisibilityState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${COLUMN_VISIBILITY_STORAGE_PREFIX}${storageKey}`,
      JSON.stringify(visibility),
    );
  } catch {
    // Armazenamento indisponivel (modo privado, cota excedida) - preferencia
    // simplesmente nao persiste, sem quebrar a lista.
  }
}

type ColumnVisibilityContextValue = {
  // Tipo de linha não importa aqui - só id/header/enableHiding dos ColumnDef.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<any, unknown>[];
  visibility: VisibilityState;
  setVisibility: (next: VisibilityState) => void;
};

const ColumnVisibilityContext = React.createContext<ColumnVisibilityContextValue | null>(null);

function useColumnVisibilityContext() {
  return React.useContext(ColumnVisibilityContext);
}

/**
 * Padrão reutilizável pra qualquer módulo: envolva a tela (normalmente dentro
 * do próprio `EntityModuleShell`, ver `RecordListHost.tsx`) com este provider
 * passando `columns` e uma `storageKey` estável (ex.: `moduleDefinition.moduleId`).
 * Isso já é suficiente pra: (1) o `ListView` dentro do provider detectar o
 * estado automaticamente - nenhuma prop extra precisa ser passada pra ele - e
 * (2), quando `visibility`/`onVisibilityChange` forem passados (controlado),
 * manter esse mesmo estado em sincronia com um botão "Colunas" renderizado
 * fora da árvore deste provider (ex.: via `PageControlPanel`/`ControlPanelShell`,
 * que relocaliza `searchSlot` para outro ponto da página - um Context.Provider
 * local não alcança esse ponto, então o botão ali precisa receber as props
 * explicitamente; ver `RecordListHost.tsx`). Sem controle externo, mantém
 * estado próprio (comportamento anterior). Sem o provider, `ListView` continua
 * funcionando como antes (estado próprio, botão dentro da própria lista).
 */
export function ColumnVisibilityProvider({
  storageKey,
  columns,
  visibility: controlledVisibility,
  onVisibilityChange: controlledOnVisibilityChange,
  children,
}: {
  storageKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<any, unknown>[];
  visibility?: VisibilityState;
  onVisibilityChange?: (next: VisibilityState) => void;
  children: React.ReactNode;
}) {
  const [internalVisibility, setInternalVisibility] = React.useState<VisibilityState>(
    () => readStoredColumnVisibility(storageKey) ?? {},
  );
  const visibility = controlledVisibility ?? internalVisibility;
  const setVisibility = controlledOnVisibilityChange ?? setInternalVisibility;

  React.useEffect(() => {
    if (controlledVisibility) return;
    writeStoredColumnVisibility(storageKey, visibility);
  }, [controlledVisibility, storageKey, visibility]);

  const value = React.useMemo(
    () => ({ columns, visibility, setVisibility }),
    [columns, visibility, setVisibility],
  );

  return (
    <ColumnVisibilityContext.Provider value={value}>
      {children}
    </ColumnVisibilityContext.Provider>
  );
}

type ColumnVisibilityOption = { id: string; label: string };

function resolveColumnDefId<TData>(columnDef: ColumnDef<TData, unknown>): string | undefined {
  if (columnDef.id) return columnDef.id;
  const accessorKey = (columnDef as { accessorKey?: unknown }).accessorKey;
  return typeof accessorKey === "string" ? accessorKey : undefined;
}

function resolveColumnDefLabel<TData>(columnDef: ColumnDef<TData, unknown>, id: string) {
  const header = columnDef.header;
  if (typeof header === "string" && header.trim()) return header;
  return id;
}

/**
 * Ao contrário da versão anterior (que lia direto de `table.getAllLeafColumns()`),
 * este menu só depende de `columns`/`visibility`/`onVisibilityChange` - dá pra
 * renderizar em qualquer lugar (ex.: dentro da barra de busca, perto do botão de
 * filtro), não só dentro do `ListView`. A seleção usa `Checkbox` como indicador
 * puramente visual (pointer-events-none) com o clique tratado na linha inteira,
 * evitando depender do `onCheckedChange`/`onSelect` do Radix `CheckboxItem`
 * (era onde o estado não propagava de forma confiável).
 */
export function ColumnVisibilityMenu<TData>({
  columns: columnsProp,
  visibility: visibilityProp,
  onVisibilityChange: onVisibilityChangeProp,
  triggerLabel = "Colunas",
  showTriggerLabel = true,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
}: {
  /** Opcional: sem isso, lê do `ColumnVisibilityProvider` mais próximo. */
  columns?: ColumnDef<TData, unknown>[];
  visibility?: VisibilityState;
  onVisibilityChange?: (next: VisibilityState) => void;
  triggerLabel?: string;
  /** Quando false, mostra só o ícone - mesmo padrão do botão de filtro. */
  showTriggerLabel?: boolean;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
  triggerClassName?: string;
}) {
  const context = useColumnVisibilityContext();
  const contextColumns = context?.columns;
  const visibility = visibilityProp ?? context?.visibility ?? {};
  const onVisibilityChange = onVisibilityChangeProp ?? context?.setVisibility;

  const options = React.useMemo<ColumnVisibilityOption[]>(() => {
    const columns = (columnsProp ?? contextColumns ?? []) as ColumnDef<TData, unknown>[];
    return columns
      .map((columnDef) => {
        if (columnDef.enableHiding === false) return null;
        const id = resolveColumnDefId(columnDef);
        if (!id || id === "__select__") return null;
        return { id, label: resolveColumnDefLabel(columnDef, id) };
      })
      .filter((option): option is ColumnVisibilityOption => Boolean(option));
  }, [columnsProp, contextColumns]);

  if (!options.length || !onVisibilityChange) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className={cn(showTriggerLabel ? "gap-1.5" : undefined, triggerClassName)}
          title={triggerLabel}
          aria-label={triggerLabel}
        >
          <Columns3 className="size-4" />
          {showTriggerLabel ? triggerLabel : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
        <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Colunas visiveis
        </div>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const isVisible = visibility[option.id] !== false;
          return (
            <div
              key={option.id}
              role="menuitemcheckbox"
              aria-checked={isVisible}
              tabIndex={0}
              onClick={() =>
                onVisibilityChange({ ...visibility, [option.id]: !isVisible })
              }
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onVisibilityChange({ ...visibility, [option.id]: !isVisible });
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent focus:bg-accent"
            >
              <Checkbox
                checked={isVisible}
                tabIndex={-1}
                className="pointer-events-none"
              />
              <span className="truncate">{option.label}</span>
            </div>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onVisibilityChange({})}>
          Mostrar todas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function shouldIgnoreRowClick(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      '[data-row-click-ignore="true"],button,a,input,textarea,select,[role="button"],[role="dialog"]',
    ),
  );
}

type GroupNode<TData> = {
  key: string;
  field: string;
  value: unknown;
  label: string;
  count: number;
  depth: number;
  children: GroupNode<TData>[] | null;
  rows: Row<TData>[] | null;
};

function defaultGroupLabel(_field: string, value: unknown) {
  const label = String(value ?? "").trim();
  return label ? label : "Sem valor";
}

function resolveGroupValues(value: unknown) {
  if (!Array.isArray(value)) {
    return [value];
  }

  const normalized = Array.from(
    new Map(
      value.map((entry) => {
        const nextValue =
          typeof entry === "string"
            ? entry.trim().replace(/\s+/g, " ")
            : entry;
        return [String(nextValue ?? "").trim(), nextValue];
      }),
    ).values(),
  ).filter((entry) => {
    if (entry === null || entry === undefined) return false;
    if (typeof entry === "string") return entry.length > 0;
    return true;
  });

  return normalized.length ? normalized : [null];
}

function buildGroupNodes<TData>({
  rows,
  fields,
  depth,
  parentKey,
  resolveGroupLabel,
}: {
  rows: Row<TData>[];
  fields: string[];
  depth: number;
  parentKey: string;
  resolveGroupLabel: (field: string, value: unknown) => string;
}): GroupNode<TData>[] {
  if (!fields.length) return [];

  const field = fields[0]!;
  const map = new Map<string, { key: string; value: unknown; label: string; rows: Row<TData>[] }>();

  rows.forEach((row) => {
    const raw = row.original as Record<string, unknown>;
    const values = resolveGroupValues(raw[field]);

    values.forEach((value) => {
      const label = resolveGroupLabel(field, value);
      const rawKey = `${field}:${String(value ?? "").trim()}`;
      const key = parentKey ? `${parentKey}|${rawKey}` : rawKey;

      const current = map.get(key) ?? { key, value, label, rows: [] as Row<TData>[] };
      current.rows.push(row);
      map.set(key, current);
    });
  });

  const nextFields = fields.slice(1);
  return Array.from(map.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((group) => {
      const children =
        nextFields.length > 0
          ? buildGroupNodes<TData>({
              rows: group.rows,
              fields: nextFields,
              depth: depth + 1,
              parentKey: group.key,
              resolveGroupLabel,
            })
          : null;

      return {
        key: group.key,
        field,
        value: group.value,
        label: group.label,
        count: group.rows.length,
        depth,
        children,
        rows: nextFields.length ? null : group.rows,
      };
    });
}

function getPinnedStyles<TData>(
  column: Column<TData, unknown>,
  table: TanstackTable<TData>,
) {
  const pinningState = table.getState().columnPinning;
  const pinnedFromState: false | "left" | "right" =
    pinningState.left?.includes(column.id)
      ? "left"
      : pinningState.right?.includes(column.id)
        ? "right"
        : false;

  const pinnedFromApi =
    typeof column.getIsPinned === "function"
      ? (column.getIsPinned() as false | "left" | "right")
      : false;

  const pinned = pinnedFromState || pinnedFromApi;
  if (!pinned) return undefined;

  if (pinned === "left") {
    const size = column.getSize();
    const leftColumns = table.getLeftLeafColumns();
    let offset = 0;
    for (const col of leftColumns) {
      if (col.id === column.id) break;
      offset += col.getSize();
    }
    return {
      position: "sticky" as const,
      left: offset,
      zIndex: 2,
      background: "var(--color-background)",
      width: size,
      minWidth: size,
      maxWidth: size,
    };
  }

  if (pinned === "right") {
    const size = column.getSize();
    const rightColumns = table.getRightLeafColumns();
    let offset = 0;
    for (const col of rightColumns) {
      if (col.id === column.id) break;
      offset += col.getSize();
    }
    return {
      position: "sticky" as const,
      right: offset,
      zIndex: 2,
      background: "var(--color-background)",
      width: size,
      minWidth: size,
      maxWidth: size,
    };
  }

  return undefined;
}

function ColumnMenu<TData>({
  column,
  table,
}: {
  column: Column<TData, unknown>;
  table: TanstackTable<TData>;
}) {
  const canSort = column.getCanSort?.() ?? false;
  const pinningState = table.getState().columnPinning;
  const pinnedFromState: false | "left" | "right" =
    pinningState.left?.includes(column.id)
      ? "left"
      : pinningState.right?.includes(column.id)
        ? "right"
        : false;
  const pinnedFromApi =
    typeof column.getIsPinned === "function"
      ? (column.getIsPinned() as false | "left" | "right")
      : false;
  const isPinned = pinnedFromState || pinnedFromApi;
  const contentKey = `${column.id}:${String(isPinned)}`;

  const pinLeft = () => table.setColumnPinning((prev: ColumnPinningState) => {
    const left = (prev.left ?? []).filter((id) => id !== column.id);
    const right = (prev.right ?? []).filter((id) => id !== column.id);
    return { left: [...left, column.id], right };
  });

  const pinRight = () => table.setColumnPinning((prev: ColumnPinningState) => {
    const left = (prev.left ?? []).filter((id) => id !== column.id);
    const right = (prev.right ?? []).filter((id) => id !== column.id);
    return { left, right: [...right, column.id] };
  });

  const unpin = () => table.setColumnPinning((prev: ColumnPinningState) => ({
    left: (prev.left ?? []).filter((id) => id !== column.id),
    right: (prev.right ?? []).filter((id) => id !== column.id),
  }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-60 hover:opacity-100"
          title="Opções da coluna"
          aria-label="Opções da coluna"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent key={contentKey} align="end">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)} disabled={!canSort}>
          Ordenar A–Z
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)} disabled={!canSort}>
          Ordenar Z–A
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.clearSorting?.()} disabled={!canSort}>
          Limpar ordenação
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={pinLeft}>
          <PinIcon className="mr-2 size-4" />
          Fixar à esquerda
        </DropdownMenuItem>
        <DropdownMenuItem onClick={pinRight}>
          <PinIcon className="mr-2 size-4" />
          Fixar à direita
        </DropdownMenuItem>
        <DropdownMenuItem onClick={unpin} disabled={!isPinned}>
          <PinOff className="mr-2 size-4" />
          Soltar coluna
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ListView<TData>({
  data,
  columns,
  enableRowSelection = false,
  renderCard,
  bulkActions,
  onSelectionChange,
  onRowClick,
  className,
  getRowId,
  groupByFields,
  resolveGroupLabel = defaultGroupLabel,
  enableColumnTools = true,
  showColumnVisibilityButton = true,
  initialColumnPinning,
  storageKey,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
}: {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableRowSelection?: boolean;
  renderCard?: (row: TData) => React.ReactNode;
  bulkActions?: (selection: TData[]) => React.ReactNode;
  onSelectionChange?: (rows: TData[]) => void;
  onRowClick?: (row: TData) => void;
  className?: string;
  getRowId?: (row: TData, index: number) => string;
  groupByFields?: string[] | null;
  resolveGroupLabel?: (field: string, groupValue: unknown) => string;
  enableColumnTools?: boolean;
  /**
   * Mostra o botão "Colunas" dentro da própria lista. Desative quando o
   * módulo preferir renderizar o `ColumnVisibilityMenu` em outro lugar
   * (ex.: na barra de busca, perto do filtro) usando `columnVisibility`/
   * `onColumnVisibilityChange` controlados.
   */
  showColumnVisibilityButton?: boolean;
  initialColumnPinning?: ColumnPinningState;
  /**
   * Chave estavel para lembrar, por usuario/navegador, quais colunas ficam
   * visiveis nesta lista (ex.: "people.list"). Sem isso, o controle de
   * colunas funciona normalmente, só nao sobrevive a um reload. Ignorado
   * quando `columnVisibility` é controlado de fora.
   */
  storageKey?: string;
  /** Estado controlado de visibilidade - quando informado, substitui o estado interno. */
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (next: VisibilityState) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    () => initialColumnPinning ?? {},
  );
  // Detecta um `ColumnVisibilityProvider` ancestral (ver RecordListHost.tsx) -
  // é o padrão reutilizável: o módulo só envolve a tela com o provider e
  // tanto o botão "Colunas" quanto este `ListView` já ficam sincronizados,
  // sem nenhuma prop extra. Prioridade: prop controlada explícita > provider
  // > estado interno (comportamento de sempre, pra quem não usa nenhum dos dois).
  const visibilityContext = useColumnVisibilityContext();
  const [internalColumnVisibility, setInternalColumnVisibility] =
    React.useState<VisibilityState>(() => readStoredColumnVisibility(storageKey) ?? {});
  const columnVisibility =
    controlledColumnVisibility ?? visibilityContext?.visibility ?? internalColumnVisibility;

  // `useReactTable` pode chamar isso com um valor direto ou um updater
  // (old) => next - normaliza os dois formatos antes de repassar pro
  // callback externo/provider (que só aceitam o valor já resolvido) ou pro
  // estado interno (que aceita os dois).
  const setColumnVisibility = React.useCallback(
    (updaterOrValue: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
      const next =
        typeof updaterOrValue === "function"
          ? (updaterOrValue as (old: VisibilityState) => VisibilityState)(columnVisibility)
          : updaterOrValue;
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange(next);
      } else if (visibilityContext) {
        visibilityContext.setVisibility(next);
      } else {
        setInternalColumnVisibility(next);
      }
    },
    [columnVisibility, onColumnVisibilityChange, visibilityContext],
  );

  React.useEffect(() => {
    if (!storageKey || controlledColumnVisibility || visibilityContext) return;
    writeStoredColumnVisibility(storageKey, columnVisibility);
  }, [columnVisibility, controlledColumnVisibility, storageKey, visibilityContext]);

  const selectionColumn = React.useMemo<ColumnDef<TData, unknown> | null>(() => {
    if (!enableRowSelection) return null;
    return {
      id: "__select__",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
            aria-label="Selecionar todos"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
            aria-label="Selecionar linha"
          />
        </div>
      ),
      size: 32,
    };
  }, [enableRowSelection]);

  const effectiveColumns = React.useMemo(
    () => (selectionColumn ? [selectionColumn, ...columns] : columns),
    [columns, selectionColumn],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: effectiveColumns,
    state: { sorting, rowSelection, columnPinning, columnVisibility },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnPinningChange: setColumnPinning,
    onColumnVisibilityChange: setColumnVisibility,
    enableColumnPinning: true,
    enableRowSelection,
    getRowId: getRowId
      ? (originalRow: TData, index: number) => getRowId(originalRow, index)
      : undefined,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);

  React.useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedRows);
  }, [onSelectionChange, selectedRows]);

  const groupFields = React.useMemo(
    () => groupByFields?.filter(Boolean) ?? [],
    [groupByFields],
  );

  const grouped = React.useMemo(() => {
    if (!groupFields.length) return null;
    const rows = table.getRowModel().rows;
    return buildGroupNodes<TData>({
      rows,
      fields: groupFields,
      depth: 0,
      parentKey: "",
      resolveGroupLabel,
    });
  }, [groupFields, resolveGroupLabel, table]);

  const [openByKey, setOpenByKey] = React.useState<Record<string, boolean>>({});
  const isOpen = React.useCallback((key: string) => openByKey[key] ?? true, [openByKey]);
  const toggle = React.useCallback((key: string) => {
    setOpenByKey((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  }, []);

  const visibleColumnsCount = table.getVisibleLeafColumns().length;
  // Dentro de um ColumnVisibilityProvider, quem mostra o botão "Colunas" é o
  // shell (ver RecordListHost.tsx) - a lista nunca duplica o controle.
  const shouldShowColumnVisibilityButton = showColumnVisibilityButton && !visibilityContext;

  return (
    <ModuleSurface className={cn("flex h-full min-h-0 flex-col", className)}>
      {shouldShowColumnVisibilityButton || (enableRowSelection && bulkActions && selectedRows.length) ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/10 px-4 py-2 text-xs">
          <div className="text-muted-foreground">
            {enableRowSelection && bulkActions && selectedRows.length ? (
              <>
                Selecionados:{" "}
                <span className="font-mono tabular-nums text-foreground">
                  {selectedRows.length}
                </span>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {enableRowSelection && bulkActions && selectedRows.length
              ? bulkActions(selectedRows)
              : null}
            {shouldShowColumnVisibilityButton ? (
              <ColumnVisibilityMenu
                columns={columns}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {renderCard ? (
        <div className="grid gap-3 p-4 md:hidden">
          {grouped ? (
            <div className="space-y-2">
              {(() => {
                const renderGroupCards = (node: GroupNode<TData>) => {
                  const open = isOpen(node.key);
                  const hasChildren = Boolean(node.children?.length);
                  const hasRows = Boolean(node.rows?.length);

                  return (
                    <div key={node.key} className="space-y-2">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-sm px-1 py-1 text-left hover:bg-muted/20"
                        onClick={() => toggle(node.key)}
                        style={{ paddingLeft: 4 + node.depth * 14 }}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <ChevronRight
                            className={cn(
                              "size-4 shrink-0 text-muted-foreground transition-transform",
                              open ? "rotate-90" : undefined,
                            )}
                          />
                          <div className="min-w-0 truncate text-xs font-semibold text-foreground">
                            {node.label}
                          </div>
                        </div>
                        <div className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-foreground">
                          {node.count}
                        </div>
                      </button>

                      {open ? (
                        hasChildren ? (
                          <div className="space-y-2">{node.children!.map(renderGroupCards)}</div>
                        ) : hasRows ? (
                          <div className="grid gap-2">
                            {node.rows!.map((r) => (
                              <div key={r.id}>{renderCard(r.original)}</div>
                            ))}
                          </div>
                        ) : null
                      ) : null}
                    </div>
                  );
                };

                return grouped.map(renderGroupCards);
              })()}
            </div>
          ) : data.length ? (
            data.map((row, index) => (
              <div key={getRowId?.(row, index) ?? String(index)}>{renderCard(row)}</div>
            ))
          ) : (
            <ModuleEmptyState title="Sem registros" description="Nenhum registro." compact />
          )}
        </div>
      ) : null}

      <div className={cn("min-h-0 flex-1 overflow-auto", renderCard ? "hidden md:block" : undefined)}>
        <UiTable className="[&_tbody_tr:last-child]:border-b-0 [&_tbody_td]:h-12 [&_tbody_td]:py-3 [&_tbody_td]:text-[13px] [&_thead_th]:h-11 [&_thead_th]:border-b [&_thead_th]:border-border/50 [&_thead_th]:bg-muted/10 [&_thead_th]:text-[11px] [&_thead_th]:font-medium [&_thead_th]:uppercase [&_thead_th]:tracking-[0.16em]">
          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sort = header.column.getIsSorted();
                  const pinnedStyles = getPinnedStyles(header.column, table);
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(canSort ? "cursor-pointer select-none" : undefined)}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={pinnedStyles}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {sort === "asc" ? (
                          <ChevronUp className="size-3.5 text-muted-foreground" />
                        ) : sort === "desc" ? (
                          <ChevronDown className="size-3.5 text-muted-foreground" />
                        ) : null}
                        {enableColumnTools && header.column.id !== "__select__" ? (
                          <span
                            className="ml-auto"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <ColumnMenu column={header.column} table={table} />
                          </span>
                        ) : null}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {grouped ? (
              (() => {
                const renderNode = (node: GroupNode<TData>) => {
                  const open = isOpen(node.key);
                  const hasChildren = Boolean(node.children?.length);
                  const hasRows = Boolean(node.rows?.length);

                  return (
                    <React.Fragment key={node.key}>
                      <TableRow className="bg-muted/10">
                        <TableCell colSpan={visibleColumnsCount}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-sm px-1 py-1 text-left hover:bg-muted/20"
                            onClick={() => toggle(node.key)}
                            style={{ paddingLeft: 4 + node.depth * 14 }}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <ChevronRight
                                className={cn(
                                  "size-4 shrink-0 text-muted-foreground transition-transform",
                                  open ? "rotate-90" : undefined,
                                )}
                              />
                              <div className="min-w-0 truncate text-xs font-semibold text-foreground">
                                {node.label}
                              </div>
                            </div>
                            <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                              {node.count}
                            </div>
                          </button>
                        </TableCell>
                      </TableRow>

                      {open ? (
                        hasChildren ? (
                          node.children!.map(renderNode)
                        ) : hasRows ? (
                          node.rows!.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() ? "selected" : undefined}
                              className={cn(onRowClick ? "cursor-pointer" : undefined)}
                              onClick={(event) => {
                                if (shouldIgnoreRowClick(event.target)) return;
                                onRowClick?.(row.original);
                              }}
                            >
                              {row.getVisibleCells().map((cell) => {
                                const pinnedStyles = getPinnedStyles(cell.column, table);
                                return (
                                  <TableCell key={cell.id} style={pinnedStyles}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))
                        ) : null
                      ) : null}
                    </React.Fragment>
                  );
                };

                return grouped.map(renderNode);
              })()
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(onRowClick ? "cursor-pointer" : undefined)}
                  onClick={(event) => {
                    if (shouldIgnoreRowClick(event.target)) return;
                    onRowClick?.(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const pinnedStyles = getPinnedStyles(cell.column, table);
                    return (
                      <TableCell key={cell.id} style={pinnedStyles}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={effectiveColumns.length}
                  className="py-10"
                >
                  <ModuleEmptyState
                    title="Sem registros"
                    description="Nenhum registro."
                    compact
                    className="py-6"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UiTable>
      </div>
    </ModuleSurface>
  );
}

