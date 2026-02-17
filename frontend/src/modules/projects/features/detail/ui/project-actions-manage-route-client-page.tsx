"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getProject, type ApiProject } from "@/modules/projects/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { ProjectActionsCard } from "./project-actions-card";

export function ProjectActionsManageRouteClientPage() {
  const params = useParams();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const canReadProject = permissions.includes("projects.read");
  const canReadActions = permissions.includes("actions.read");
  const canCreateActions = permissions.includes("actions.create");
  const canUpdateActions = permissions.includes("actions.update");
  const canDeleteActions = permissions.includes("actions.delete");
  const canReadStructure = permissions.includes("project-structure.read");
  const canReadPeople = permissions.includes("people.read");
  const canReadPeopleIdentity = permissions.includes("people.identity.read");

  const [project, setProject] = React.useState<ApiProject | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    if (!id || !token || !isAuthenticated || !canReadProject) return;
    setLoading(true);
    setError(null);
    getProject(token, id)
      .then((data) => setProject(data))
      .catch((err) => {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao carregar projeto.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [params, token, isAuthenticated, canReadProject]);

  if (authLoading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">Carregando...</div>
    );
  }

  if (!token || !isAuthenticated) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Redirecionando...
      </div>
    );
  }

  if (!canReadProject || !canReadActions) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar Ações.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Carregando projeto...
      </div>
    );
  }

  if (error) {
    return <div className="px-4 py-6 text-sm text-destructive">{error}</div>;
  }

  if (!project) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Projeto não encontrado.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title={`Projeto • ${project.name} • Ações`}
        items={[
          { label: "Projetos", href: withTenantPath("/projects", tenantSlug) },
          {
            label: project.name,
            href: withTenantPath(`/projects/${project.id}`, tenantSlug),
          },
          {
            label: "Ações",
            href: withTenantPath(`/projects/${project.id}/actions`, tenantSlug),
          },
        ]}
        actionSlot={
          <Button asChild variant="secondary">
            <Link href={withTenantPath(`/projects/${project.id}`, tenantSlug)}>
              <ArrowLeft className="mr-2 size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <ProjectActionsCard
        token={token}
        projectId={project.id}
        canRead={canReadActions}
        canCreate={canCreateActions}
        canUpdate={canUpdateActions}
        canDelete={canDeleteActions}
        canReadStructure={canReadStructure}
        canReadPeople={canReadPeople}
        canReadPeopleIdentity={canReadPeopleIdentity}
      />
    </div>
  );
}
