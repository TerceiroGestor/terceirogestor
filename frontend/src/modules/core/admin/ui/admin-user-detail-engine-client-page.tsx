"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { listRoles } from "@/features/admin/api";
import { uploadAvatar } from "@/features/uploads/api";
import { stripApiUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import { resetAdminUserMfa } from "@/web-client/data-provider/rest/admin";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";
import { adminUserDetailModuleDefinition } from "@/modules/core/admin/config/admin-module-contract";
import type { AdminUserDetailLayoutContext } from "@/modules/core/admin/config/admin-detail-layouts";
import type {
  AdminUserFormDraft,
  AdminUserRecord,
  AdminUserRoleOption,
} from "@/modules/core/admin/admin.types";
import { ADMIN_ROUTES } from "@/modules/core/admin/admin.constants";

function buildUserDraft(record: AdminUserRecord): AdminUserFormDraft {
  return {
    name: record.name ?? "",
    email: record.email,
    password: "",
    isActive: record.isActive,
    roleIds: record.roleIds ?? [],
    avatarUrl: record.avatarUrl ?? null,
  };
}

function normalizeUserDraft(draft: AdminUserFormDraft): AdminUserFormDraft {
  return {
    name: draft.name.trim(),
    email: draft.email.trim(),
    password: draft.password.trim(),
    isActive: draft.isActive,
    roleIds: Array.from(new Set(draft.roleIds.map((entry) => entry.trim()).filter(Boolean))),
    avatarUrl:
      draft.avatarUrl instanceof File
        ? draft.avatarUrl
        : typeof draft.avatarUrl === "string"
          ? draft.avatarUrl.trim()
          : null,
  };
}

function mapRoleOption(role: Awaited<ReturnType<typeof listRoles>>[number]): AdminUserRoleOption {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? null,
  };
}

