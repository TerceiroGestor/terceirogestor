"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";
import type {
  PeopleTableItem,
  PersonFormData,
} from "@/modules/people/shared/domain/types";
import { usePeopleColumns } from "@/modules/people/features/list/ui/columns";
import {
  getAgeFromBirthDate,
  isBirthdayInCurrentMonth,
  isBirthdayToday,
  resolvePersonDisplayNames,
  toDateInputValue,
} from "@/modules/people/shared/domain/utils";
import { PeopleFormDialog } from "@/modules/people/shared/ui/people-form-dialog";
import { PEOPLE_FORM_TEXT } from "@/modules/people/shared/domain/people.constants";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  createPerson,
  deletePerson,
  listPeople,
  updatePerson,
  type ApiPerson,
} from "@/modules/people/api";
import { uploadAvatar } from "@/features/uploads/api";
import { resolveMediaUrl, stripApiUrl } from "@/lib/api";
import { buildExportMeta } from "@/lib/auth-utils";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type { AdvancedFilter } from "@/components/DataTable/DataTableFilterSheetFilters";
import { useToast } from "@/components/ui/use-toast";

export function PeopleListClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { setPageBreadcrumb } = useBreadcrumb();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  const canRead = permissions.includes("people.read");
  const canCreate = permissions.includes("people.create");
  const canUpdate = permissions.includes("people.update");
  const canDelete = permissions.includes("people.delete");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PeopleTableItem | null>(null);
  const [rows, setRows] = useState<PeopleTableItem[]>([]);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilter[]>([]);
  const [grouping, setGrouping] = useState<string[]>([]);
  const [chartOpen, setChartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightRequestRef = useRef<string | null>(null);
  const lastRequestRef = useRef<string | null>(null);

  const shouldFetchAll = grouping.length > 0 || chartOpen;
  const requestKey = useMemo(
    () =>
      JSON.stringify({
        q: debouncedSearch || "",
        page: shouldFetchAll ? 1 : pagination.pageIndex + 1,
        limit: shouldFetchAll ? 0 : pagination.pageSize,
        all: shouldFetchAll,
        filters: appliedFilters,
        grouping,
      }),
    [
      debouncedSearch,
      shouldFetchAll,
      pagination.pageIndex,
      pagination.pageSize,
      appliedFilters,
      grouping,
    ],
  );

  useEffect(() => {
    setPageBreadcrumb(
      "Pessoas",
      [{ label: "Pessoas" }],
      canCreate
        ? {
            label: "Novo cadastro",
            onClick: () => {
              setEditing(null);
              setFormOpen(true);
            },
          }
        : undefined,
    );
  }, [setPageBreadcrumb, setFormOpen, setEditing, canCreate]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, appliedFilters]);

  useEffect(() => {
    if (!shouldFetchAll) return;
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [shouldFetchAll]);

  const mapApiToRow = useCallback(
    (person: ApiPerson): PeopleTableItem => ({
      id: person.id,
      fullName: person.fullName,
      socialName: person.socialName,
      sex: person.sex,
      gender: person.gender,
      raceColor: person.raceColor,
      maritalStatus: person.maritalStatus,
      nationality: person.nationality,
      email: person.email,
      phone: person.phone,
      status: person.status as PeopleTableItem["status"],
      personType: person.personType ?? null,
      departureReason: person.departureReason,
      notes: person.notes,
      tags: person.tags ?? [],
      hasHealthCondition: person.hasHealthCondition ?? false,
      hasMedication: person.hasMedication ?? false,
      profileSummary: person.profileSummary,
      birthDate: person.birthDate,
      age: getAgeFromBirthDate(person.birthDate),
      isBirthdayMonth: isBirthdayInCurrentMonth(person.birthDate),
      isBirthdayToday: isBirthdayToday(person.birthDate),
      avatarUrl: person.avatarUrl ?? "/avatar.jpg",
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
    }),
    [],
  );

  const loadPeople = useCallback(
    async (force = false) => {
      if (!token || !canRead) return;
      if (!force) {
        if (inFlightRequestRef.current === requestKey) return;
        if (lastRequestRef.current === requestKey) return;
      }
      inFlightRequestRef.current = requestKey;
      setIsLoading(true);
      setError(null);
      try {
        const response = await listPeople(token, {
          q: debouncedSearch || undefined,
          page: shouldFetchAll ? undefined : pagination.pageIndex + 1,
          limit: shouldFetchAll ? undefined : pagination.pageSize,
          all: shouldFetchAll ? true : undefined,
          filters: appliedFilters.length
            ? JSON.stringify(appliedFilters)
            : undefined,
          groupBy: grouping.length ? JSON.stringify(grouping) : undefined,
        });
        const mapped = response.data.map(mapApiToRow);
        setRows(mapped);
        setTotalCount(response.pagination.total);
        setPageCount(response.pagination.pages);
        lastRequestRef.current = requestKey;
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao carregar pessoas.";
        setError(message);
        lastRequestRef.current = requestKey;
      } finally {
        inFlightRequestRef.current = null;
        setIsLoading(false);
      }
    },
    [
      token,
      canRead,
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
      appliedFilters,
      grouping,
      shouldFetchAll,
      requestKey,
      mapApiToRow,
    ],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canRead) {
      setIsLoading(false);
      return;
    }
    loadPeople();
  }, [token, isAuthenticated, authLoading, canRead, loadPeople]);

  const openEdit = useCallback(
    (person: PeopleTableItem) => {
      setEditing(person);
      setFormOpen(true);
    },
    [],
  );

  const openView = useCallback(
    (person: PeopleTableItem) => {
      router.push(withTenantPath(`/people/${person.id}`, tenantSlug));
    },
    [router, tenantSlug],
  );

  const updatingSet = useMemo(() => new Set(updatingIds), [updatingIds]);
  const tagSuggestions = useMemo(() => {
    const tags = new Set<string>();
    rows.forEach((row) => {
      (row.tags ?? []).forEach((tag) => {
        const cleaned = tag.trim();
        if (cleaned) tags.add(cleaned);
      });
    });
    return Array.from(tags);
  }, [rows]);
  const exportMeta = useMemo(() => {
    if (!token) return undefined;
    return {
      ...buildExportMeta({
        token,
        title: "Relatório de pessoas",
        subtitle: "Cadastro de pessoas",
      }),
    };
  }, [token]);
  const columns = usePeopleColumns({
    onInlineUpdate: canUpdate
      ? async (personId, patch) => {
      if (!token) return;
      let nextPatch = patch;
      if (patch.status === "Desligado" && !patch.departureReason) {
        const reason = window
          .prompt("Informe o motivo do desligamento:")
          ?.trim();
        if (!reason) {
          return;
        }
        nextPatch = { ...patch, departureReason: reason };
      }
      setUpdatingIds((prev) =>
        prev.includes(personId) ? prev : [...prev, personId],
      );
      try {
        const updated = await updatePerson(token, personId, nextPatch);
        setRows((prev) =>
          prev.map((item) =>
            item.id === personId ? mapApiToRow(updated) : item,
          ),
        );
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao atualizar pessoa.";
        setError(message);
      } finally {
        setUpdatingIds((prev) => prev.filter((id) => id !== personId));
      }
    }
      : undefined,
    updatingIds: updatingSet,
    tagSuggestions,
  });
  const initialValues = useMemo<Partial<PersonFormData> | undefined>(() => {
    if (!editing) return undefined;
    return {
      fullName: editing.fullName,
      socialName: editing.socialName ?? "",
      gender: editing.gender ?? "",
      sex: editing.sex ?? "",
      raceColor: editing.raceColor ?? "",
      maritalStatus: editing.maritalStatus ?? "",
      nationality: editing.nationality ?? "",
      status: editing.status ?? null,
      personType: editing.personType ?? null,
      departureReason: editing.departureReason ?? "",
      tags: editing.tags ?? [],
      profileSummary: editing.profileSummary ?? "",
      birthDate: toDateInputValue(editing.birthDate),
      avatarUrl: resolveMediaUrl(editing.avatarUrl ?? "/avatar.jpg"),
    };
  }, [editing]);

  const handleSubmit = useCallback(
    async (values: PersonFormData) => {
      if (!token) return;
      setError(null);
      if (editing && !canUpdate) {
        const message = "Voc\u00ea n\u00e3o tem permiss\u00e3o para editar pessoas.";
        setError(message);
        throw new Error(message);
      }
      if (!editing && !canCreate) {
        const message = "Voc\u00ea n\u00e3o tem permiss\u00e3o para criar pessoas.";
        setError(message);
        throw new Error(message);
      }
      if (values.status === "Desligado" && !values.departureReason?.trim()) {
        const message = "Informe o motivo do desligamento.";
        setError(message);
        throw new Error(message);
      }
      let avatarUrl =
        typeof values.avatarUrl === "string"
          ? stripApiUrl(values.avatarUrl)
          : (editing?.avatarUrl ?? "/avatar.jpg");
      if (values.avatarUrl instanceof File) {
        const upload = await uploadAvatar(token, values.avatarUrl);
        avatarUrl = upload.path;
      }
      const payload = {
        fullName: values.fullName,
        socialName: values.socialName || null,
        birthDate: values.birthDate || null,
        sex: values.sex || null,
        gender: values.gender || null,
        raceColor: values.raceColor || null,
        maritalStatus: values.maritalStatus || null,
        nationality: values.nationality || null,
        status: values.status || null,
        personType: values.personType || null,
        departureReason: values.departureReason || null,
        tags: values.tags ?? [],
        profileSummary: values.profileSummary || null,
        avatarUrl,
      };

      try {
        if (editing) {
          await updatePerson(token, editing.id, payload);
        } else {
          await createPerson(token, payload);
        }
        await loadPeople(true);
        setEditing(null);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar pessoa.";
        setError(message);
        toast({ title: "Falha ao salvar", description: message, variant: "destructive" });
        throw err;
      }
    },
    [token, editing, canCreate, canUpdate, loadPeople, toast],
  );

  const handleDelete = useCallback(
    async (person: PeopleTableItem) => {
      if (!token) return;
      setError(null);
      if (!canDelete) {
        const message = "Voc\u00ea n\u00e3o tem permiss\u00e3o para excluir pessoas.";
        setError(message);
        return;
      }
      const displayNames = resolvePersonDisplayNames(
        person.fullName,
        person.socialName,
      );
      const confirmed = window.confirm(
        `Remover o cadastro de ${displayNames.primary}?`,
      );
      if (!confirmed) return;
      try {
        await deletePerson(token, person.id);
        await loadPeople(true);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao excluir pessoa.";
        setError(message);
      }
    },
    [token, loadPeople, canDelete],
  );

  if (authLoading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Voc\u00ea n\u00e3o tem permiss\u00e3o para acessar esta \u00e1rea.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        manualPagination
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(next) => setPagination(next)}
        totalCount={totalCount}
        onGlobalFilterChange={setSearch}
        onAdvancedFiltersApply={setAppliedFilters}
        onGroupingChange={setGrouping}
        onChartOpenChange={setChartOpen}
        exportMeta={exportMeta}
        initialColumnPinning={{
          left: ["actions", "fullName"],
          right: ["status"],
        }}
        searchPlaceholder="Pesquisar pessoas"
        summaryCards={{
          totalLabel: "Total",
          filteredLabel: "Filtrados",
          groupedLabel: "Grupos",
        }}
        showExportMenu
        rowActions={[
          {
            id: "view",
            label: "Visualizar",
            onSelect: openView,
          },
          ...(canUpdate
            ? [
                {
                  id: "edit",
                  label: "Editar",
                  onSelect: openEdit,
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  id: "delete",
                  label: "Excluir",
                  destructive: true,
                  onSelect: handleDelete,
                },
              ]
            : []),
        ]}
      />

      <PeopleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar cadastro" : "Novo cadastro de pessoa"}
        description={
          editing
            ? PEOPLE_FORM_TEXT.dialogs.editDescription
            : PEOPLE_FORM_TEXT.dialogs.createDescription
        }
        initialValues={initialValues}
        submitLabel={editing ? "Salvar" : "Cadastrar"}
        onSubmit={handleSubmit}
        tagSuggestions={tagSuggestions}
      />
    </div>
  );
}
