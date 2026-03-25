"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionDialog } from "@/components/section-dialog";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { SearchPanelMenu } from "@/web-client/control-panel/SearchPanelMenu";
import { collectAndConditions, removeConditionAtIndex } from "@/web-client/domain/conditions";
import type { Domain, DomainValue } from "@/web-client/domain/types";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import {
  listEligibleProjectActionPeople,
  type ActionPeopleParticipationRole,
} from "@/modules/actions/api";
import { type ApiProjectEnrollment } from "@/modules/projects/api";
import {
  ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS,
  ACTION_PEOPLE_PARTICIPATION_ROLE_OPTIONS,
} from "@/modules/actions/shared/domain/actions.constants";
import { PROJECT_PARTICIPATION_ROLE_LABELS } from "@/modules/projects/shared/domain/projects.constants";
import { peopleSearchView } from "@/web-client/registry/searchViews/people";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { TableView } from "@/web-client/views/TableView";
import type { AdvancedFilter } from "@/components/DataTable/DataTableFilterSheetFilters";

function toFilterValue(value: DomainValue | undefined) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map((item) => String(item ?? "")).join(",");
  return String(value);
}

function mapDomainOperatorToAdvancedFilter(
  operator: string,
): AdvancedFilter["operator"] | null {
  switch (operator) {
    case "=":
      return "equals";
    case "contains":
    case "ilike":
      return "contains";
    case "in":
      return "in";
    case "not_in":
      return "notIn";
    case "is_null":
      return "isEmpty";
    case "not_null":
      return "isNotEmpty";
    case "between":
      return "between";
    case ">":
      return "gt";
    case ">=":
      return "gte";
    case "<":
      return "lt";
    case "<=":
      return "lte";
    case "starts_with":
      return "starts";
    case "ends_with":
      return "ends";
    default:
      return null;
  }
}

function serializePeopleDomain(domain: Domain | null | undefined) {
  const conditions = collectAndConditions(domain ?? null) ?? [];

  const filters = conditions
    .map<AdvancedFilter | null>((condition) => {
      const operator = mapDomainOperatorToAdvancedFilter(condition.operator);
      if (!operator) return null;
      const value =
        operator === "between" && Array.isArray(condition.value)
          ? condition.value.map((item) => String(item ?? "")).join("..")
          : toFilterValue(condition.value);
      return { columnId: condition.field, operator, value };
    })
    .filter(Boolean) as AdvancedFilter[];

  return filters.length ? JSON.stringify(filters) : undefined;
}

type ActionPeopleParticipationPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  projectId: string;
  actionId: string;
  onPick: (params: {
    enrollment: ApiProjectEnrollment;
    role: ActionPeopleParticipationRole;
  }) => void;
};

