"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DetailShell } from "@/components/layout/DetailShell";
import { DetailNotesPanel } from "@/web-client/detail/DetailNotesPanel";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { ModuleEmptyState } from "@/web-client/ui/ModulePrimitives";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { withTenantPath } from "@/lib/tenant-path";
import {
  createProjectGroup,
  listProjects,
  type ApiProject,
} from "@/modules/projects/api";

type StandaloneGroupDraft = {
  projectId: string;
  name: string;
  description: string;
  internalNotes: string | null;
};

export function ProjectGroupsCreateStandalonePage({
  tenantSlug,
}: {
  tenantSlug: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();

  const canCreate = permissions.includes("project-structure.create");
  const canReadProjects = permissions.includes("projects.read");

  const [projects, setProjects] = React.useState<ApiProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState<StandaloneGroupDraft>({
    projectId: searchParams.get("projectId") ?? "",
    name: "",
    description: "",
    internalNotes: null,
  });

  React.useEffect(() => {
    if (!token || !canReadProjects) {
      setLoading(false);
      setProjects([]);
      return;
    }

    setLoading(true);
    listProjects(token, { all: true })
      .then((response) => {
        setProjects(response.data ?? []);
      })
      .catch(() => {
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, [canReadProjects, token]);

  const handleSave = React.useCallback(async () => {
    if (!token || !canCreate) return;

    const projectId = draft.projectId.trim();
    const name = draft.name.trim();
    const description = draft.description.trim() || null;
    const internalNotes = draft.internalNotes?.trim() || null;

    if (!projectId) {
      toast({
        variant: "destructive",
        title: "Dados invalidos",
        description: "Selecione o projeto do grupo.",
      });
      return;
    }

    if (!name) {
      toast({
        variant: "destructive",
        title: "Dados invalidos",
        description: "Informe o nome do grupo.",
      });
      return;
    }

    setSaving(true);
    try {
      const created = await createProjectGroup(token, projectId, {
        name,
        description,
        internalNotes,
      });

      toast({ title: "Grupo criado" });
      router.replace(
        withTenantPath(
          `/group/${encodeURIComponent(created.id)}?returnTo=${encodeURIComponent("/group")}`,
          tenantSlug,
        ),
      );
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar grupo.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setSaving(false);
    }
  }, [canCreate, draft, router, tenantSlug, toast, token]);

  if (!canCreate) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissao.</div>;
  }

  return (
    <DetailShell
      breadcrumbTitle="Novo grupo"
      breadcrumbItems={[
        { label: "Grupos", href: "/group" },
      ]}
      mode="create"
      headerTitle="Novo grupo"
      saving={saving}
      loading={loading}
      readOnly={false}
      onSave={handleSave}
      onClose={() => router.push(withTenantPath("/group", tenantSlug))}
      headerInfoSlot={
        <div className="border-y border-border/60 bg-transparent px-0 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">Projeto</div>
              <div className="font-medium text-foreground">
                {projects.find((project) => project.id === draft.projectId)?.name ?? "-"}
              </div>
            </div>
          </div>
        </div>
      }
      mainSlot={
        <div className="border-y border-border/60 bg-transparent px-0 py-4">
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Projeto</div>
              <Select
                value={draft.projectId}
                onValueChange={(value) =>
                  setDraft((previous) => ({ ...previous, projectId: value }))
                }
              >
                <SelectTrigger className="h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus:ring-0">
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Nome</div>
              <Input
                value={draft.name}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, name: event.target.value }))
                }
                className="h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0"
                placeholder="Nome do grupo operacional"
              />
            </div>

            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Descricao</div>
              <Textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, description: event.target.value }))
                }
                className="min-h-[180px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0"
                placeholder="Descricao do grupo operacional"
              />
            </div>
          </div>
        </div>
      }
      bottomSlot={
        <ModuleEmptyState
          title="Salve o grupo"
          description="Apos salvar, voce podera gerenciar participantes no detail do grupo."
          compact
        />
      }
      sideSlot={
        <DetailSideTabs
          defaultValue="notes"
          tabs={[
            {
              value: "notes",
              label: "Anotacoes",
              content: (
                <DetailNotesPanel
                  value={draft.internalNotes}
                  onChange={(next) =>
                    setDraft((previous) => ({ ...previous, internalNotes: next }))
                  }
                  onBlur={() => undefined}
                  readOnly={false}
                />
              ),
            },
            {
              value: "context",
              label: "Contexto",
              content: (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                    <span className="text-muted-foreground">Projeto</span>
                    <span className="text-right text-foreground">
                      {projects.find((project) => project.id === draft.projectId)?.name ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Grupo</span>
                    <span className="text-right text-foreground">{draft.name.trim() || "-"}</span>
                  </div>
                </div>
              ),
            },
          ]}
        />
      }
    />
  );
}
