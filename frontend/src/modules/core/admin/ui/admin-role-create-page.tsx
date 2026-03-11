"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { listPermissions } from "@/features/admin/api";
import { splitPermissionKey } from "@/features/admin/config/rbac.constants";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { canUseModuleAction } from "@/web-client/registry/module-utils";
import { adminRoleDetailModuleDefinition } from "@/modules/core/admin/config/admin-module-contract";
import type { AdminRoleDetailLayoutContext } from "@/modules/core/admin/config/admin-detail-layouts";
import type { AdminPermissionRecord, AdminRoleFormDraft, AdminRoleRecord } from "@/modules/core/admin/admin.types";
import { ADMIN_ROUTES } from "@/modules/core/admin/admin.constants";

function buildDraftRoleRecord(draft: AdminRoleFormDraft): AdminRoleRecord {
  return {
    id: "draft-role",
    name: draft.name || "Novo perfil",
    description: draft.description || null,
    permissions: [],
    permissionKeys: draft.permissionKeys,
    modules: [],
    moduleKeys: [],
    permissionCount: draft.permissionKeys.length,
    moduleCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mapPermissionRecord(
  permission: Awaited<ReturnType<typeof listPermissions>>[number],
): AdminPermissionRecord {
  const parsed = splitPermissionKey(permission.key);
  return {
    ...permission,
    moduleKey: parsed?.moduleKey ?? "outros",
    moduleLabel: parsed?.moduleKey ?? "outros",
    action: parsed?.action ?? "read",
  };
}

export function AdminRoleCreatePage() {
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const canCreate = canUseModuleAction(adminRoleDetailModuleDefinition, "create", permissions);

  const [draft, setDraft] = React.useState<AdminRoleFormDraft>({
    name: "",
    description: "",
    permissionKeys: [],
  });
  const [permissionOptions, setPermissionOptions] = React.useState<AdminRoleDetailLayoutContext["permissionOptions"]>([]);
  const [permissionRecords, setPermissionRecords] = React.useState<AdminPermissionRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading || userLoading) {
      setLoading(true);
      return;
    }
    if (!token || !canCreate) {
      setPermissionOptions([]);
      setPermissionRecords([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void listPermissions(token)
      .then((permissionsList) => {
        if (!cancelled) {
          setPermissionOptions(permissionsList);
          setPermissionRecords(permissionsList.map(mapPermissionRecord));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPermissionOptions([]);
          setPermissionRecords([]);
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

  const selectedPermissionRecords = React.useMemo(
    () => permissionRecords.filter((permission) => draft.permissionKeys.includes(permission.key)),
    [draft.permissionKeys, permissionRecords],
  );

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    if (!draft.name.trim()) {
      setError("Informe o nome do perfil.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await dataProvider.create<AdminRoleRecord>(
        adminRoleDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "admin.roles",
        {
          name: draft.name.trim(),
          description: draft.description.trim() || undefined,
          permissionKeys: draft.permissionKeys,
        },
      );
      toast({ title: "Perfil criado" });
      router.push(withTenantPath(`${ADMIN_ROUTES.roles}/${created.id}`, tenantSlug));
    } catch (nextError) {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao criar perfil.";
      setError(message);
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setSaving(false);
    }
  }, [canCreate, dataProvider, draft, router, tenantSlug, toast]);

  if (authLoading || userLoading || loading) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Carregando perfil...</div>;
  }

  if (!canCreate) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Voce nao tem permissao para criar perfis.</div>;
  }

  const context: AdminRoleDetailLayoutContext = {
    role: buildDraftRoleRecord(draft),
    draft,
    permissionOptions,
    selectedPermissionRecords,
    canEdit: true,
    canAudit: false,
    isCreate: true,
    auditVisibleCount: 0,
    onAuditVisibleCountChange: () => undefined,
    onDraftChange: setDraft,
  };

  return (
    <>
      {error ? <div className="px-4 pt-4 text-sm text-destructive">{error}</div> : null}

      <DetailShellEngine<AdminRoleDetailLayoutContext>
        moduleDefinition={adminRoleDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={false}
        mode="create"
        headerTitle={draft.name.trim() || "Novo perfil"}
        saving={saving}
        readOnly={false}
        onSave={() => void handleCreate()}
        onClose={() => router.push(withTenantPath(ADMIN_ROUTES.roles, tenantSlug))}
        breadcrumbTitle="Novo perfil"
        breadcrumbItems={[
          { label: "Geral", href: ADMIN_ROUTES.overview },
          { label: "Perfis", href: ADMIN_ROUTES.roles },
          { label: "Novo perfil" },
        ]}
      />
    </>
  );
}