export function ActionPeopleParticipationPickerDialog({
  open,
  onOpenChange,
  token,
  projectId,
  actionId,
  onPick,
}: ActionPeopleParticipationPickerDialogProps) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const [rows, setRows] = React.useState<ApiProjectEnrollment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);
  const [groupBy, setGroupBy] = React.useState<string[]>([]);
  const [role, setRole] = React.useState<ActionPeopleParticipationRole>("FACILITADOR");
  const [selectedRows, setSelectedRows] = React.useState<ApiProjectEnrollment[]>([]);
  const [saving, setSaving] = React.useState(false);

  const columns = React.useMemo<ColumnDef<ApiProjectEnrollment>[]>(
    () => [
      {
        id: "select",
        header: () => {
          const pageSelected =
            rows.length > 0 &&
            rows.every((enrollment) =>
              selectedRows.some((selected) => selected.id === enrollment.id),
            );
          return (
            <Checkbox
              checked={pageSelected}
              onCheckedChange={(next) => {
                setSelectedRows((previous) =>
                  next
                    ? Array.from(new Map([...previous, ...rows].map((item) => [item.id, item])).values())
                    : previous.filter((item) => !rows.some((row) => row.id === item.id)),
                );
              }}
              aria-label="Selecionar pessoas da página"
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            checked={selectedRows.some((item) => item.id === row.original.id)}
            onCheckedChange={(next) => {
              setSelectedRows((previous) =>
                next
                  ? Array.from(new Map([...previous, row.original].map((item) => [item.id, item])).values())
                  : previous.filter((item) => item.id !== row.original.id),
              );
            }}
            aria-label={`Selecionar ${row.original.person.fullName}`}
          />
        ),
      },
      {
        id: "person",
        header: "Pessoa",
        accessorFn: (row) => row.person.fullName,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonIdentityAvatarTrigger
              personId={row.original.person.id}
              tenantSlug={tenantSlug}
              fullName={row.original.person.fullName}
              birthDate={row.original.person.birthDate ?? null}
              avatarUrl={row.original.person.avatarUrl}
              hasHealthCondition={row.original.person.hasHealthCondition}
              hasMedication={row.original.person.hasMedication}
            />
            <div className="space-y-0.5">
              <div className="font-medium text-foreground">{row.original.person.fullName}</div>
              <div className="text-xs text-muted-foreground">
                {PROJECT_PARTICIPATION_ROLE_LABELS[row.original.role] ?? row.original.role}
                {row.original.cycle?.name ? ` - ${row.original.cycle.name}` : ""}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "groups",
        header: "Grupos",
        accessorFn: (row) => row.groups.map((group) => group.name).join(", "),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.groups.map((group) => group.name).join(", ") || "Sem grupo"}
          </span>
        ),
      },
      {
        id: "role",
        header: "Novo papel",
        accessorFn: () => ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[role],
        cell: () => (
          <span className="text-xs text-muted-foreground">
            {ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[role]}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                onPick({ enrollment: row.original, role });
              }}
            >
              Adicionar
            </Button>
          </div>
        ),
      },
    ],
    [onPick, role, rows, selectedRows, tenantSlug],
  );

  const load = React.useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listEligibleProjectActionPeople(token, projectId, actionId, {
        q: searchText.trim() || undefined,
        filters: domain,
        participationKind: "TEAM",
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setRows(response.data);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (nextError) {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao carregar pessoas.";
      setError(message);
      setRows([]);
      setPageCount(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [actionId, open, pagination.pageIndex, pagination.pageSize, projectId, searchText, domain, token]);

  React.useEffect(() => {
    if (!open) return;
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }, [open, searchText, domain]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const removeDomainCondition = React.useCallback((index: number) => {
    setDomain((previous) => removeConditionAtIndex(previous, "and", index));
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }, []);

  const queryFacets = React.useMemo(
    () =>
      buildQueryFacets({
        domain,
        groupBy,
        searchView: peopleSearchView,
        onClearGroupBy: () => setGroupBy([]),
        onClearDomain: () => {
          setDomain(null);
          setPagination((previous) => ({ ...previous, pageIndex: 0 }));
        },
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [domain, groupBy, removeDomainCondition],
  );

  const handleBulkAdd = React.useCallback(async () => {
    if (selectedRows.length === 0) return;
    setSaving(true);
    try {
      for (const enrollment of selectedRows) {
        await onPick({ enrollment, role });
      }
      setSelectedRows([]);
    } finally {
      setSaving(false);
    }
  }, [onPick, role, selectedRows]);

  const handleSelectFiltered = React.useCallback(async () => {
    setSaving(true);
    try {
      const firstPage = await listEligibleProjectActionPeople(token, projectId, actionId, {
        q: searchText.trim() || undefined,
        filters: domain,
        participationKind: "TEAM",
        page: 1,
        limit: 200,
      });
      let allRows = [...firstPage.data];
      for (let page = 2; page <= firstPage.pagination.pages; page += 1) {
        const response = await listEligibleProjectActionPeople(token, projectId, actionId, {
          q: searchText.trim() || undefined,
          filters: domain,
          participationKind: "TEAM",
          page,
          limit: 200,
        });
        allRows = Array.from(
          new Map([...allRows, ...response.data].map((item) => [item.id, item])).values(),
        );
      }
      setSelectedRows((previous) =>
        Array.from(new Map([...previous, ...allRows].map((item) => [item.id, item])).values()),
      );
    } finally {
      setSaving(false);
    }
  }, [actionId, domain, projectId, searchText, token]);

  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar pessoa"
      description="Selecione pessoas elegíveis da equipe vinculada ao projeto para associar a esta ação."
      contentClassName="max-w-[1100px]"
      headerSlot={
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Selecionados: <strong>{selectedRows.length}</strong>
          </span>
          <Button type="button" variant="secondary" disabled={saving || selectedRows.length === 0} onClick={() => void handleBulkAdd()}>
            {saving ? "Adicionando..." : "Adicionar selecionados"}
          </Button>
        </div>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchText}
              onChange={(next) => {
                setSearchText(next);
                setPagination((previous) => ({ ...previous, pageIndex: 0 }));
              }}
              placeholder="Pesquisar"
              facets={queryFacets}
              rightSlot={
                <SearchPanelMenu
                  actionId="action-people-picker.people"
                  searchView={peopleSearchView}
                  domain={domain}
                  onDomainChange={(next) => {
                    setDomain(next);
                    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
                  }}
                  groupBy={groupBy}
                  onGroupByChange={setGroupBy}
                  groupByOptions={peopleSearchView.groupBy}
                  snapshot={{ searchText, domain, groupBy }}
                  onApplyFavorite={(snapshot) => {
                    setSearchText(String(snapshot.searchText ?? ""));
                    setDomain((snapshot.domain as Domain) ?? null);
                    setGroupBy(Array.isArray(snapshot.groupBy) ? (snapshot.groupBy as string[]) : []);
                  }}
                  variant="compact"
                />
              }
            />
          </div>

          <div className="min-w-[240px]">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Papel</div>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as ActionPeopleParticipationRole)}
            >
              <SelectTrigger className="h-9 rounded-none border-x-0 border-t-0 border-border/70 bg-transparent px-0 text-sm shadow-none focus:ring-0">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_PEOPLE_PARTICIPATION_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRows.length > 0 ? (
            <div className="min-w-[120px]">
              <div className="mb-2 text-xs font-medium text-muted-foreground opacity-0">
                Limpar
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-none border-x-0 border-t-0 border-border/70 px-0 text-sm"
                disabled={saving}
                onClick={() => setSelectedRows([])}
              >
                Limpar seleção
              </Button>
            </div>
          ) : null}
        </div>

        <TableView
          data={rows}
          columns={columns}
          onRowClick={(row) =>
            setSelectedRows((previous) =>
              previous.some((item) => item.id === row.id)
                ? previous.filter((item) => item.id !== row.id)
                : Array.from(new Map([...previous, row].map((item) => [item.id, item])).values()),
            )
          }
          minWidthClassName="min-w-[980px]"
        />

        <PaginationBar
          pageIndex={pagination.pageIndex}
          pageCount={pageCount}
          pageSize={pagination.pageSize}
          onPageIndexChange={(next) =>
            setPagination((previous) => ({ ...previous, pageIndex: next }))
          }
          onPageSizeChange={(next) => setPagination({ pageIndex: 0, pageSize: next })}
          disabled={loading || saving}
        />
      </div>

      {loading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}
    </SectionDialog>
  );
}
