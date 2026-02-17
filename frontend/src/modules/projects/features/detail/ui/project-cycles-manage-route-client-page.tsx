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
import { getProject, type ApiProject, type ApiProjectCycle } from "@/modules/projects/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { ProjectCyclesCard } from "./project-cycles-card";
import { ProjectCycleDetailCard } from "./project-cycle-detail-card";

export function ProjectCyclesManageRouteClientPage() {
  const params = useParams();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const canReadProject = permissions.includes("projects.read");
  const canReadStructure = permissions.includes("project-structure.read");
  const canCreateStructure = permissions.includes("project-structure.create");
  const canUpdateStructure = permissions.includes("project-structure.update");
  const canDeleteStructure = permissions.includes("project-structure.delete");

  const canReadEnrollments = permissions.includes("enrollments.read");
  const canUpdateEnrollments = permissions.includes("enrollments.update");
  const canReadPeople = permissions.includes("people.read");

  const [project, setProject] = React.useState<ApiProject | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [cycles, setCycles] = React.useState<ApiProjectCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = React.useState<string | null>(null);

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

  if (!canReadProject) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar Projetos.
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

  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? null;

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title={`Projeto • ${project.name} • Ciclos`}
        items={[
          { label: "Projetos", href: withTenantPath("/projects", tenantSlug) },
          {
            label: project.name,
            href: withTenantPath(`/projects/${project.id}`, tenantSlug),
          },
          {
            label: "Ciclos",
            href: withTenantPath(`/projects/${project.id}/cycles`, tenantSlug),
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProjectCyclesCard
            token={token}
            projectId={project.id}
            canRead={canReadStructure}
            canCreate={canCreateStructure}
            canUpdate={canUpdateStructure}
            canDelete={canDeleteStructure}
            selectedCycleId={selectedCycleId}
            onSelect={(cycle) => setSelectedCycleId(cycle.id)}
            onLoaded={(rows) => {
              setCycles(rows);
              setSelectedCycleId((prev) => {
                if (prev && rows.some((cycle) => cycle.id === prev)) return prev;
                return rows[0]?.id ?? null;
              });
            }}
          />
        </div>
        <div className="lg:col-span-2">
          <ProjectCycleDetailCard
            token={token}
            projectId={project.id}
            cycle={selectedCycle}
            canReadEnrollments={canReadEnrollments}
            canUpdateEnrollments={canUpdateEnrollments}
            canReadPeople={canReadPeople}
          />
        </div>
      </div>
    </div>
  );
}
