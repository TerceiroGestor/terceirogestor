"use client";

import * as React from "react";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { getWindowAction } from "@/web-client/registry";

export function ScreenHost({ actionId }: { actionId: string }) {
  const { permissions } = useCurrentUser();
  const action = React.useMemo(() => getWindowAction(actionId), [actionId]);

  if (!action) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Ação não encontrada: <span className="font-mono">{actionId}</span>
      </div>
    );
  }

  const required = action.permissions ?? [];
  const canRead =
    required.length === 0 || required.every((permission) => permissions.includes(permission));

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb
        title={action.title}
        items={action.breadcrumbs}
        actionSlot={action.actionSlot}
      />
      {action.render()}
    </>
  );
}
