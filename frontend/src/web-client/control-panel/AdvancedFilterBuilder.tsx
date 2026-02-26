"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Domain, DomainCombinator, DomainOperator } from "@/web-client/domain/types";
import type { SearchFieldDefinition, SearchViewDefinition } from "@/web-client/search/types";
import { cn } from "@/lib/utils";

type FilterRow = {
  id: string;
  field: string;
  operator: DomainOperator;
  value: string;
  valueTo?: string;
  negate?: boolean;
};

const DEFAULT_OPERATORS_BY_TYPE: Record<
  SearchFieldDefinition["type"],
  DomainOperator[]
> = {
  text: ["ilike", "contains", "=", "!="],
  uuid: ["=", "!="],
  number: ["=", "!=", ">", ">=", "<", "<=", "between"],
  date: ["between", ">=", "<=", "=", "!="],
  enum: ["=", "!=", "in"],
};

function createRow(field: SearchFieldDefinition): FilterRow {
  const operators = field.operators?.length
    ? field.operators
    : DEFAULT_OPERATORS_BY_TYPE[field.type];
  return {
    id: crypto.randomUUID(),
    field: field.name,
    operator: operators[0] ?? "=",
    value: "",
    valueTo: "",
    negate: false,
  };
}

function toDomain(
  combinator: DomainCombinator,
  rows: FilterRow[],
  fieldsByName: Map<string, SearchFieldDefinition>,
): Domain {
  const children = rows
    .map((row) => {
      const field = fieldsByName.get(row.field);
      if (!field) return null;
      const operator = row.operator;

      const normalize = (raw: string) => raw.trim();
      const value = normalize(row.value);
      const valueTo = normalize(row.valueTo ?? "");

      if (operator === "between") {
        if (!value && !valueTo) return null;
        const condition = {
          type: "condition",
          field: row.field,
          operator,
          value: [value || null, valueTo || null],
        } as const;
        return row.negate ? ({ type: "not", child: condition } as const) : condition;
      }

      if (operator === "in") {
        const parts = value
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
        if (!parts.length) return null;
        const condition = {
          type: "condition",
          field: row.field,
          operator,
          value: parts,
        } as const;
        return row.negate ? ({ type: "not", child: condition } as const) : condition;
      }

      if (!value) return null;
      const condition = {
        type: "condition",
        field: row.field,
        operator,
        value: field.type === "number" ? Number(value) : value,
      } as const;
      return row.negate ? ({ type: "not", child: condition } as const) : condition;
    })
    .filter(Boolean) as NonNullable<Domain>[];

  if (!children.length) return null;
  if (children.length === 1) return children[0];
  return { type: "group", combinator, children };
}

function fromDomain(domain: Domain): { combinator: DomainCombinator; rows: FilterRow[] } {
  if (!domain) return { combinator: "and", rows: [] };
  if (domain.type === "group") {
    return {
      combinator: domain.combinator,
      rows: domain.children
        .map((node) => {
          const negate = node.type === "not";
          const child = negate ? node.child : node;
          if (child.type !== "condition") return null;

          const value = child.value;
          const row: FilterRow = {
            id: crypto.randomUUID(),
            field: child.field,
            operator: child.operator,
            value: "",
            valueTo: "",
            negate,
          };
          if (child.operator === "between" && Array.isArray(value)) {
            row.value = value[0] === null || value[0] === undefined ? "" : String(value[0]);
            row.valueTo = value[1] === null || value[1] === undefined ? "" : String(value[1]);
            return row;
          }
          if (child.operator === "in" && Array.isArray(value)) {
            row.value = value.map((v) => String(v)).join(", ");
            return row;
          }
          row.value = value === null || value === undefined ? "" : String(value);
          return row;
        })
        .filter(Boolean) as FilterRow[],
    };
  }

  if (domain.type === "condition") {
    return {
      combinator: "and",
      rows: [
        {
          id: crypto.randomUUID(),
          field: domain.field,
          operator: domain.operator,
          value:
            domain.value === null || domain.value === undefined
              ? ""
              : String(domain.value),
          valueTo: "",
          negate: false,
        },
      ],
    };
  }

  return { combinator: "and", rows: [] };
}

