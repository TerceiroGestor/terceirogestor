"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";
import type { PeopleTableItem, PersonFormData } from "./types";
import { usePeopleColumns } from "./columns";
import { toDateInputValue } from "./utils";
import { PeopleFormDialog } from "./_components/people-form-dialog";
import { useAuth } from "@/features/auth/auth-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  createPerson,
  deletePerson,
  listPeople,
  updatePerson,
} from "@/features/people/api";
import { uploadAvatar } from "@/features/uploads/api";
import { resolveMediaUrl, stripApiUrl } from "@/lib/api";
import type { AdvancedFilter } from "@/components/DataTable/DataTableFilterSheetFilters";

export default function PeoplePage() {
  const router = useRouter();
  const { setPageBreadcrumb } = useBreadcrumb();
  const { token } = useAuth();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PeopleTableItem | null>(null);
  const [rows, setRows] = useState<PeopleTableItem[]>([]);
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
      {
        label: "Novo cadastro",
        onClick: () => {
          setEditing(null);
          setFormOpen(true);
        },
      },
    );
  }, [setPageBreadcrumb, setFormOpen, setEditing]);

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

  const loadPeople = useCallback(async (force = false) => {
    if (!token) return;
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
      const mapped = response.data.map((person) => ({
        id: person.id,
        fullName: person.fullName,
        socialName: person.socialName,
        gender: person.gender,
        maritalStatus: person.maritalStatus,
        nationality: person.nationality,
        email: person.email,
        phone: person.phone,
        document: person.document,
        rg: person.rg,
        nis: person.nis,
        status: person.status as PeopleTableItem["status"],
        notes: person.notes,
        profileSummary: person.profileSummary,
        birthDate: person.birthDate,
        avatarUrl: person.avatarUrl ?? "/avatar.jpg",
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
      }));
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
  }, [
    token,
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    appliedFilters,
    grouping,
    shouldFetchAll,
    requestKey,
  ]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated) {
      setIsLoading(false);
      return;
    }
    loadPeople();
  }, [token, isAuthenticated, authLoading, loadPeople]);

  const openEdit = useCallback(
    (person: PeopleTableItem) => {
      setEditing(person);
      setFormOpen(true);
    },
    [router],
  );

  const openView = useCallback(
    (person: PeopleTableItem) => {
      router.push(`/people/${person.id}`);
    },
    [router],
  );

  const columns = usePeopleColumns();
  const initialValues = useMemo<Partial<PersonFormData> | undefined>(() => {
    if (!editing) return undefined;
    return {
      fullName: editing.fullName,
      socialName: editing.socialName ?? "",
      email: editing.email ?? "",
      phone: editing.phone ?? "",
      gender: editing.gender ?? "",
      maritalStatus: editing.maritalStatus ?? "",
      nationality: editing.nationality ?? "",
      document: editing.document ?? "",
      rg: editing.rg ?? "",
      nis: editing.nis ?? "",
      status: editing.status ?? null,
      profileSummary: editing.profileSummary ?? "",
      birthDate: toDateInputValue(editing.birthDate),
      avatarUrl: resolveMediaUrl(editing.avatarUrl ?? "/avatar.jpg"),
    };
  }, [editing]);

  const handleSubmit = useCallback(
    async (values: PersonFormData) => {
      if (!token) return;
      setError(null);
      let avatarUrl =
        typeof values.avatarUrl === "string"
          ? stripApiUrl(values.avatarUrl)
          : editing?.avatarUrl ?? "/avatar.jpg";
      if (values.avatarUrl instanceof File) {
        const upload = await uploadAvatar(token, values.avatarUrl);
        avatarUrl = upload.path;
      }
      const payload = {
        fullName: values.fullName,
        socialName: values.socialName || null,
        birthDate: values.birthDate || null,
        gender: values.gender || null,
        maritalStatus: values.maritalStatus || null,
        nationality: values.nationality || null,
        email: values.email || null,
        phone: values.phone || null,
        document: values.document || null,
        rg: values.rg || null,
        nis: values.nis || null,
        status: values.status || null,
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
        throw err;
      }
    },
    [token, editing, loadPeople],
  );

  const handleDelete = useCallback(
    async (person: PeopleTableItem) => {
      if (!token) return;
      setError(null);
      const confirmed = window.confirm(
        `Remover o cadastro de ${person.fullName}?`,
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
    [token, loadPeople],
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
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
          {
            id: "edit",
            label: "Editar",
            onSelect: openEdit,
          },
          {
            id: "delete",
            label: "Excluir",
            destructive: true,
            onSelect: handleDelete,
          },
        ]}
      />

      <PeopleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar cadastro" : "Novo cadastro de pessoa"}
        description={
          editing
            ? "Atualize os dados da pessoa selecionada."
            : "Preencha o formulario completo de perfil socioeconomico."
        }
        initialValues={initialValues}
        submitLabel={editing ? "Salvar" : "Cadastrar"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
