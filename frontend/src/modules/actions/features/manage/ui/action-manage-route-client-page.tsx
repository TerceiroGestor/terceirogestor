"use client";

import * as React from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  AlertTriangle,
  CalendarCheck,
  Camera,
  Check,
  ClipboardList,
  FileText,
  Star,
  Users,
  ArrowLeft,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { SectionCard } from "@/components/section-card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { FormEngine } from "@/components/FormEngine/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { SectionDialog } from "@/components/section-dialog";
import { useRegisterUsageDocumentation } from "@/components/UsageDocumentation/UsageDocumentationProvider";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { formatDateOnlyPtBR } from "@/lib/date";
import { resolveMediaUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { uploadActionPhoto } from "@/features/uploads/api";
import {
  getProjectAction,
  listProjectActionAttendances,
  updateProjectAction,
  type ApiProjectAction,
  type ActionStatus,
  type ProjectActionAttendancesListItem,
  type ProjectActionInput,
} from "@/modules/actions/api";
import { ACTION_STATUS_OPTIONS } from "@/modules/actions/shared/domain/actions.constants";
import { ProjectActionAttendancesCard } from "@/modules/projects/features/detail/ui/project-action-attendances-card";
import { ActionQualityCard } from "./action-quality-card";
import { ActionReportPreview } from "./action-report-preview";
import { ACTION_MANAGE_TEXT } from "../config/action-manage.constants";

const MAX_PHOTOS = 5;

type ActionManageTabValue =
  | "plan"
  | "participants"
  | "executed"
  | "conclusion"
  | "quality"
  | "photos"
  | "report"
  | "occurrences";

type ActionManageStep = {
  value: ActionManageTabValue;
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function ActionManageStepsNav(props: {
  value: ActionManageTabValue;
  steps: ActionManageStep[];
  onChange: (next: ActionManageTabValue) => void;
}) {
  const currentIndex = Math.max(
    0,
    props.steps.findIndex((step) => step.value === props.value),
  );

  const progressPct =
    props.steps.length <= 1
      ? 0
      : Math.round((currentIndex / (props.steps.length - 1)) * 100);

  return (
    <div className="rounded-lg border bg-card/70 p-4 shadow-sm">
      <div className="relative">
        <div className="absolute left-4 right-4 top-5 h-1 rounded-full bg-border/60" />
        <div
          className="absolute left-4 top-5 h-1 rounded-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `calc(${progressPct}% - 0px)` }}
        />

        <div className="relative z-10 flex items-start justify-between gap-3 overflow-x-auto pb-2">
          {props.steps.map((step, index) => {
            const active = index === currentIndex;
            const complete = index < currentIndex;
            const iconClasses = complete
              ? "bg-primary text-primary-foreground border-primary/20"
              : active
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted/50 text-muted-foreground border-border/70";

            return (
              <button
                key={step.value}
                type="button"
                onClick={() => props.onChange(step.value)}
                aria-current={active ? "step" : undefined}
                className="group flex min-w-[92px] flex-1 flex-col items-center gap-2 sm:min-w-[110px]"
                title={step.title}
              >
                <span
                  className={[
                    "flex size-10 items-center justify-center rounded-full border shadow-sm transition-colors",
                    iconClasses,
                  ].join(" ")}
                >
                  {complete ? (
                    <Check className="size-5" />
                  ) : (
                    <step.Icon className="size-5" />
                  )}
                </span>
                <span
                  className={[
                    "text-center text-xs font-semibold",
                    active ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function toDateOnly(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function formatPeriod(start: string | null, end: string | null) {
  const startLabel = start ? formatDateOnlyPtBR(start) : "";
  const endLabel = end ? formatDateOnlyPtBR(end) : "";
  if (!startLabel && !endLabel) return "—";
  if (startLabel && endLabel) return `${startLabel} — ${endLabel}`;
  return startLabel ? `${startLabel} —` : `— ${endLabel}`;
}

type PlanValues = {
  title: string;
  status: ActionStatus;
  plannedStartAt: string;
  plannedEndAt: string;
  planHtml: string;
};

type ExecutedValues = {
  executedStartAt: string;
  executedEndAt: string;
  executedHtml: string;
};

type ConclusionValues = {
  completionPercent: number | "";
  conclusionHtml: string;
};

type PhotoUploadValues = {
  photo: File | null;
};

async function fetchAllAttendances(params: {
  token: string;
  projectId: string;
  actionId: string;
}) {
  const limit = 200;
  let page = 1;
  const all: ProjectActionAttendancesListItem[] = [];

  while (true) {
    const response = await listProjectActionAttendances(
      params.token,
      params.projectId,
      params.actionId,
      { page, limit },
    );
    all.push(...(response.data ?? []));
    const pages = response.pagination?.pages ?? page;
    if (page >= pages) break;
    page += 1;
  }

  return all;
}

export function ActionManageRouteClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const routeParams = useParams<{ id: string }>();
  const search = useSearchParams();
  const projectId = search.get("projectId") ?? "";
  const actionId = routeParams?.id ?? "";

  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  const canRead = permissions.includes("actions.read");
  const canUpdate = permissions.includes("actions.update");
  const canReadStructure = permissions.includes("project-structure.read");
  const canReadPeople = permissions.includes("people.read");
  const canReadPeopleIdentity = permissions.includes("people.identity.read");

  const [tab, setTab] = React.useState<ActionManageTabValue>("plan");
  const [action, setAction] = React.useState<ApiProjectAction | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [reportRows, setReportRows] = React.useState<ProjectActionAttendancesListItem[]>([]);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportError, setReportError] = React.useState<string | null>(null);

  const [photoDialog, setPhotoDialog] = React.useState<{
    open: boolean;
    index: number;
  }>({ open: false, index: 0 });

  const [photoFormKey, setPhotoFormKey] = React.useState(0);

  const photoPaths = React.useMemo(() => action?.photoPaths ?? [], [action]);

  const usageItems = React.useMemo(
    () =>
      ACTION_MANAGE_TEXT.usage.sections.map((section, index) => ({
        id: `actions-manage-${index}`,
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
    title: ACTION_MANAGE_TEXT.usage.title,
    items: usageItems,
  });

  const tabsAsSteps = React.useMemo<ActionManageStep[]>(
    () => [
      { value: "plan", title: ACTION_MANAGE_TEXT.tabs.plan, Icon: ClipboardList },
      {
        value: "participants",
        title: ACTION_MANAGE_TEXT.tabs.participants,
        Icon: Users,
      },
      {
        value: "executed",
        title: ACTION_MANAGE_TEXT.tabs.executed,
        Icon: CalendarCheck,
      },
      {
        value: "conclusion",
        title: ACTION_MANAGE_TEXT.tabs.conclusion,
        Icon: FileText,
      },
      { value: "quality", title: ACTION_MANAGE_TEXT.tabs.quality, Icon: Star },
      { value: "photos", title: ACTION_MANAGE_TEXT.tabs.photos, Icon: Camera },
      { value: "report", title: ACTION_MANAGE_TEXT.tabs.report, Icon: FileText },
      {
        value: "occurrences",
        title: ACTION_MANAGE_TEXT.tabs.occurrences,
        Icon: AlertTriangle,
      },
    ],
    [],
  );

  const load = React.useCallback(async () => {
    if (!token || !canRead) return;
    if (!projectId || !actionId) return;
    setLoading(true);
    try {
      const data = await getProjectAction(token, projectId, actionId);
      setAction(data);
    } catch (err) {
      toast({
        title: ACTION_MANAGE_TEXT.loadErrorTitle,
        description:
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : ACTION_MANAGE_TEXT.loadErrorFallback,
        variant: "destructive",
      });
      setAction(null);
    } finally {
      setLoading(false);
    }
  }, [token, canRead, projectId, actionId, toast]);

  const loadReport = React.useCallback(async () => {
    if (!token || !canRead || !projectId || !actionId) return;
    setReportLoading(true);
    setReportError(null);
    try {
      const rows = await fetchAllAttendances({ token, projectId, actionId });
      setReportRows(rows);
    } catch (err) {
      setReportRows([]);
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : ACTION_MANAGE_TEXT.report.loadFailed;
      setReportError(message);
    } finally {
      setReportLoading(false);
    }
  }, [token, canRead, projectId, actionId]);

  React.useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    load();
  }, [isAuthenticated, authLoading, load]);

  React.useEffect(() => {
    if (!action) return;
    void loadReport();
  }, [action, loadReport]);

  const save = async (patch: Partial<ProjectActionInput>) => {
    if (!token || !canUpdate || !action) return;
    setSaving(true);
    try {
      const updated = await updateProjectAction(
        token,
        projectId,
        action.id,
        patch,
      );
      setAction(updated);
      toast({ title: ACTION_MANAGE_TEXT.saveOk });
      return updated;
    } catch (err) {
      toast({
        title: ACTION_MANAGE_TEXT.saveFailedTitle,
        description:
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : ACTION_MANAGE_TEXT.loadErrorFallback,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    if (!token || !action || !canUpdate) return;
    if (photoPaths.length >= MAX_PHOTOS) {
      toast({ title: ACTION_MANAGE_TEXT.photos.limit, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const result = await uploadActionPhoto(token, file);
      const next = [...photoPaths, result.path].slice(0, MAX_PHOTOS);
      const updated = await updateProjectAction(token, projectId, action.id, { photoPaths: next });
      setAction(updated);
      toast({ title: ACTION_MANAGE_TEXT.photos.uploadOk });
      setPhotoFormKey((k) => k + 1);
    } catch (err) {
      toast({
        title: ACTION_MANAGE_TEXT.photos.uploadFailed,
        description:
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : ACTION_MANAGE_TEXT.loadErrorFallback,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async (path: string) => {
    if (!token || !action || !canUpdate) return;
    const next = photoPaths.filter((p) => p !== path);
    await save({ photoPaths: next });
  };

  const breadcrumbTitle = action?.title ?? ACTION_MANAGE_TEXT.noAccessTitle;

  const planInitialValues = React.useMemo<Partial<PlanValues>>(() => {
    if (!action) return {};
    return {
      title: action.title ?? "",
      status: action.status ?? "PLANNED",
      plannedStartAt: toDateOnly(action.plannedStartAt),
      plannedEndAt: toDateOnly(action.plannedEndAt),
      planHtml: action.planHtml ?? "",
    };
  }, [action]);

  const planFields = React.useMemo<FormField<PlanValues>[]>(() => {
    return [
      { name: "title", label: ACTION_MANAGE_TEXT.plan.titleLabel, type: "text", required: true },
      { name: "status", label: ACTION_MANAGE_TEXT.plan.statusLabel, type: "select", options: ACTION_STATUS_OPTIONS, required: true },
      { name: "plannedStartAt", label: ACTION_MANAGE_TEXT.plan.plannedStartLabel, type: "date" },
      { name: "plannedEndAt", label: ACTION_MANAGE_TEXT.plan.plannedEndLabel, type: "date" },
      { name: "planHtml", label: ACTION_MANAGE_TEXT.plan.planLabel, type: "richtext" },
    ];
  }, []);

  const executedInitialValues = React.useMemo<Partial<ExecutedValues>>(() => {
    if (!action) return {};
    return {
      executedStartAt: toDateOnly(action.executedStartAt),
      executedEndAt: toDateOnly(action.executedEndAt),
      executedHtml: action.executedHtml ?? "",
    };
  }, [action]);

  const executedFields = React.useMemo<FormField<ExecutedValues>[]>(() => {
    return [
      { name: "executedStartAt", label: ACTION_MANAGE_TEXT.executed.executedStartLabel, type: "date" },
      { name: "executedEndAt", label: ACTION_MANAGE_TEXT.executed.executedEndLabel, type: "date" },
      { name: "executedHtml", label: ACTION_MANAGE_TEXT.executed.executedRichLabel, type: "richtext" },
    ];
  }, []);

  const conclusionInitialValues = React.useMemo<Partial<ConclusionValues>>(() => {
    if (!action) return {};
    return {
      completionPercent: action.completionPercent ?? "",
      conclusionHtml: action.conclusionHtml ?? "",
    };
  }, [action]);

  const conclusionFields = React.useMemo<FormField<ConclusionValues>[]>(() => {
    return [
      {
        name: "completionPercent",
        label: ACTION_MANAGE_TEXT.conclusion.completionPercentLabel,
        type: "number",
        helperText: ACTION_MANAGE_TEXT.conclusion.completionPercentHelper,
      },
      { name: "conclusionHtml", label: ACTION_MANAGE_TEXT.conclusion.conclusionLabel, type: "richtext" },
    ];
  }, []);

  const photoUploadFields = React.useMemo<FormField<PhotoUploadValues>[]>(() => {
    return [
      {
        name: "photo",
        label: ACTION_MANAGE_TEXT.photos.addPhotoTitle,
        type: "file",
        accept: "image/*",
        required: true,
        helperText:
          photoPaths.length >= MAX_PHOTOS
            ? ACTION_MANAGE_TEXT.photos.limit
            : ACTION_MANAGE_TEXT.photos.subtitle,
      },
    ];
  }, [photoPaths.length]);

  const selectedPhotoUrl = photoPaths[photoDialog.index]
    ? resolveMediaUrl(photoPaths[photoDialog.index]!)
    : "";

  if (!isAuthenticated || authLoading) return null;
  if (!token) return null;

  if (!canRead) {
    return (
      <SectionCard
        title={ACTION_MANAGE_TEXT.noAccessTitle}
        subtitle={ACTION_MANAGE_TEXT.noAccessSubtitle}
      >
        <p className="text-xs text-muted-foreground">
          {ACTION_MANAGE_TEXT.requestAccessHint}
        </p>
      </SectionCard>
    );
  }

  if (!projectId) {
    return (
      <SectionCard
        title={ACTION_MANAGE_TEXT.projectMissingTitle}
        subtitle={ACTION_MANAGE_TEXT.projectMissingSubtitle}
      >
        <p className="text-xs text-muted-foreground">
          {ACTION_MANAGE_TEXT.projectMissingHint}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() =>
            router.push(withTenantPath("/actions", tenantSlug))
          }
        >
          {ACTION_MANAGE_TEXT.back}
        </Button>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        title={breadcrumbTitle}
        items={[{ label: "Ações", href: "/actions" }, { label: breadcrumbTitle }]}
      />

      <SectionCard
        title={breadcrumbTitle}
        subtitle={
          action
            ? `${action.actionType?.name ?? "—"}${action.group?.name ? ` • ${action.group.name}` : ""}${action.cycle?.name ? ` • ${action.cycle.name}` : ""}`
            : ACTION_MANAGE_TEXT.loading
        }
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button type="button" variant="ghost" onClick={() => router.push(withTenantPath("/actions", tenantSlug))}>
              <ArrowLeft className="mr-2 size-4" />
              {ACTION_MANAGE_TEXT.back}
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.print()}>
              <Printer className="mr-2 size-4" />
              {ACTION_MANAGE_TEXT.print}
            </Button>
          </div>
        }
      >
        {loading ? <p className="text-xs text-muted-foreground">{ACTION_MANAGE_TEXT.loading}</p> : null}

        {!loading && !action ? (
          <p className="text-xs text-muted-foreground">{ACTION_MANAGE_TEXT.notFound}</p>
        ) : null}

        {action ? (
          <>
            <div className="space-y-6 print:hidden">
              <ActionManageStepsNav
                value={tab}
                steps={tabsAsSteps}
                onChange={(next) => setTab(next)}
              />

              <Tabs
                value={tab}
                onValueChange={(next) => setTab(next as ActionManageTabValue)}
                className="space-y-6"
              >

                <TabsContent value="plan" className="mt-0 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="text-sm font-medium">{ACTION_MANAGE_TEXT.plan.plannedLabel}</div>
                      <div className="rounded-md border border-border/60 bg-muted/10 px-3 py-2 text-sm">
                        {formatPeriod(action.plannedStartAt, action.plannedEndAt)}
                      </div>
                    </div>
                  </div>

                  <FormEngine<PlanValues>
                    fields={planFields}
                    initialValues={planInitialValues}
                    onSubmit={(values) =>
                      save({
                        title: values.title.trim(),
                        status: values.status,
                        plannedStartAt: values.plannedStartAt?.trim() ? values.plannedStartAt : null,
                        plannedEndAt: values.plannedEndAt?.trim() ? values.plannedEndAt : null,
                        planHtml: values.planHtml?.trim() ? values.planHtml : null,
                      })
                    }
                    disabled={!canUpdate || saving}
                    actions={
                      canUpdate
                        ? {
                            submit: {
                              label: saving ? "Salvando..." : ACTION_MANAGE_TEXT.plan.submit,
                              variant: "primary",
                            },
                          }
                        : undefined
                    }
                  />
                </TabsContent>

                <TabsContent value="participants" className="mt-0 space-y-6">
                  <ProjectActionAttendancesCard
                    token={token}
                    projectId={projectId}
                    actionId={action.id}
                    canUpdate={canUpdate}
                    canReadStructure={canReadStructure}
                    canReadPeople={canReadPeople}
                    canReadPeopleIdentity={canReadPeopleIdentity}
                  />
                </TabsContent>

                <TabsContent value="executed" className="mt-0 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="text-sm font-medium">{ACTION_MANAGE_TEXT.executed.executedLabel}</div>
                      <div className="rounded-md border border-border/60 bg-muted/10 px-3 py-2 text-sm">
                        {formatPeriod(action.executedStartAt, action.executedEndAt)}
                      </div>
                    </div>
                  </div>

                  <FormEngine<ExecutedValues>
                    fields={executedFields}
                    initialValues={executedInitialValues}
                    onSubmit={(values) =>
                      save({
                        executedStartAt: values.executedStartAt?.trim() ? values.executedStartAt : null,
                        executedEndAt: values.executedEndAt?.trim() ? values.executedEndAt : null,
                        executedHtml: values.executedHtml?.trim() ? values.executedHtml : null,
                      })
                    }
                    disabled={!canUpdate || saving}
                    actions={
                      canUpdate
                        ? {
                            submit: {
                              label: saving ? "Salvando..." : ACTION_MANAGE_TEXT.executed.submit,
                              variant: "primary",
                            },
                          }
                        : undefined
                    }
                  />
                </TabsContent>

                <TabsContent value="conclusion" className="mt-0 space-y-4">
                  <div className="text-sm text-muted-foreground">{ACTION_MANAGE_TEXT.conclusion.helper}</div>

                  <FormEngine<ConclusionValues>
                    fields={conclusionFields}
                    initialValues={conclusionInitialValues}
                    onSubmit={(values) =>
                      save({
                        completionPercent: values.completionPercent === "" ? null : Number(values.completionPercent),
                        conclusionHtml: values.conclusionHtml?.trim() ? values.conclusionHtml : null,
                      })
                    }
                    disabled={!canUpdate || saving}
                    actions={
                      canUpdate
                        ? {
                            submit: {
                              label: saving ? "Salvando..." : ACTION_MANAGE_TEXT.conclusion.submit,
                              variant: "primary",
                            },
                          }
                        : undefined
                    }
                  />
                </TabsContent>

                <TabsContent value="quality" className="mt-0 space-y-6">
                  <ActionQualityCard token={token} projectId={projectId} actionId={action.id} canUpdate={canUpdate} canReadPeople={canReadPeople} />
                </TabsContent>

                <TabsContent value="photos" className="mt-0 space-y-4">
                  <SectionCard title={ACTION_MANAGE_TEXT.photos.title} subtitle={ACTION_MANAGE_TEXT.photos.subtitle}>
                    {canUpdate ? (
                      <FormEngine<PhotoUploadValues>
                        key={photoFormKey}
                        fields={photoUploadFields}
                        initialValues={{ photo: null }}
                        onSubmit={(values) => {
                          const file = values.photo;
                          if (!file) return;
                          void handleUploadPhoto(file);
                        }}
                        disabled={saving || photoPaths.length >= MAX_PHOTOS}
                        actions={{
                          submit: {
                            label: saving ? "Enviando..." : ACTION_MANAGE_TEXT.photos.upload,
                            variant: "secondary",
                          },
                        }}
                      />
                    ) : null}

                    {photoPaths.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{ACTION_MANAGE_TEXT.photos.empty}</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {photoPaths.map((path, index) => (
                          <button
                            key={path}
                            type="button"
                            className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/10 text-left"
                            onClick={() => setPhotoDialog({ open: true, index })}
                            aria-label={ACTION_MANAGE_TEXT.photos.galleryTitle}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolveMediaUrl(path)}
                              alt="Foto da ação"
                              className="h-40 w-full object-cover"
                            />
                            {canUpdate ? (
                              <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void handleRemovePhoto(path);
                                  }}
                                  disabled={saving}
                                >
                                  {ACTION_MANAGE_TEXT.photos.remove}
                                </Button>
                              </div>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </TabsContent>

                <TabsContent value="report" className="mt-0 space-y-4">
                  <SectionCard title={ACTION_MANAGE_TEXT.report.title} subtitle={ACTION_MANAGE_TEXT.report.subtitle}>
                    {reportError ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {reportError}
                      </div>
                    ) : null}
                    {reportLoading ? (
                      <p className="text-xs text-muted-foreground">{ACTION_MANAGE_TEXT.loading}</p>
                    ) : null}

                    <ActionReportPreview
                      action={action}
                      rows={reportRows}
                      photoPaths={photoPaths}
                      canShowPeople={canReadPeople}
                    />
                  </SectionCard>
                </TabsContent>

                <TabsContent value="occurrences" className="mt-0 space-y-4">
                  <SectionCard title={ACTION_MANAGE_TEXT.occurrences.title} subtitle={ACTION_MANAGE_TEXT.occurrences.subtitle}>
                    <p className="text-xs text-muted-foreground">{ACTION_MANAGE_TEXT.occurrences.hint}</p>
                  </SectionCard>
                </TabsContent>
              </Tabs>
            </div>

            {/* Print-only report */}
            <div className="hidden space-y-6 print:block">
              <ActionReportPreview
                action={action}
                rows={reportRows}
                photoPaths={photoPaths}
                canShowPeople={canReadPeople}
                printMode
              />
            </div>
          </>
        ) : null}
      </SectionCard>

      <SectionDialog
        open={photoDialog.open}
        onOpenChange={(open) => setPhotoDialog((prev) => ({ ...prev, open }))}
        title={ACTION_MANAGE_TEXT.photos.galleryTitle}
        description={
          photoPaths.length ? `${photoDialog.index + 1} / ${photoPaths.length}` : undefined
        }
        contentClassName="max-w-[min(96vw,54rem)]"
        headerSlot={
          photoPaths.length ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPhotoDialog((prev) => ({ ...prev, index: Math.max(0, prev.index - 1) }))}
                disabled={photoDialog.index <= 0}
              >
                {ACTION_MANAGE_TEXT.photos.previous}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPhotoDialog((prev) => ({ ...prev, index: Math.min(photoPaths.length - 1, prev.index + 1) }))}
                disabled={photoDialog.index >= photoPaths.length - 1}
              >
                {ACTION_MANAGE_TEXT.photos.next}
              </Button>
            </div>
          ) : null
        }
      >
        {selectedPhotoUrl ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhotoUrl}
              alt="Foto da ação"
              className="max-h-[68vh] w-full rounded-lg object-contain"
            />
            <div className="text-xs text-muted-foreground">
              {ACTION_MANAGE_TEXT.photos.subtitle}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{ACTION_MANAGE_TEXT.photos.empty}</p>
        )}
      </SectionDialog>
    </div>
  );
}
