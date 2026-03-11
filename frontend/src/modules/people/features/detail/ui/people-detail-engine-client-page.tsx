"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { uploadAvatar } from "@/features/uploads/api";
import { resolveMediaUrl, stripApiUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type { ApiPerson } from "@/modules/people/api";
import {
  peopleDetailModuleDefinition,
  PEOPLE_ROUTES,
} from "@/modules/people/config/people-module-contract";
import type { PeopleDetailLayoutContext } from "@/modules/people/config/people-detail-layout-contract";
import { mapApiPersonToPerson } from "@/modules/people/shared/domain/people-module.helpers";
import type { PersonFormData } from "@/modules/people/shared/domain/types";
import {
  resolvePersonDisplayNames,
  toDateInputValue,
} from "@/modules/people/shared/domain/utils";
import { PeopleFormDialog } from "@/modules/people/shared/ui/people-form-dialog";
import { PEOPLE_FORM_TEXT } from "@/modules/people/shared/domain/people.constants";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import {
  canUseModuleAction,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

export function PeopleDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
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

  const [person, setPerson] = React.useState<ReturnType<typeof mapApiPersonToPerson> | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [tabValue, setTabValue] = React.useState("resumo");
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
  const personRef = React.useRef<ReturnType<typeof mapApiPersonToPerson> | null>(null);

  React.useEffect(() => {
    personRef.current = person;
  }, [person]);

  React.useEffect(() => {
    setAuditVisibleCount(24);
  }, [id]);

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
      setPerson(mapApiPersonToPerson(response));
    } catch (nextError) {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao carregar pessoa.";

      setPerson(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, enabled, id]);

  React.useEffect(() => {
    void loadPerson();
  }, [loadPerson]);

  const backToList = React.useCallback(() => {
    router.push(withTenantPath(PEOPLE_ROUTES.list, tenantSlug));
  }, [router, tenantSlug]);

  const handleUpdate = React.useCallback(
    async (values: PersonFormData) => {
      if (!token || !person || !canUpdate) return;

      if (values.status === "Desligado" && !values.departureReason?.trim()) {
        throw new Error("Informe o motivo do desligamento.");
      }

      setSaving(true);
      setError(null);

      try {
        const avatarUrl =
          typeof values.avatarUrl === "string"
            ? stripApiUrl(values.avatarUrl)
            : person.avatarUrl ?? null;

        let resolvedAvatarUrl = avatarUrl;
        if (values.avatarUrl instanceof File) {
          resolvedAvatarUrl = (await uploadAvatar(token, values.avatarUrl)).path;
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
          avatarUrl: resolvedAvatarUrl,
        };

        const updated = await dataProvider.update<ApiPerson>(
          peopleDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "people.detail",
          person.id,
          payload,
        );

        setPerson(mapApiPersonToPerson(updated));
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

  const handleAvatarUpdate = React.useCallback(
    async (file: File | null) => {
      const currentPerson = personRef.current;
      if (!token || !currentPerson || !canUpdate) return;

      setAvatarUploading(true);
      setError(null);
      try {
        const avatarUrl = file ? (await uploadAvatar(token, file)).path : null;
        const updated = await dataProvider.update<ApiPerson>(
          peopleDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "people.detail",
          currentPerson.id,
          { avatarUrl },
        );
        setPerson(mapApiPersonToPerson(updated));
      } catch (nextError) {
        const message =
          nextError && typeof nextError === "object" && "message" in nextError
            ? String((nextError as { message?: string }).message)
            : "Falha ao atualizar foto.";
        setError(message);
      } finally {
        setAvatarUploading(false);
      }
    },
    [canUpdate, dataProvider, token],
  );

  const handleUpdateTags = React.useCallback(
    async (tags: string[]) => {
      if (!person || !canUpdate) return;

      await handleUpdate({
        fullName: person.fullName,
        socialName: person.socialName ?? null,
        birthDate: person.birthDate ?? null,
        sex: person.sex ?? null,
        gender: person.gender ?? null,
        raceColor: person.raceColor ?? null,
        maritalStatus: person.maritalStatus ?? null,
        nationality: person.nationality ?? null,
        status: person.status ?? null,
        personType: person.personType ?? null,
        departureReason: person.departureReason ?? null,
        tags,
        profileSummary: person.profileSummary ?? null,
        avatarUrl: person.avatarUrl ?? null,
      });
    },
    [canUpdate, handleUpdate, person],
  );

  const tagSuggestions = React.useMemo(
    () => Array.from(new Set((person?.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    [person?.tags],
  );

  const initialValues = React.useMemo<Partial<PersonFormData> | undefined>(() => {
    if (!person) return undefined;

    return {
      fullName: person.fullName,
      socialName: person.socialName ?? "",
      birthDate: toDateInputValue(person.birthDate),
      sex: person.sex ?? "",
      personType: person.personType ?? null,
      gender: person.gender ?? "",
      raceColor: person.raceColor ?? "",
      maritalStatus: person.maritalStatus ?? "",
      nationality: person.nationality ?? "",
      status: person.status ?? null,
      departureReason: person.departureReason ?? "",
      tags: person.tags ?? [],
      profileSummary: person.profileSummary ?? "",
      avatarUrl: person.avatarUrl ? resolveMediaUrl(person.avatarUrl) : null,
    };
  }, [person]);

  const displayNames = React.useMemo(
    () =>
      person
        ? resolvePersonDisplayNames(person.fullName, person.socialName)
        : { primary: "Pessoa", secondary: null },
    [person],
  );

  const context = React.useMemo<PeopleDetailLayoutContext | null>(
    () =>
      person
        ? {
            person,
            readOnly: !canUpdate,
            avatarUploading,
            canAudit,
            tagSuggestions,
            onUpdateTags: canUpdate ? handleUpdateTags : undefined,
            onAvatarFileSelect: canUpdate
              ? (file) => handleAvatarUpdate(file)
              : undefined,
            tabValue,
            onTabChange: setTabValue,
            auditVisibleCount,
            onAuditVisibleCountChange: setAuditVisibleCount,
          }
        : null,
    [
      auditVisibleCount,
      avatarUploading,
      canAudit,
      canUpdate,
      handleAvatarUpdate,
      handleUpdateTags,
      person,
      tabValue,
      tagSuggestions,
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
              <Link href={withTenantPath(`/person/${person.id}/tree`, tenantSlug)}>
                Arvore genealogica
              </Link>
            </Button>

            {canUpdate ? (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                Editar cadastro
              </Button>
            ) : null}
          </div>
        }
      />

      {canUpdate ? (
        <PeopleFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          title="Editar cadastro"
          description={PEOPLE_FORM_TEXT.dialogs.editDescription}
          initialValues={initialValues}
          submitLabel="Salvar"
          onSubmit={handleUpdate}
          tagSuggestions={tagSuggestions}
        />
      ) : null}
    </>
  );
}
