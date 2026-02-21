"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { SectionCard } from "@/components/section-card";
import { FormEngine } from "@/components/FormEngine/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { useRegisterUsageDocumentation } from "@/components/UsageDocumentation/UsageDocumentationProvider";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { listProjects, type ApiProject } from "@/modules/projects/api";
import {
  listProjectCycles,
  listProjectGroups,
  type ApiProjectCycle,
  type ApiProjectGroup,
} from "@/modules/projects/api";
import {
  createProjectAction,
  listActionTypes,
  type ApiActionType,
} from "@/modules/actions/api";
import { ACTION_STATUS_OPTIONS } from "@/modules/actions/shared/domain/actions.constants";
import { ACTION_CREATE_TEXT } from "../config/action-create.constants";

const NONE_VALUE = "__none__";

type ActionCreateValues = {
  projectId: string;
  actionTypeId: string;
  title: string;
  status: string;
  groupId: string;
  cycleId: string;
  plannedStartAt: string;
  plannedEndAt: string;
  planHtml: string;
};

export function ActionCreateRouteClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const params = useSearchParams();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  const canCreate = permissions.includes("actions.create");

  const initialProjectId = params.get("projectId") ?? NONE_VALUE;

  const [projects, setProjects] = React.useState<ApiProject[]>([]);
  const [actionTypes, setActionTypes] = React.useState<ApiActionType[]>([]);
  const [groups, setGroups] = React.useState<ApiProjectGroup[]>([]);
  const [cycles, setCycles] = React.useState<ApiProjectCycle[]>([]);
  const [saving, setSaving] = React.useState(false);

  const [draft, setDraft] = React.useState<ActionCreateValues | null>(null);

  const actionTypesById = React.useMemo(() => {
    return new Map(actionTypes.map((t) => [t.id, t]));
  }, [actionTypes]);

  const currentProjectId = draft?.projectId ?? initialProjectId;
  const selectedType = actionTypesById.get(draft?.actionTypeId ?? "") ?? null;

  React.useEffect(() => {
    if (!token || !isAuthenticated || authLoading || !canCreate) return;
    (async () => {
      try {
        const [projectsResponse, types] = await Promise.all([
          listProjects(token, { all: true, limit: 200 }),
          listActionTypes(token, { isActive: true }),
        ]);
        setProjects(projectsResponse.data ?? []);
        setActionTypes(types ?? []);
      } catch (err) {
        toast({
          title: ACTION_CREATE_TEXT.loadErrorTitle,
          description:
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: string }).message)
              : ACTION_CREATE_TEXT.loadErrorFallback,
          variant: "destructive",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, authLoading, canCreate]);

  React.useEffect(() => {
    if (!token || !canCreate) return;
    if (!currentProjectId || currentProjectId === NONE_VALUE) {
      setGroups([]);
      setCycles([]);
      return;
    }
    (async () => {
      try {
        const [projectGroups, projectCycles] = await Promise.all([
          listProjectGroups(token, currentProjectId),
          listProjectCycles(token, currentProjectId),
        ]);
        setGroups(projectGroups);
        setCycles(projectCycles);
      } catch {
        setGroups([]);
        setCycles([]);
      }
    })();
  }, [token, canCreate, currentProjectId]);

  const defaultProjectId =
    initialProjectId !== NONE_VALUE
      ? initialProjectId
      : projects.length === 1
        ? projects[0]?.id ?? NONE_VALUE
        : NONE_VALUE;

  const initialValues = React.useMemo<Partial<ActionCreateValues>>(
    () => ({
      projectId: defaultProjectId,
      actionTypeId: actionTypes[0]?.id ?? NONE_VALUE,
      title: "",
      status: "PLANNED",
      groupId: NONE_VALUE,
      cycleId: NONE_VALUE,
      plannedStartAt: "",
      plannedEndAt: "",
      planHtml: "",
    }),
    [defaultProjectId, actionTypes],
  );

  const fields = React.useMemo<FormField<ActionCreateValues>[]>(() => {
    const projectOptions = [
      { label: ACTION_CREATE_TEXT.form.projectPlaceholder, value: NONE_VALUE },
      ...projects.map((p) => ({ label: p.name, value: p.id })),
    ];

    const actionTypeOptions = [
      { label: ACTION_CREATE_TEXT.form.typePlaceholder, value: NONE_VALUE },
      ...actionTypes.map((t) => ({ label: t.name, value: t.id })),
    ];

    const groupOptions = [
      { label: ACTION_CREATE_TEXT.form.groupPlaceholder, value: NONE_VALUE },
      ...groups.map((g) => ({ label: g.name, value: g.id })),
    ];

    const cycleOptions = [
      { label: ACTION_CREATE_TEXT.form.cyclePlaceholder, value: NONE_VALUE },
      ...cycles.map((c) => ({ label: c.name, value: c.id })),
    ];

    return [
      {
        name: "projectId",
        label: ACTION_CREATE_TEXT.form.projectLabel,
        type: "select",
        options: projectOptions,
        required: true,
      },
      {
        name: "title",
        label: ACTION_CREATE_TEXT.form.titleLabel,
        type: "text",
        placeholder: ACTION_CREATE_TEXT.form.titlePlaceholder,
        required: true,
      },
      {
        name: "actionTypeId",
        label: ACTION_CREATE_TEXT.form.typeLabel,
        type: "select",
        options: actionTypeOptions,
        required: true,
      },
      {
        name: "status",
        label: ACTION_CREATE_TEXT.form.statusLabel,
        type: "select",
        options: ACTION_STATUS_OPTIONS,
        required: true,
      },
      {
        name: "groupId",
        label: ACTION_CREATE_TEXT.form.groupLabel,
        type: "select",
        options: groupOptions,
        disabled: selectedType?.target !== "GROUP",
        helperText:
          selectedType && selectedType.target !== "GROUP"
            ? "Disponível apenas para ações do tipo Grupo."
            : undefined,
      },
      {
        name: "cycleId",
        label: ACTION_CREATE_TEXT.form.cycleLabel,
        type: "select",
        options: cycleOptions,
        disabled: selectedType?.target !== "CYCLE",
        helperText:
          selectedType && selectedType.target !== "CYCLE"
            ? "Disponível apenas para ações do tipo Ciclo."
            : undefined,
      },
      {
        name: "plannedStartAt",
        label: ACTION_CREATE_TEXT.form.plannedStartLabel,
        type: "date",
      },
      {
        name: "plannedEndAt",
        label: ACTION_CREATE_TEXT.form.plannedEndLabel,
        type: "date",
      },
      {
        name: "planHtml",
        label: ACTION_CREATE_TEXT.form.planLabel,
        type: "richtext",
        helperText: ACTION_CREATE_TEXT.form.planHelper,
      },
    ];
  }, [projects, actionTypes, groups, cycles, selectedType]);

  const handleSubmit = async (values: ActionCreateValues) => {
    if (!token) return;

    if (!values.projectId || values.projectId === NONE_VALUE) {
      toast({
        title: ACTION_CREATE_TEXT.validations.projectRequired,
        variant: "destructive",
      });
      return;
    }

    if (!values.actionTypeId || values.actionTypeId === NONE_VALUE) {
      toast({
        title: ACTION_CREATE_TEXT.validations.typeRequired,
        variant: "destructive",
      });
      return;
    }

    const resolvedType = actionTypesById.get(values.actionTypeId) ?? null;
    if (!resolvedType) {
      toast({
        title: ACTION_CREATE_TEXT.validations.typeRequired,
        variant: "destructive",
      });
      return;
    }

    const title = values.title?.trim() ?? "";
    if (!title) {
      toast({
        title: ACTION_CREATE_TEXT.validations.titleRequired,
        variant: "destructive",
      });
      return;
    }

    if (resolvedType.target === "GROUP" && values.groupId === NONE_VALUE) {
      toast({
        title: ACTION_CREATE_TEXT.validations.groupRequired,
        variant: "destructive",
      });
      return;
    }

    if (resolvedType.target === "CYCLE" && values.cycleId === NONE_VALUE) {
      toast({
        title: ACTION_CREATE_TEXT.validations.cycleRequired,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const created = await createProjectAction(token, values.projectId, {
        actionTypeId: values.actionTypeId,
        title,
        status: values.status as any,
        groupId:
          resolvedType.target === "GROUP" && values.groupId !== NONE_VALUE
            ? values.groupId
            : null,
        cycleId:
          resolvedType.target === "CYCLE" && values.cycleId !== NONE_VALUE
            ? values.cycleId
            : null,
        plannedStartAt: values.plannedStartAt?.trim()
          ? values.plannedStartAt.trim()
          : null,
        plannedEndAt: values.plannedEndAt?.trim()
          ? values.plannedEndAt.trim()
          : null,
        planHtml: values.planHtml?.trim() ? values.planHtml : null,
      });

      toast({ title: ACTION_CREATE_TEXT.toasts.created });
      const href = withTenantPath(`/actions/${created.id}`, tenantSlug);
      const qs = new URLSearchParams();
      qs.set("projectId", values.projectId);
      router.push(`${href}?${qs.toString()}`);
    } catch (err) {
      toast({
        title: ACTION_CREATE_TEXT.toasts.createFailed,
        description:
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : ACTION_CREATE_TEXT.loadErrorFallback,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const usageItems = React.useMemo(
    () =>
      ACTION_CREATE_TEXT.usage.sections.map((section, index) => ({
        id: `actions-create-${index}`,
        title: section.title,
        searchText: section.items.join(" "),
        content: (
          <ul className="list-disc space-y-1 pl-5">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ),
      })),
    [],
  );

  useRegisterUsageDocumentation({
    title: ACTION_CREATE_TEXT.usage.title,
    items: usageItems,
  });

  const breadcrumbItems = React.useMemo(
    () => ACTION_CREATE_TEXT.breadcrumbItems.map((item) => ({ ...item })),
    [],
  );

  if (!isAuthenticated || authLoading) return null;

  if (!canCreate) {
    return (
      <SectionCard
        title={ACTION_CREATE_TEXT.noAccessTitle}
        subtitle={ACTION_CREATE_TEXT.noAccessSubtitle}
      >
        <p className="text-xs text-muted-foreground">
          {ACTION_CREATE_TEXT.requestAccessHint}
        </p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        title={ACTION_CREATE_TEXT.breadcrumbTitle}
        items={breadcrumbItems}
      />

      <SectionCard title={ACTION_CREATE_TEXT.pageTitle} subtitle={ACTION_CREATE_TEXT.pageSubtitle}>
        <FormEngine<ActionCreateValues>
          fields={fields}
          steps={ACTION_CREATE_TEXT.steps}
          initialValues={initialValues}
          onValuesChange={setDraft}
          onSubmit={handleSubmit}
          disabled={saving}
          actions={{
            submit: {
              label: saving ? "Salvando..." : ACTION_CREATE_TEXT.form.submitLabel,
              variant: "primary",
            },
            cancel: {
              label: ACTION_CREATE_TEXT.form.cancelLabel,
              variant: "ghost",
              onClick: () => router.push(withTenantPath("/actions", tenantSlug)),
            },
          }}
        />
      </SectionCard>

    </div>
  );
}
