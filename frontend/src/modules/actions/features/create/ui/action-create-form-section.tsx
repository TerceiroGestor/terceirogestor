"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRegisterUsageDocumentation } from "@/components/UsageDocumentation/UsageDocumentationProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichText } from "@/components/ui/richtext/RichText";
import { useToast } from "@/components/ui/use-toast";
import { MultiSelectBadges } from "@/web-client/ui/MultiSelectBadges";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  createActivity,
  createProjectActionPeopleParticipation,
  endProjectActionPeopleParticipation,
  listActivityTypes,
  listEligibleActivityPeople,
  listProjectActionPeopleParticipations,
  updateActivity,
  type ActionPeopleParticipationRole,
  type ApiActivity,
  type ApiActivityType,
  type ApiProjectActionPeopleParticipation,
  type ActionStatus,
} from "@/modules/actions/api";
import { ACTION_STATUS_OPTIONS } from "@/modules/actions/shared/domain/actions.constants";
import {
  listProjectGoals,
  listProjectPeopleGroups,
  listProjects,
  type ApiGoal,
  type ApiProject,
  type ApiProjectPeopleGroup,
} from "@/modules/projects/api";
import { ACTION_CREATE_TEXT } from "../config/action-create.constants";

const NONE_VALUE = "__none__";
const lineInputClassName =
  "h-10 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0";
const fieldLabelClassName =
  "text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";

type ActionCreateValues = {
  projectId: string;
  actionTypeId: string;
  title: string;
  status: ActionStatus;
  peopleGroupIds: string[];
  goalId: string;
  description: string;
  pedagogicalPlanHtml: string;
  plannedStartAt: string;
  plannedEndAt: string;
};

function SectionField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className={fieldLabelClassName}>{label}</div>
      {children}
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1 border-b border-border/60 pb-2">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function formatPeopleGroupOptionLabel(row: ApiProjectPeopleGroup) {
  const primary = row.peopleGroup?.name ?? "";
  const secondaryParts = [
    row.peopleGroup?.category ?? null,
    row.peopleGroup?.description ?? null,
  ].filter(Boolean);
  return secondaryParts.length ? `${primary} - ${secondaryParts.join(" - ")}` : primary;
}

/**
 * Atalho de 1 pessoa por papel (Gestor = RESPONSAVEL_TECNICO, Educador =
 * FACILITADOR), lendo/gravando em ProjectActionPeopleParticipation - o
 * mesmo cadastro que a aba "Equipe" já usa, sem campo/tabela nova. A
 * pessoa elegível vem do grupo de equipe do Projeto (participationKind
 * "TEAM"), igual ao que a aba Equipe já oferece.
 */
