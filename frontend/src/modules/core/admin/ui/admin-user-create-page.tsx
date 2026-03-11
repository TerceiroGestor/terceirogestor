"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { listRoles } from "@/features/admin/api";
import { uploadAvatar } from "@/features/uploads/api";
import { stripApiUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { canUseModuleAction } from "@/web-client/registry/module-utils";
import { adminUserDetailModuleDefinition } from "@/modules/core/admin/config/admin-module-contract";
import type { AdminUserDetailLayoutContext } from "@/modules/core/admin/config/admin-detail-layouts";
import type { AdminUserFormDraft, AdminUserRecord, AdminUserRoleOption } from "@/modules/core/admin/admin.types";
import { ADMIN_ROUTES } from "@/modules/core/admin/admin.constants";

function buildDraftUserRecord(draft: AdminUserFormDraft): AdminUserRecord {
  return {
    id: "draft-user",
    name: draft.name || "Novo usuario",
    email: draft.email || "",
    avatarUrl:
      typeof draft.avatarUrl === "string" && draft.avatarUrl.trim() ? draft.avatarUrl : null,
    isActive: draft.isActive,
    roles: [],
    roleIds: draft.roleIds,
    roleNames: [],
    mfaTotpEnabled: false,
    phone: null,
    bio: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mapRoleOption(role: Awaited<ReturnType<typeof listRoles>>[number]): AdminUserRoleOption {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? null,
  };
}

export function AdminUserCreatePage() {
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const canCreate = canUseModuleAction(adminUserDetailModuleDefinition, "create", permissions);

  const [draft, setDraft] = React.useState<AdminUserFormDraft>({
    name: "",
    email: "",
    password: "",
    isActive: true,
    roleIds: [],
    avatarUrl: null,
  });
  const [roleOptions, setRoleOptions] = React.useState<AdminUserRoleOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading || userLoading) {
      setLoading(true);
      return;
    }
    if (!token || !canCreate) {
      setRoleOptions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void listRoles(token)
      .then((roles) => {
        if (!cancelled) {
          setRoleOptions(roles.map(mapRoleOption));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoleOptions([]);
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
  }, [authLoading, canCreate, token, userLoading]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    if (!token) {
      setError("Sessao invalida.");
      return;
    }
    if (!draft.name.trim() || !draft.email.trim() || !draft.password.trim()) {
      setError("Informe nome, email e senha.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let avatarUrl: string | undefined;

      if (draft.avatarUrl instanceof File) {
        avatarUrl = (await uploadAvatar(token, draft.avatarUrl)).path;
      } else if (typeof draft.avatarUrl === "string") {
        avatarUrl = draft.avatarUrl ? stripApiUrl(draft.avatarUrl) : "";
      } else if (draft.avatarUrl === null) {
        avatarUrl = "";
      }

      const created = await dataProvider.create<AdminUserRecord>(
        adminUserDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "admin.users",
        {
          name: draft.name.trim(),
          email: draft.email.trim(),
          password: draft.password.trim(),
          isActive: draft.isActive,
          roleIds: draft.roleIds,
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        },
      );
      toast({ title: "Usuario criado" });
      router.push(withTenantPath(`${ADMIN_ROUTES.users}/${created.id}`, tenantSlug));
    } catch (nextError) {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao criar usuario.";
      setError(message);
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setSaving(false);
    }
  }, [canCreate, dataProvider, draft, router, tenantSlug, toast, token]);

  if (authLoading || userLoading || loading) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Carregando usuario...</div>;
  }

  if (!canCreate) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Voce nao tem permissao para criar usuarios.</div>;
  }

  const context: AdminUserDetailLayoutContext = {
    user: buildDraftUserRecord(draft),
    draft,
    roleOptions,
    canEdit: true,
    canAudit: false,
    isCreate: true,
    auditVisibleCount: 0,
    onAuditVisibleCountChange: () => undefined,
    onDraftChange: setDraft,
    onAvatarFileSelect: (file) =>
      setDraft((previous) => ({ ...previous, avatarUrl: file })),
  };

  return (
    <>
      {error ? <div className="px-4 pt-4 text-sm text-destructive">{error}</div> : null}

      <DetailShellEngine<AdminUserDetailLayoutContext>
        moduleDefinition={adminUserDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={false}
        mode="create"
        headerTitle={draft.name.trim() || "Novo usuario"}
        saving={saving}
        readOnly={false}
        onSave={() => void handleCreate()}
        onClose={() => router.push(withTenantPath(ADMIN_ROUTES.users, tenantSlug))}
        breadcrumbTitle="Novo usuario"
        breadcrumbItems={[
          { label: "Geral", href: ADMIN_ROUTES.overview },
          { label: "Usuarios", href: ADMIN_ROUTES.users },
          { label: "Novo usuario" },
        ]}
      />
    </>
  );
}
