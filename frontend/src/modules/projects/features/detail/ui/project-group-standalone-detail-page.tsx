"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { usePathname } from "next/navigation";
import { listAllProjectGroups } from "@/modules/projects/api";
import { ProjectGroupsManageRouteClientPage } from "@/modules/projects/features/detail/ui/project-groups-manage-route-client-page";

export function ProjectGroupStandaloneDetailPage() {
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const { token } = useAuth();
  const { toast } = useToast();

  const groupId = params?.id ? String(params.id) : "";
  const [projectId, setProjectId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token || !groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    listAllProjectGroups(token, { all: true })
      .then((response) => {
        const group = response.data.find((item) => item.id === groupId);
        if (!group?.projectId) {
          throw new Error("Grupo nao encontrado.");
        }
        setProjectId(group.projectId);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao localizar grupo.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [groupId, toast, token]);

  if (loading) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Carregando grupo...</div>;
  }

  if (!projectId || !groupId) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Grupo nao encontrado.</div>;
  }

  return (
    <ProjectGroupsManageRouteClientPage
      forcedProjectId={projectId}
      forcedGroupId={groupId}
      returnToOverride={withTenantPath("/group", tenantSlug)}
    />
  );
}
