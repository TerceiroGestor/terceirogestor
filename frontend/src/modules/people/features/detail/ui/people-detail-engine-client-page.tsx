"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { uploadAvatar } from "@/features/uploads/api";
import { stripApiUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type { ApiPerson } from "@/modules/people/api";
import {
  peopleDetailModuleDefinition,
  PEOPLE_ROUTES,
} from "@/modules/people/config/people-module-contract";
import type { PeopleDetailLayoutContext } from "@/modules/people/config/people-detail-layout-contract";
import { mapApiPersonToPerson } from "@/modules/people/shared/domain/people-module.helpers";
import type { Person, PersonFormData } from "@/modules/people/shared/domain/types";
import {
  resolvePersonDisplayNames,
  toDateInputValue,
} from "@/modules/people/shared/domain/utils";
import {
  isPeopleDetailTabValue,
  type PeopleDetailTabValue,
} from "@/modules/people/shared/domain/people-relation-routes";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

function buildPersonDraft(person: Person): PersonFormData {
  return {
    fullName: person.fullName,
    socialName: person.socialName ?? "",
    email: person.email ?? "",
    phone: person.phone ?? "",
    birthDate: toDateInputValue(person.birthDate),
    sex: person.sex ?? null,
    personType: person.personType ?? null,
    gender: person.gender ?? null,
    raceColor: person.raceColor ?? null,
    maritalStatus: person.maritalStatus ?? null,
    nationality: person.nationality ?? "",
    status: person.status ?? null,
    departureReason: person.departureReason ?? "",
    notes: person.notes ?? "",
    tags: person.tags ?? [],
    profileSummary: person.profileSummary ?? "",
    avatarUrl: person.avatarUrl ?? null,
  };
}

function normalizePersonDraft(draft: PersonFormData): PersonFormData {
  return {
    ...draft,
    fullName: draft.fullName.trim(),
    socialName: draft.socialName?.trim() || null,
    email: draft.email?.trim() || null,
    phone: draft.phone?.trim() || null,
    birthDate: draft.birthDate || null,
    sex: draft.sex || null,
    personType: draft.personType || null,
    gender: draft.gender || null,
    raceColor: draft.raceColor || null,
    maritalStatus: draft.maritalStatus || null,
    nationality: draft.nationality?.trim() || null,
    status: draft.status || null,
    departureReason: draft.departureReason?.trim() || null,
    notes: draft.notes?.trim() || null,
    tags: Array.from(new Set((draft.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    profileSummary: draft.profileSummary ?? "",
    avatarUrl:
      draft.avatarUrl instanceof File
        ? draft.avatarUrl
        : typeof draft.avatarUrl === "string"
          ? draft.avatarUrl.trim() || null
          : null,
  };
}

export function PeopleDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = hasModulePermission(
    peopleDetailModuleDefinition,
    "canRead",
    permissions,
  );
  const canUpdate = canUseModuleAction(
    peopleDetailModuleDefinition,
    "edit",
    permissions,
  );
  const canAudit = canUseModuleAction(
    peopleDetailModuleDefinition,
    "audit",
    permissions,
  );

  const id = params?.id ? String(params.id) : "";
  const enabled = Boolean(token && canRead && id);
  const dataProvider = React.useMemo(
    () => createRestDataProvider({ token }),
    [token],
  );

  const [person, setPerson] = React.useState<Person | null>(null);
  const [draft, setDraft] = React.useState<PersonFormData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const initialTab = React.useMemo<PeopleDetailTabValue>(() => {
    const tab = searchParams.get("tab");
    return isPeopleDetailTabValue(tab) && tab !== "atendimentos"
      ? tab
      : "familia";
  }, [searchParams]);
  const [tabValue, setTabValue] = React.useState<PeopleDetailTabValue>(initialTab);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
  const draftStateRef = React.useRef<PersonFormData | null>(null);

  React.useEffect(() => {
    draftStateRef.current = draft;
  }, [draft]);

  React.useEffect(() => {
    setAuditVisibleCount(24);
  }, [id]);

  React.useEffect(() => {
    setTabValue(initialTab);
  }, [initialTab]);

  const handleTabChange = React.useCallback(
    (nextValue: PeopleDetailTabValue) => {
      setTabValue(nextValue);
      const nextSearch = new URLSearchParams(searchParams.toString());
      if (nextValue === "familia") {
        nextSearch.delete("tab");
      } else {
        nextSearch.set("tab", nextValue);
      }
      const nextQuery = nextSearch.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const persistDraft = React.useCallback(
    async (nextDraft: PersonFormData) => {
      if (!token || !person || !canUpdate) return nextDraft;
      if (nextDraft.status === "Desligado" && !nextDraft.departureReason?.trim()) {
        throw new Error("Informe o motivo do desligamento.");
      }

      setSaving(true);
      setError(null);
      try {
        const normalized = normalizePersonDraft(nextDraft);
        let avatarUrl: string | null;

        if (normalized.avatarUrl instanceof File) {
          avatarUrl = (await uploadAvatar(token, normalized.avatarUrl)).path;
        } else if (typeof normalized.avatarUrl === "string") {
          avatarUrl = normalized.avatarUrl ? stripApiUrl(normalized.avatarUrl) : null;
        } else {
          avatarUrl = null;
        }

        const updated = await dataProvider.update<ApiPerson>(
          peopleDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "people.detail",
          person.id,
          {
            fullName: normalized.fullName,
            socialName: normalized.socialName,
            email: normalized.email,
            phone: normalized.phone,
            birthDate: normalized.birthDate,
            sex: normalized.sex,
            personType: normalized.personType,
            gender: normalized.gender,
            raceColor: normalized.raceColor,
            maritalStatus: normalized.maritalStatus,
            nationality: normalized.nationality,
            status: normalized.status,
            departureReason: normalized.departureReason,
            notes: normalized.notes,
            tags: normalized.tags ?? [],
            profileSummary: normalized.profileSummary || null,
            avatarUrl,
          },
        );

        const nextPerson = mapApiPersonToPerson(updated);
        const savedDraft = buildPersonDraft(nextPerson);
        setPerson(nextPerson);
        setDraft(savedDraft);
        return savedDraft;
      } catch (nextError) {
        const message =
          nextError && typeof nextError === "object" && "message" in nextError
            ? String((nextError as { message?: string }).message)
            : "Falha ao salvar pessoa.";
        setError(message);
        throw nextError;
      } finally {
        setSaving(false);
      }
    },
    [canUpdate, dataProvider, person, token],
  );

  const autoSave = useDetailAutoSaveController<PersonFormData>({
    draft,
    enabled: Boolean(person) && canUpdate && Boolean(token),
    config: getModuleDetailEditingConfig(peopleDetailModuleDefinition),
    normalizeDraft: normalizePersonDraft,
    onSave: persistDraft,
    onError: (nextError) => {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao salvar pessoa.";
      setError(message);
    },
  });
  const { replaceSavedDraft, commitField, commitDraft } = autoSave;

  const loadPerson = React.useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await dataProvider.read<ApiPerson>(
        peopleDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "people.detail",
        id,
      );
      const nextPerson = mapApiPersonToPerson(response);
      const nextDraft = buildPersonDraft(nextPerson);
      setPerson(nextPerson);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
    } catch (nextError) {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao carregar pessoa.";
      setPerson(null);
      setDraft(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, enabled, id, replaceSavedDraft]);

  React.useEffect(() => {
    void loadPerson();
  }, [loadPerson]);

  const backToList = React.useCallback(() => {
    router.push(withTenantPath(PEOPLE_ROUTES.list, tenantSlug));
  }, [router, tenantSlug]);

  const handleAvatarUpdate = React.useCallback(
    async (file: File) => {
      if (!draftStateRef.current || !canUpdate) return;
      setAvatarUploading(true);
      const nextDraft = { ...draftStateRef.current, avatarUrl: file };
      setDraft(nextDraft);
      draftStateRef.current = nextDraft;
      try {
        await Promise.resolve(commitDraft(nextDraft));
      } finally {
        setAvatarUploading(false);
      }
    },
    [canUpdate, commitDraft],
  );

  const tagSuggestions = React.useMemo(
    () => Array.from(new Set((person?.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    [person?.tags],
  );

  const displayNames = React.useMemo(
    () =>
      person
        ? resolvePersonDisplayNames(person.fullName, person.socialName)
        : { primary: "Pessoa", secondary: null },
    [person],
  );

  const handleDraftChange = React.useCallback<
    React.Dispatch<React.SetStateAction<PersonFormData>>
  >((next) => {
    setDraft((previous) => {
      if (!previous) return previous;
      const resolved =
        typeof next === "function"
          ? (next as (prev: PersonFormData) => PersonFormData)(previous)
          : next;
      draftStateRef.current = resolved;
      return resolved;
    });
  }, []);

  const handleCommitField = React.useCallback<
    <K extends keyof PersonFormData>(
      field: K,
      nextValue?: PersonFormData[K],
    ) => void
  >(
    (field, nextValue) => {
      const currentDraft = draftStateRef.current;
      if (!currentDraft) return;
      const nextDraft =
        typeof nextValue === "undefined"
          ? currentDraft
          : ({ ...currentDraft, [field]: nextValue } as PersonFormData);
      setDraft(nextDraft);
      draftStateRef.current = nextDraft;
      commitDraft(nextDraft);
    },
    [commitDraft],
  );

  const handleCommitDraft = React.useCallback(
    (nextDraft: PersonFormData) => {
      setDraft(nextDraft);
      draftStateRef.current = nextDraft;
      commitDraft(nextDraft);
    },
    [commitDraft],
  );

  const context = React.useMemo<PeopleDetailLayoutContext | null>(
    () =>
      person && draft
        ? {
            person,
            draft,
            readOnly: !canUpdate,
            avatarUploading,
            canAudit,
            tagSuggestions,
            onAvatarFileSelect: canUpdate ? (file) => handleAvatarUpdate(file) : undefined,
            onDraftChange: handleDraftChange,
            onCommitField: handleCommitField,
            onCommitDraft: handleCommitDraft,
            tabValue,
            onTabChange: handleTabChange,
            auditVisibleCount,
            onAuditVisibleCountChange: setAuditVisibleCount,
          }
        : null,
    [
      person,
      draft,
      canUpdate,
      avatarUploading,
      canAudit,
      tagSuggestions,
      handleAvatarUpdate,
      handleDraftChange,
      handleCommitField,
      handleCommitDraft,
      tabValue,
      auditVisibleCount,
      handleTabChange,
    ],
  );

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Voce nao tem permissao para acessar esta area.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Carregando pessoa...
      </div>
    );
  }

  if (error && !person) {
    return <div className="px-4 py-6 text-sm text-destructive">{error}</div>;
  }

  if (!person || !context) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Pessoa nao encontrada.
      </div>
    );
  }

  return (
    <>
      {error ? (
        <div className="px-4 pt-4 text-sm text-destructive">{error}</div>
      ) : null}

      <DetailShellEngine<PeopleDetailLayoutContext>
        moduleDefinition={peopleDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={canAudit}
        mode="edit"
        headerTitle={displayNames.primary}
        saving={saving || avatarUploading}
        loading={loading}
        readOnly={!canUpdate}
        onClose={backToList}
        breadcrumbTitle={displayNames.primary}
        breadcrumbItems={[
          { label: "Pessoas", href: PEOPLE_ROUTES.list },
          { label: displayNames.primary },
        ]}
        headerActionsSlot={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={withTenantPath(`/people/${person.id}/tree`, tenantSlug)}>
                Arvore genealogica
              </Link>
            </Button>
          </div>
        }
      />
    </>
  );
}