export function AdminUserDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const id = params?.id ? String(params.id) : "";

  const canRead = hasModulePermission(adminUserDetailModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(adminUserDetailModuleDefinition, "create", permissions);
  const canEdit = canUseModuleAction(adminUserDetailModuleDefinition, "edit", permissions);
  const canDelete = canUseModuleAction(adminUserDetailModuleDefinition, "delete", permissions);
  const canAudit = canUseModuleAction(adminUserDetailModuleDefinition, "audit", permissions);

  const [user, setUser] = React.useState<AdminUserRecord | null>(null);
  const [draft, setDraft] = React.useState<AdminUserFormDraft | null>(null);
  const [roleOptions, setRoleOptions] = React.useState<AdminUserRoleOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [resettingMfa, setResettingMfa] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

  const persistDraft = React.useCallback(
    async (nextDraft: AdminUserFormDraft) => {
      if (!user || !canEdit || !token) {
        return nextDraft;
      }

      const normalized = normalizeUserDraft(nextDraft);
      let avatarUrl: string | undefined;

      if (normalized.avatarUrl instanceof File) {
        avatarUrl = (await uploadAvatar(token, normalized.avatarUrl)).path;
      } else if (typeof normalized.avatarUrl === "string") {
        avatarUrl = normalized.avatarUrl ? stripApiUrl(normalized.avatarUrl) : "";
      } else if (normalized.avatarUrl === null) {
        avatarUrl = "";
      }

      const updated = await dataProvider.update<AdminUserRecord>(
        adminUserDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "admin.users",
        user.id,
        {
          name: normalized.name,
          email: normalized.email,
          password: normalized.password || undefined,
          isActive: normalized.isActive,
          roleIds: normalized.roleIds,
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        },
      );
      const savedDraft = buildUserDraft(updated);
      setUser(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [canEdit, dataProvider, token, user],
  );

  const autoSave = useDetailAutoSaveController<AdminUserFormDraft>({
    draft,
    enabled: Boolean(user) && canEdit && Boolean(token),
    config: getModuleDetailEditingConfig(adminUserDetailModuleDefinition),
    normalizeDraft: normalizeUserDraft,
    onSave: persistDraft,
    onError: (nextError) => {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao salvar usuario.";
      setError(message);
      toast({ variant: "destructive", title: "Falha ao salvar", description: message });
    },
  });
  const { saving, replaceSavedDraft, commitField, commitDraft } = autoSave;

  React.useEffect(() => {
    if (authLoading || userLoading) {
      setLoading(true);
      return;
    }
    if (!token || !canRead || !id) {
      setUser(null);
      setDraft(null);
      setRoleOptions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void Promise.all([
      dataProvider.read<AdminUserRecord>(
        adminUserDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "admin.users",
        id,
      ),
      listRoles(token),
    ])
      .then(([userRecord, roles]) => {
        if (cancelled) return;
        const nextDraft = buildUserDraft(userRecord);
        setUser(userRecord);
        setDraft(nextDraft);
        setRoleOptions(roles.map(mapRoleOption));
        replaceSavedDraft(nextDraft);
      })
      .catch((nextError) => {
        const message =
          nextError && typeof nextError === "object" && "message" in nextError
            ? String((nextError as { message?: string }).message)
            : "Falha ao carregar usuario.";
        if (!cancelled) {
          setUser(null);
          setDraft(null);
          setRoleOptions([]);
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, canRead, dataProvider, id, replaceSavedDraft, token, userLoading]);

  const handleDelete = React.useCallback(async () => {
    if (!user || !canDelete) return;
    if (!window.confirm(`Excluir o usuario ${user.name ?? user.email}?`)) return;

    setDeleting(true);
    setError(null);

    try {
      await dataProvider.delete(
        adminUserDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "admin.users",
        user.id,
      );
      toast({ title: "Usuario excluido" });
      router.push(withTenantPath(ADMIN_ROUTES.users, tenantSlug));
    } catch (nextError) {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao excluir usuario.";
      setError(message);
      toast({ variant: "destructive", title: "Falha ao excluir", description: message });
    } finally {
      setDeleting(false);
    }
  }, [canDelete, dataProvider, router, tenantSlug, toast, user]);

  const handleResetMfa = React.useCallback(async () => {
    if (!user || !token || !canEdit || !user.mfaTotpEnabled) return;
    if (!window.confirm(`Resetar o MFA do usuario ${user.name?.trim() || user.email}?`)) return;

    setResettingMfa(true);
    setError(null);

    try {
      const updated = await resetAdminUserMfa(token, user.id);
      const nextDraft = buildUserDraft(updated);
      setUser(updated);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
      toast({ title: "MFA resetado" });
    } catch (nextError) {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao resetar MFA.";
      setError(message);
      toast({ variant: "destructive", title: "Falha ao resetar MFA", description: message });
    } finally {
      setResettingMfa(false);
    }
  }, [canEdit, replaceSavedDraft, toast, token, user]);

  const handleAvatarUpdate = React.useCallback(
    async (file: File | null) => {
      if (!user || !canEdit || !token) {
        return;
      }

      setAvatarUploading(true);
      setError(null);

      try {
        const avatarUrl = file ? (await uploadAvatar(token, file)).path : "";
        const updated = await dataProvider.update<AdminUserRecord>(
          adminUserDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "admin.users",
          user.id,
          { avatarUrl },
        );
        const nextDraft = buildUserDraft(updated);
        setUser(updated);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      } catch (nextError) {
        const message =
          nextError && typeof nextError === "object" && "message" in nextError
            ? String((nextError as { message?: string }).message)
            : "Falha ao atualizar foto.";
        setError(message);
        toast({ variant: "destructive", title: "Falha ao atualizar foto", description: message });
      } finally {
        setAvatarUploading(false);
      }
    },
    [canEdit, dataProvider, replaceSavedDraft, toast, token, user],
  );

  const handleDraftChange = React.useCallback<
    React.Dispatch<React.SetStateAction<AdminUserFormDraft>>
  >((next) => {
    setDraft((previous) =>
      previous
        ? typeof next === "function"
          ? (next as (prevState: AdminUserFormDraft) => AdminUserFormDraft)(previous)
          : next
        : previous,
    );
  }, []);

  if (!canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Voce nao tem permissao para acessar esta area.</div>;
  }

  if (loading) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Carregando usuario...</div>;
  }

  if (error && (!user || !draft)) {
    return <div className="px-4 py-6 text-sm text-destructive">{error}</div>;
  }

  if (!user || !draft) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Usuario nao encontrado.</div>;
  }

  const context: AdminUserDetailLayoutContext = {
    user,
    draft,
    roleOptions,
    canEdit,
    canAudit,
    avatarUploading,
    resettingMfa,
    auditVisibleCount,
    onAuditVisibleCountChange: setAuditVisibleCount,
    onDraftChange: handleDraftChange,
    onResetMfa: handleResetMfa,
    onAvatarFileSelect: (file) => handleAvatarUpdate(file),
    onCommitField: commitField,
    onCommitDraft: commitDraft,
  };

  return (
    <>
      {error ? <div className="px-4 pt-4 text-sm text-destructive">{error}</div> : null}

      <DetailShellEngine<AdminUserDetailLayoutContext>
        moduleDefinition={adminUserDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={canAudit}
        mode="edit"
        headerTitle={user.name?.trim() || user.email}
        saving={saving || avatarUploading}
        readOnly={!canEdit}
        onClose={() => router.push(withTenantPath(ADMIN_ROUTES.users, tenantSlug))}
        breadcrumbTitle={user.name?.trim() || user.email}
        breadcrumbItems={[
          { label: "Geral", href: ADMIN_ROUTES.overview },
          { label: "Usuarios", href: ADMIN_ROUTES.users },
          { label: user.name?.trim() || user.email },
        ]}
        headerActionsSlot={
          <div className="flex items-center gap-2">
            {canCreate ? (
              <Button variant="outline" size="sm" onClick={() => router.push(withTenantPath(ADMIN_ROUTES.usersNew, tenantSlug))}>
                Novo usuario
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="ghost" size="sm" onClick={() => void handleDelete()} disabled={saving || deleting}>
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>
            ) : null}
          </div>
        }
      />
    </>
  );
}
