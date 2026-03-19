"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  ACTIONS_ROUTES,
  actionsDetailModuleDefinition,
} from "@/modules/actions/config/actions-module-contract";
import { ActionManageRouteClientPage } from "@/modules/actions/features/manage/ui/action-manage-route-client-page";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { hasModulePermission } from "@/web-client/registry/module-utils";

export function ActionDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const id = params?.id ? String(params.id) : "";
  const projectId = searchParams.get("projectId") ?? "";

  const canRead = hasModulePermission(actionsDetailModuleDefinition, "canRead", permissions);

  if (!authLoading && !userLoading && !token) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Redirecionando...</div>;
  }

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Voce nao tem acesso a Acoes.</div>;
  }

  return (
    <DetailShellEngine
      moduleDefinition={actionsDetailModuleDefinition}
      context={{}}
      mode="edit"
      headerTitle="Acao"
      breadcrumbTitle="Acao"
      breadcrumbItems={[
        { label: "Acoes", href: withTenantPath(ACTIONS_ROUTES.list, tenantSlug) },
        { label: id || "Acao" },
      ]}
      saving={false}
      loading={authLoading || userLoading}
      readOnly
      onClose={() => router.push(withTenantPath(ACTIONS_ROUTES.list, tenantSlug))}
      fallbackMainSlot={<ActionManageRouteClientPage embedded projectIdOverride={projectId} />}
    />
  );
}