function renderValueInput({
  field,
  row,
  onChange,
}: {
  field: SearchFieldDefinition;
  row: FilterRow;
  onChange: (next: Partial<FilterRow>) => void;
}) {
  if (row.operator === "is_null" || row.operator === "not_null") {
    return <div className="text-xs text-muted-foreground">Sem valor</div>;
  }

  if (field.type === "enum" && field.options?.length && row.operator !== "in") {
    return (
      <Select
        value={row.value}
        onValueChange={(value) => onChange({ value })}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (row.operator === "between") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Input
          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
          value={row.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="De"
        />
        <Input
          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
          value={row.valueTo ?? ""}
          onChange={(e) => onChange({ valueTo: e.target.value })}
          placeholder="AtÃ©"
        />
      </div>
    );
  }

  return (
    <Input
      type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
      value={row.value}
      onChange={(e) => onChange({ value: e.target.value })}
      placeholder={row.operator === "in" ? "val1, val2, val3" : "Valor..."}
    />
  );
}

export function AdvancedFilterBuilder({
  searchView,
  value,
  onChange,
  className,
}: {
  searchView: SearchViewDefinition;
  value: Domain;
  onChange: (next: Domain) => void;
  className?: string;
}) {
  const fieldsByName = React.useMemo(() => {
    const map = new Map<string, SearchFieldDefinition>();
    searchView.fields.forEach((field) => map.set(field.name, field));
    return map;
  }, [searchView.fields]);

  const [combinator, setCombinator] = React.useState<DomainCombinator>("and");
  const [rows, setRows] = React.useState<FilterRow[]>([]);

  React.useEffect(() => {
    const parsed = fromDomain(value);
    setCombinator(parsed.combinator);
    setRows(parsed.rows);
  }, [value]);

  const update = React.useCallback(
    (nextRows: FilterRow[], nextCombinator: DomainCombinator = combinator) => {
      setRows(nextRows);
      setCombinator(nextCombinator);
      onChange(toDomain(nextCombinator, nextRows, fieldsByName));
    },
    [combinator, fieldsByName, onChange],
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            CombinaÃ§Ã£o
          </Label>
          <Select
            value={combinator}
            onValueChange={(next) => update(rows, next as DomainCombinator)}
          >
            <SelectTrigger className="h-9 w-[10rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">Todas (AND)</SelectItem>
              <SelectItem value="or">Qualquer (OR)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const first = searchView.fields[0];
            if (!first) return;
            update([...rows, createRow(first)]);
          }}
        >
          Adicionar filtro
        </Button>
      </div>

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row, index) => {
            const field =
              fieldsByName.get(row.field) ?? searchView.fields[0] ?? null;
            if (!field) return null;

            const operators = field.operators?.length
              ? field.operators
              : DEFAULT_OPERATORS_BY_TYPE[field.type];

            return (
              <div
                key={row.id}
                className="rounded-md border border-border/60 bg-background p-3"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[12rem_10rem_1fr_6rem_auto] sm:items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Campo</Label>
                    <Select
                      value={row.field}
                      onValueChange={(nextField) => {
                        const nextDef = fieldsByName.get(nextField) ?? field;
                        const nextRow = createRow(nextDef);
                        update(
                          rows.map((r, i) => (i === index ? { ...nextRow, id: r.id } : r)),
                        );
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {searchView.fields.map((f) => (
                          <SelectItem key={f.name} value={f.name}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Operador</Label>
                    <Select
                      value={row.operator}
                      onValueChange={(operator) => {
                        update(
                          rows.map((r, i) =>
                            i === index ? { ...r, operator: operator as DomainOperator } : r,
                          ),
                        );
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op} value={op}>
                            {op}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Valor</Label>
                    {renderValueInput({
                      field,
                      row,
                      onChange: (partial) => {
                        update(
                          rows.map((r, i) => (i === index ? { ...r, ...partial } : r)),
                        );
                      },
                    })}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">NOT</Label>
                    <div className="flex h-9 items-center gap-2 rounded-md border border-border/60 px-2">
                      <Checkbox
                        checked={Boolean(row.negate)}
                        onCheckedChange={(checked) =>
                          update(
                            rows.map((r, i) =>
                              i === index ? { ...r, negate: Boolean(checked) } : r,
                            ),
                          )
                        }
                      />
                      <span className="text-xs text-muted-foreground">Negar</span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => update(rows.filter((_, i) => i !== index))}
                      className="text-destructive"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
          Nenhum filtro avanÃ§ado aplicado.
        </div>
      )}
    </div>
  );
}
