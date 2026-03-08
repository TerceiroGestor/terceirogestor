"use client";

import * as React from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { uploadAvatar } from "@/features/uploads/api";
import { stripApiUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  listPantryEntries,
  type ApiPantryDonor,
  type ApiPantryEntry,
} from "@/modules/pantry/api";
import {
  type PantryDonorDetailLayoutContext,
  type PantryDonorDraft,
} from "@/modules/pantry/config/pantry-detail-layout-contract";
import { pantryDonorDetailModuleDefinition } from "@/modules/pantry/config/pantry-module-contract";
import { PANTRY_ROUTES } from "@/modules/pantry/shared/domain/pantry.constants";
import { PantryHeaderNav } from "@/modules/pantry/shared/ui/pantry-header-nav";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

type Mode = "create" | "edit";

function normalizeStringOrNull(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function normalizeDraft(draft: PantryDonorDraft): PantryDonorDraft {
  return {
    name: draft.name.trim(),
    type: draft.type,
    contact: normalizeStringOrNull(draft.contact),
    avatarUrl:
      typeof draft.avatarUrl === "string"
        ? normalizeStringOrNull(stripApiUrl(draft.avatarUrl))
        : null,
  };
}

function draftFromDonor(donor: ApiPantryDonor): PantryDonorDraft {
  return {
    name: donor.name ?? "",
    type: donor.type ?? "PERSON",
    contact: donor.contact ?? null,
    avatarUrl: donor.avatarUrl ?? null,
  };
}

function buildReturnUrl(returnTo: string, donorId: string) {
  try {
    const url = new URL(returnTo, window.location.origin);
    url.searchParams.set("donorId", donorId);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function PantryDonorDetailEngineClientPage({
  mode,
}: {
  mode: Mode;
}) {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = hasModulePermission(
    pantryDonorDetailModuleDefinition,
    "canRead",
    permissions,
  );
  const canCreate = canUseModuleAction(
    pantryDonorDetailModuleDefinition,
    "create",
    permissions,
  );
  const canUpdate = canUseModuleAction(
    pantryDonorDetailModuleDefinition,
    "edit",
    permissions,
  );

  const id = mode === "edit" ? (params?.id ? String(params.id) : "") : "";
  const canAccessPage = mode === "create" ? canCreate : canRead;
  const enabled = Boolean(token && canAccessPage && (mode === "create" || id));
  const returnTo = searchParams.get("returnTo");

  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [donor, setDonor] = React.useState<ApiPantryDonor | null>(null);
  const [draft, setDraft] = React.useState<PantryDonorDraft>({
    name: "",
    type: "PERSON",
    contact: null,
    avatarUrl: null,
  });
  const [loading, setLoading] = React.useState(mode === "edit");
  const [busy, setBusy] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
  const [entriesLoading, setEntriesLoading] = React.useState(false);
  const [entries, setEntries] = React.useState<ApiPantryEntry[]>([]);
  const [donors, setDonors] = React.useState<ApiPantryDonor[]>([]);

  const persistDonorDraft = React.useCallback(
    async (nextDraft: PantryDonorDraft) => {
      const normalizedDraft = normalizeDraft(nextDraft);
      const updated = await dataProvider.update<ApiPantryDonor>(
        pantryDonorDetailModuleDefinition.queryAdapters.detailDataProvider?.model ??
          "pantry.donors",
        id,
        normalizedDraft,
      );
      const savedDraft = draftFromDonor(updated);
      setDonor(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [dataProvider, id],
  );

  const autoSave = useDetailAutoSaveController<PantryDonorDraft>({
    draft,
    enabled: mode === "edit" && canUpdate,
    config: getModuleDetailEditingConfig(pantryDonorDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDonorDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar.";

      toast({
        variant: "destructive",
        title: "Falha ao salvar",
        description: message,
      });
    },
  });
  const {
    saving: autoSaving,
    replaceSavedDraft,
    commitField,
  } = autoSave;
  const saving = busy || avatarUploading || autoSaving;

  React.useEffect(() => {
    setAuditVisibleCount(24);
  }, [id, mode]);

  const readOnly = mode === "edit" ? !canUpdate : !canCreate;

  const close = React.useCallback(() => {
    if (returnTo && returnTo.startsWith("/")) {
      router.push(returnTo);
      return;
    }

    router.push(withTenantPath(PANTRY_ROUTES.donors, tenantSlug));
  }, [returnTo, router, tenantSlug]);

  const loadDonor = React.useCallback(async () => {
    if (!enabled || mode !== "edit") return;
    setLoading(true);

    try {
      const loaded = await dataProvider.read<ApiPantryDonor>(
        pantryDonorDetailModuleDefinition.queryAdapters.detailDataProvider?.model ??
          "pantry.donors",
        id,
      );
      const nextDraft = draftFromDonor(loaded);
      setDonor(loaded);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao carregar doador.";

      toast({
        variant: "destructive",
        title: "Falha ao carregar",
        description: message,
      });
      setDonor(null);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, enabled, id, mode, replaceSavedDraft, toast]);

  const loadEntries = React.useCallback(async () => {
    if (!token || !enabled || mode !== "edit" || !id) return;
    setEntriesLoading(true);

    try {
      const response = await listPantryEntries(token, { donorId: id, limit: 200 });
      const nextEntries = response.data ?? [];
      nextEntries.sort((left, right) =>
        String(right.entryDate ?? "").localeCompare(String(left.entryDate ?? "")),
      );
      setEntries(nextEntries);
    } catch {
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }, [enabled, id, mode, token]);

  const loadDonors = React.useCallback(async () => {
    if (!enabled || mode !== "edit") {
      setDonors([]);
      return;
    }

    try {
      const response = await dataProvider.search<ApiPantryDonor>("pantry.donors", {
        all: true,
      });
      setDonors(response.data ?? []);
    } catch {
      setDonors([]);
    }
  }, [dataProvider, enabled, mode]);

  React.useEffect(() => {
    void loadDonor();
  }, [loadDonor]);

  React.useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  React.useEffect(() => {
    void loadDonors();
  }, [loadDonors]);

  const createDonor = React.useCallback(async () => {
    if (!enabled) return;

    if (!canCreate) {
      toast({
        variant: "destructive",
        title: "Sem permissao",
        description: "Voce nao tem permissao para criar doadores.",
      });
      return;
    }

    const normalized = normalizeDraft(draft);
    if (!normalized.name) {
      toast({
        variant: "destructive",
        title: "Dados invalidos",
        description: "Informe o nome.",
      });
      return;
    }

    setBusy(true);
    try {
      const created = await dataProvider.create<ApiPantryDonor>(
        pantryDonorDetailModuleDefinition.queryAdapters.detailDataProvider?.model ??
          "pantry.donors",
        normalized,
      );

      toast({ variant: "success", title: "Doador criado" });

      if (returnTo && returnTo.startsWith("/")) {
        const nextUrl = buildReturnUrl(returnTo, created.id);
        if (nextUrl) {
          router.push(nextUrl);
          return;
        }
      }

      router.replace(withTenantPath(`${PANTRY_ROUTES.donors}/${created.id}`, tenantSlug));
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar doador.";

      toast({
        variant: "destructive",
        title: "Falha ao criar",
        description: message,
      });
    } finally {
      setBusy(false);
    }
  }, [canCreate, dataProvider, draft, enabled, returnTo, router, tenantSlug, toast]);

  const openEntryDetail = React.useCallback(
    (entryId: string) => {
      const href = withTenantPath(`${PANTRY_ROUTES.entries}/${entryId}`, tenantSlug);
      router.push(`${href}?returnTo=${encodeURIComponent(pathname)}`);
    },
    [pathname, router, tenantSlug],
  );

  const donorNameById = React.useMemo<Record<string, string>>(() => {
    const next: Record<string, string> = {};

    donors.forEach((row) => {
      if (row.id && row.name) {
        next[row.id] = row.name;
      }
    });

    if (donor?.id && donor.name) {
      next[donor.id] = donor.name;
    }

    return next;
  }, [donor, donors]);

  const commitAvatar = React.useCallback(
    async (file: File | null) => {
      if (!token) return;

      setAvatarUploading(true);
      try {
        const avatarUrl = file ? (await uploadAvatar(token, file)).path : null;

        if (mode === "create") {
          setDraft((previous) => ({ ...previous, avatarUrl }));
          return;
        }

        setDraft((previous) => ({ ...previous, avatarUrl }));
        void commitField("avatarUrl", avatarUrl);
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao atualizar foto.";

        toast({
          variant: "destructive",
          title: "Falha na foto",
          description: message,
        });
      } finally {
        setAvatarUploading(false);
      }
    },
    [commitField, mode, toast, token],
  );

  const headerTitle =
    mode === "create" ? "Novo doador" : donor?.name ? donor.name : "Doador";

  const context = React.useMemo<PantryDonorDetailLayoutContext>(
    () => ({
      mode,
      readOnly,
      avatarUploading,
      draft,
      setDraft,
      onCommitField: (key) => {
        void commitField(key);
      },
      onTypeChange: (type) => {
        void commitField("type", type);
      },
      onAvatarFileSelect: (file) => {
        void commitAvatar(file);
      },
      onAvatarRemove: () => {
        void commitAvatar(null);
      },
      donor,
      donorNameById,
      entries,
      entriesLoading,
      auditVisibleCount,
      onAuditVisibleCountChange: setAuditVisibleCount,
      onOpenEntry: openEntryDetail,
    }),
    [
      auditVisibleCount,
      commitField,
      avatarUploading,
      commitAvatar,
      donor,
      donorNameById,
      draft,
      entries,
      entriesLoading,
      mode,
      openEntryDetail,
      readOnly,
      setDraft,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissao.</div>;
  }

  return (
    <DetailShellEngine<PantryDonorDetailLayoutContext>
      moduleDefinition={pantryDonorDetailModuleDefinition}
      context={context}
      dataProvider={dataProvider}
      mode={mode}
      headerTitle={headerTitle}
      saving={saving}
      loading={loading}
      readOnly={readOnly}
      onSave={mode === "create" ? createDonor : undefined}
      onClose={close}
      breadcrumbTitle={headerTitle}
      breadcrumbItems={[
        { label: "Despensa", href: PANTRY_ROUTES.stock },
        { label: "Doadores", href: PANTRY_ROUTES.donors },
        ...(mode === "edit" ? [{ label: headerTitle }] : []),
      ]}
      actionSlot={<PantryHeaderNav />}
    />
  );
}

export function PantryDonorNewEngineClientPage() {
  return <PantryDonorDetailEngineClientPage mode="create" />;
}

export function PantryDonorEditEngineClientPage() {
  return <PantryDonorDetailEngineClientPage mode="edit" />;
}
