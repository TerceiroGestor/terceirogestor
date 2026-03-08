"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { getWindowAction } from "@/web-client/registry";
import { hasPermissionRequirement } from "@/web-client/registry/module-utils";
import { resolveWindowActionPermissionRequirement } from "@/web-client/registry/window-actions";

export function ScreenHost({ actionId }: { actionId: string }) {
  const { isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const action = React.useMemo(() => getWindowAction(actionId), [actionId]);

  if (!action) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Ação não encontrada: <span className="font-mono">{actionId}</span>
      </div>
    );
  }

  if (authLoading || userLoading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const requiredPermission = resolveWindowActionPermissionRequirement(action);
  const canRead = hasPermissionRequirement(
    requiredPermission,
    permissions,
    true,
  );

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  const shouldRenderBreadcrumb =
    !action.hideBreadcrumb && action.moduleDefinition?.defaultView !== "detail";

  return (
    <>
      {shouldRenderBreadcrumb ? (
        <PageBreadcrumb
          title={action.title}
          items={action.breadcrumbs}
          actionSlot={action.actionSlot}
        />
      ) : null}
      {action.render()}
    </>
  );
}