function ActivityRolePicker({
  token,
  projectId,
  actionId,
  role,
  placeholder,
  disabled,
}: {
  token: string;
  projectId: string | undefined;
  actionId: string | undefined;
  role: ActionPeopleParticipationRole;
  placeholder: string;
  disabled?: boolean;
}) {
  const [eligible, setEligible] = React.useState<
    { personId: string; fullName: string; enrollmentId: string | null }[]
  >([]);
  const [current, setCurrent] = React.useState<ApiProjectActionPeopleParticipation | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!token || !projectId || !actionId) return;
    setLoading(true);
    try {
      const [eligibleResponse, participations] = await Promise.all([
        listEligibleActivityPeople(token, projectId, actionId, {
          participationKind: "TEAM",
          limit: 200,
        }),
        listProjectActionPeopleParticipations(token, projectId, actionId, {
          role,
          limit: 1,
        }),
      ]);
      setEligible(
        (eligibleResponse.data ?? []).map((enrollment) => ({
          personId: enrollment.personId,
          fullName: enrollment.person?.fullName ?? enrollment.personId,
          enrollmentId: enrollment.id,
        })),
      );
      setCurrent(participations.data?.[0] ?? null);
    } catch {
      setEligible([]);
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  }, [token, projectId, actionId, role]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleChange = async (personId: string) => {
    if (!token || !projectId || !actionId) return;
    setLoading(true);
    try {
      if (current) {
        await endProjectActionPeopleParticipation(token, projectId, actionId, current.id);
      }
      if (personId !== NONE_VALUE) {
        const picked = eligible.find((item) => item.personId === personId);
        await createProjectActionPeopleParticipation(token, projectId, actionId, {
          personId,
          enrollmentId: picked?.enrollmentId ?? null,
          role,
        });
      }
      await load();
    } finally {
      setLoading(false);
    }
  };

  if (!actionId) {
    return (
      <div className="flex h-10 items-center border-b border-border/60 text-sm text-muted-foreground">
        Disponível após criar a atividade.
      </div>
    );
  }

  const value = current?.personId ?? NONE_VALUE;
  const options =
    current && !eligible.some((item) => item.personId === current.personId)
      ? [
          {
            personId: current.personId,
            fullName: current.person.fullName,
            enrollmentId: current.enrollmentId,
          },
          ...eligible,
        ]
      : eligible;

  return (
    <Select value={value} onValueChange={(next) => void handleChange(next)} disabled={disabled || loading}>
      <SelectTrigger className={lineInputClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.personId} value={option.personId}>
            {option.fullName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type ActionCreateFormSectionProps = {
  mode?: "create" | "edit";
  action?: ApiActivity | null;
  projectId?: string;
  actionId?: string;
  onSaved?: (action: ApiActivity) => void;
  onCancel?: () => void;
};

export function ActionCreateFormSection({
  mode = "create",
  action = null,
  projectId: projectIdProp,
  actionId: actionIdProp,
  onSaved,
  onCancel,
}: ActionCreateFormSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const params = useSearchParams();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  const canCreate = permissions.includes("actions.create");
  const canUpdate = permissions.includes("actions.update");
  const canAccessForm = mode === "edit" ? canUpdate : canCreate;
  const initialProjectId =
    projectIdProp ?? action?.projectId ?? params.get("projectId") ?? NONE_VALUE;

  const [projects, setProjects] = React.useState<ApiProject[]>([]);
  const [actionTypes, setActivityTypes] = React.useState<ApiActivityType[]>([]);
  const [peopleGroups, setPeopleGroups] = React.useState<ApiProjectPeopleGroup[]>([]);
  const [goals, setGoals] = React.useState<ApiGoal[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [values, setValues] = React.useState<ActionCreateValues>({
    projectId: initialProjectId,
    actionTypeId: NONE_VALUE,
    title: "",
    status: "PLANNED",
    peopleGroupIds: [],
    goalId: NONE_VALUE,
    description: "",
    pedagogicalPlanHtml: "",
    plannedStartAt: "",
    plannedEndAt: "",
  });

  const actionTypesById = React.useMemo(
    () => new Map(actionTypes.map((item) => [item.id, item])),
    [actionTypes],
  );

  const selectedType = actionTypesById.get(values.actionTypeId) ?? null;

  React.useEffect(() => {
    if (mode !== "edit" || !action) return;
    setValues({
      projectId: action.projectId ?? NONE_VALUE,
      actionTypeId: action.actionTypeId ?? NONE_VALUE,
      title: action.title ?? "",
      status: action.status ?? "PLANNED",
      peopleGroupIds: action.peopleGroupIds ?? [],
      goalId: action.goalId ?? NONE_VALUE,
      description: action.description ?? "",
      pedagogicalPlanHtml: action.pedagogicalPlanHtml ?? "",
      plannedStartAt: action.plannedStartAt?.slice(0, 10) ?? "",
      plannedEndAt: action.plannedEndAt?.slice(0, 10) ?? "",
    });
  }, [action, mode]);

  React.useEffect(() => {
    if (!token || !isAuthenticated || authLoading || !canAccessForm) return;
    (async () => {
      try {
        const [projectsResponse, types] = await Promise.all([
          listProjects(token, { all: true, limit: 200 }),
          listActivityTypes(token, { isActive: true }),
        ]);
        const nextProjects = projectsResponse.data ?? [];
        const nextTypes = types ?? [];
        setProjects(nextProjects);
        setActivityTypes(nextTypes);
        setValues((previous) => ({
          ...previous,
          projectId:
            previous.projectId !== NONE_VALUE
              ? previous.projectId
              : nextProjects.length === 1
                ? (nextProjects[0]?.id ?? NONE_VALUE)
                : NONE_VALUE,
          actionTypeId:
            previous.actionTypeId !== NONE_VALUE
              ? previous.actionTypeId
              : (nextTypes[0]?.id ?? NONE_VALUE),
        }));
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : ACTION_CREATE_TEXT.loadErrorFallback;
        toast({
          title: ACTION_CREATE_TEXT.loadErrorTitle,
          description: message,
          variant: "destructive",
        });
      }
    })();
  }, [authLoading, canAccessForm, isAuthenticated, toast, token]);

  React.useEffect(() => {
    if (!token || !canAccessForm) return;
    if (!values.projectId || values.projectId === NONE_VALUE) {
      setPeopleGroups([]);
      setGoals([]);
      return;
    }

    (async () => {
      try {
        const [projectPeopleGroups, projectGoals] = await Promise.all([
          listProjectPeopleGroups(token, values.projectId, { participationKind: "PARTICIPANT" }),
          listProjectGoals(token, values.projectId),
        ]);
        setPeopleGroups(projectPeopleGroups);
        setGoals(projectGoals);
      } catch {
        setPeopleGroups([]);
        setGoals([]);
      }
    })();
  }, [canAccessForm, token, values.projectId]);

  const handleSubmit = async () => {
    if (!token) return;

    if (!values.projectId || values.projectId === NONE_VALUE) {
      toast({ title: ACTION_CREATE_TEXT.validations.projectRequired, variant: "destructive" });
      return;
    }

    if (!values.actionTypeId || values.actionTypeId === NONE_VALUE) {
      toast({ title: ACTION_CREATE_TEXT.validations.typeRequired, variant: "destructive" });
      return;
    }

    const resolvedType = actionTypesById.get(values.actionTypeId) ?? null;
    if (!resolvedType) {
      toast({ title: ACTION_CREATE_TEXT.validations.typeRequired, variant: "destructive" });
      return;
    }

    const title = values.title.trim();
    if (!title) {
      toast({ title: ACTION_CREATE_TEXT.validations.titleRequired, variant: "destructive" });
      return;
    }

    if (resolvedType.target === "PEOPLE_GROUP" && values.peopleGroupIds.length === 0) {
      toast({ title: ACTION_CREATE_TEXT.validations.cycleRequired, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        actionTypeId: values.actionTypeId,
        title,
        status: values.status,
        peopleGroupIds:
          resolvedType.target === "PEOPLE_GROUP" ? values.peopleGroupIds : [],
        goalId: values.goalId !== NONE_VALUE ? values.goalId : null,
        description: values.description.trim() ? values.description.trim() : null,
        pedagogicalPlanHtml: values.pedagogicalPlanHtml.trim()
          ? values.pedagogicalPlanHtml
          : null,
        plannedStartAt: values.plannedStartAt.trim() || null,
        plannedEndAt: values.plannedEndAt.trim() || null,
      };

      if (mode === "edit" && actionIdProp) {
        const updated = await updateActivity(
          token,
          projectIdProp ?? action?.projectId ?? values.projectId,
          actionIdProp,
          payload,
        );
        toast({ title: "Atividade atualizada" });
        onSaved?.(updated);
      } else {
        const created = await createActivity(token, values.projectId, payload);
        toast({ title: ACTION_CREATE_TEXT.toasts.created });
        onSaved?.(created);
        const href = withTenantPath(`/actions/${created.id}`, tenantSlug);
        const qs = new URLSearchParams();
        qs.set("projectId", values.projectId);
        router.push(`${href}?${qs.toString()}`);
      }
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : ACTION_CREATE_TEXT.loadErrorFallback;
      toast({
        title: mode === "edit" ? "Falha ao atualizar" : ACTION_CREATE_TEXT.toasts.createFailed,
        description: message,
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

  if (!isAuthenticated || authLoading) return null;

  if (!canAccessForm) {
    return <div className="text-sm text-muted-foreground">{ACTION_CREATE_TEXT.noAccessSubtitle}</div>;
  }

  return (
    <div className="space-y-8 border-y border-border/60 bg-transparent px-0 py-4">
      <SectionField label={ACTION_CREATE_TEXT.form.titleLabel}>
        <Input
          value={values.title}
          onChange={(event) =>
            setValues((previous) => ({ ...previous, title: event.target.value }))
          }
          className="h-12 rounded-none border-0 border-b border-border/60 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:border-primary focus-visible:ring-0"
          placeholder={ACTION_CREATE_TEXT.form.titlePlaceholder}
          readOnly={saving}
        />
      </SectionField>

      <div className="space-y-4">
        <SectionHeading title="Organização" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <SectionField label={ACTION_CREATE_TEXT.form.projectLabel}>
            <Select
              value={values.projectId}
              onValueChange={(next) =>
                setValues((previous) => ({
                  ...previous,
                  projectId: next,
                  peopleGroupIds: [],
                }))
              }
              disabled={saving}
            >
              <SelectTrigger className={lineInputClassName}>
                <SelectValue placeholder={ACTION_CREATE_TEXT.form.projectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{ACTION_CREATE_TEXT.form.projectPlaceholder}</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SectionField>

          <SectionField label={ACTION_CREATE_TEXT.form.typeLabel}>
            <Select
              value={values.actionTypeId}
              onValueChange={(next) =>
                setValues((previous) => ({
                  ...previous,
                  actionTypeId: next,
                  peopleGroupIds: [],
                }))
              }
              disabled={saving}
            >
              <SelectTrigger className={lineInputClassName}>
                <SelectValue placeholder={ACTION_CREATE_TEXT.form.typePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{ACTION_CREATE_TEXT.form.typePlaceholder}</SelectItem>
                {actionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SectionField>

          <SectionField label={ACTION_CREATE_TEXT.form.statusLabel}>
            <Select
              value={values.status}
              onValueChange={(next) =>
                setValues((previous) => ({ ...previous, status: next as ActionStatus }))
              }
              disabled={saving}
            >
              <SelectTrigger className={lineInputClassName}>
                <SelectValue placeholder={ACTION_CREATE_TEXT.form.statusLabel} />
              </SelectTrigger>
              <SelectContent>
                {ACTION_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SectionField>
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeading
          title="Direcionamento"
          description="Pra quem esta atividade é voltada e a que meta do Plano de Trabalho ela atende."
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionField label={ACTION_CREATE_TEXT.form.cycleLabel}>
            {selectedType?.target !== "PEOPLE_GROUP" ? (
              <div className="flex h-10 items-center border-b border-border/60 text-sm text-muted-foreground">
                {ACTION_CREATE_TEXT.form.cyclePlaceholder}
              </div>
            ) : (
              <MultiSelectBadges
                options={peopleGroups.map((row) => ({
                  value: row.peopleGroupId,
                  label: formatPeopleGroupOptionLabel(row),
                }))}
                selectedValues={values.peopleGroupIds}
                onChange={(next) =>
                  setValues((previous) => ({ ...previous, peopleGroupIds: next }))
                }
                disabled={saving}
                addLabel="Adicionar grupo"
                searchPlaceholder="Pesquisar grupo..."
                noOptionsLabel="Nenhum grupo disponível neste projeto."
                emptyLabel="Nenhum grupo selecionado."
              />
            )}
          </SectionField>

          <SectionField label="Meta (Plano de Trabalho)">
            <Select
              value={values.goalId}
              onValueChange={(next) => setValues((previous) => ({ ...previous, goalId: next }))}
              disabled={saving || values.projectId === NONE_VALUE}
            >
              <SelectTrigger className={lineInputClassName}>
                <SelectValue placeholder="Sem meta vinculada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Sem meta vinculada</SelectItem>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SectionField>
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeading
          title="Equipe responsável"
          description="Gestor e educador/executor vêm do grupo de equipe do Projeto (aba Equipe). Pra mais de 1 pessoa por função, use a aba Equipe."
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionField label="Gestor">
            <ActivityRolePicker
              token={token ?? ""}
              projectId={values.projectId !== NONE_VALUE ? values.projectId : undefined}
              actionId={actionIdProp}
              role="RESPONSAVEL_TECNICO"
              placeholder="Ninguém definido"
              disabled={saving}
            />
          </SectionField>

          <SectionField label="Educador/Executor">
            <ActivityRolePicker
              token={token ?? ""}
              projectId={values.projectId !== NONE_VALUE ? values.projectId : undefined}
              actionId={actionIdProp}
              role="FACILITADOR"
              placeholder="Ninguém definido"
              disabled={saving}
            />
          </SectionField>
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeading title="Planejamento" />
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionField label={ACTION_CREATE_TEXT.form.plannedStartLabel}>
            <Input
              type="date"
              value={values.plannedStartAt}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, plannedStartAt: event.target.value }))
              }
              className={lineInputClassName}
              readOnly={saving}
            />
          </SectionField>

          <SectionField label={ACTION_CREATE_TEXT.form.plannedEndLabel}>
            <Input
              type="date"
              value={values.plannedEndAt}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, plannedEndAt: event.target.value }))
              }
              className={lineInputClassName}
              readOnly={saving}
            />
          </SectionField>
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeading title="Descrição e plano pedagógico" />
        <div className="space-y-6">
          <SectionField label="Descrição">
            <Textarea
              rows={3}
              value={values.description}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, description: event.target.value }))
              }
              disabled={saving}
              placeholder="Resumo curto sobre a atividade."
            />
          </SectionField>

          <SectionField label="Plano pedagógico">
            <RichText
              value={values.pedagogicalPlanHtml}
              onChange={(next) =>
                setValues((previous) => ({ ...previous, pedagogicalPlanHtml: next }))
              }
              disabled={saving}
            />
          </SectionField>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {mode === "create" || onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              onCancel ? onCancel() : router.push(withTenantPath("/actions", tenantSlug))
            }
            disabled={saving}
          >
            {ACTION_CREATE_TEXT.form.cancelLabel}
          </Button>
        ) : null}
        <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? "Salvando..." : mode === "edit" ? "Salvar" : ACTION_CREATE_TEXT.form.submitLabel}
        </Button>
      </div>
    </div>
  );
}

