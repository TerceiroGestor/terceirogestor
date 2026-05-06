"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { HealthConditionForm } from "@/modules/people/features/health-conditions/ui/health-condition-form";
import type { HealthConditionFormValues } from "@/modules/people/features/health-conditions/config/health-condition-form-config";
import { useHealthConditions } from "@/modules/people/features/health-conditions/data/use-health-conditions";
import type { HealthCondition } from "@/modules/people/shared/domain/types";
import {
  buildPeopleDetailTabPath,
  buildPeopleHealthConditionPath,
} from "@/modules/people/shared/domain/people-relation-routes";
import { PeopleRelationDetailShell } from "@/modules/people/shared/ui/people-relation-detail-shell";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import type { AuditFeedConfig, DetailEditingConfig } from "@/web-client/registry/types";

function initialFormValues(item?: HealthCondition): HealthConditionFormValues {
  return {
    type: item?.type ?? "",
    description: item?.description ?? "",
    severity: item?.severity ?? "",
    diagnosisDate: item?.diagnosisDate?.slice(0, 10) ?? "",
    notes: item?.notes ?? "",
  };
}

const AUTO_EDITING: DetailEditingConfig = {
  saveMode: "auto",
  autoSave: { trigger: "field-commit" },
};

const HEALTH_CONDITION_AUDIT_CONFIG: AuditFeedConfig<{ relationId: string }> = {
  primaryEntity: {
    key: "health-condition",
    entity: "PersonHealthCondition",
    model: "audit.logs",
    label: "Condição de saúde",
    fieldLabels: {
      type: "Tipo de condição",
      description: "Descrição",
      severity: "Severidade",
      diagnosisDate: "Data do diagnóstico",
      documentUrl: "Documento",
      notes: "Notas",
    },
    valueFormatters: {
      documentUrl: (value) =>
        typeof value === "string" && value.trim() ? "Documento anexado" : "Sem documento",
    },
    resolveEntityId: ({ relationId }) => relationId,
  },
  filters: { entity: "PersonHealthCondition" },
  sort: [{ field: "createdAt", direction: "desc" }],
  pagination: { limit: 120 },
};

function normalizeDraft(values: HealthConditionFormValues): HealthConditionFormValues {
  return {
    ...values,
    type: values.type.trim(),
    description: (values.description ?? "").trim(),
    severity: (values.severity ?? "").trim(),
    diagnosisDate: values.diagnosisDate || "",
    notes: (values.notes ?? "").trim(),
  };
}

export function HealthConditionDetailPage({
  mode,
}: {
  mode: "create" | "edit";
}) {
  const params = useParams<{ id?: string; conditionId?: string }>();
  const personId = String(params?.id ?? "");
  const conditionId = mode === "edit" ? String(params?.conditionId ?? "") : "";
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { conditions, isLoading, error, create, update } = useHealthConditions(personId, {
    enabled: Boolean(personId),
  });
  const createInitialValues = React.useMemo(() => initialFormValues(), []);

  const current = React.useMemo(
    () => conditions.find((item) => item.id === conditionId) ?? null,
    [conditionId, conditions],
  );
  const backHref = withTenantPath(buildPeopleDetailTabPath(personId, "saude"), tenantSlug);
  const [draft, setDraft] = React.useState<HealthConditionFormValues>(createInitialValues);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const relationIdRef = React.useRef<string | null>(conditionId || null);
  const [activeRelationId, setActiveRelationId] = React.useState<string | null>(conditionId || null);

  const { saving, replaceSavedDraft, commitDraft } = useDetailAutoSaveController({
    draft,
    enabled: mode === "edit" && Boolean(token),
    config: AUTO_EDITING,
    normalizeDraft,
    onSave: async (values) => {
      if (!token) return values;
      const requiredType = values.type.trim();
      if (!requiredType) {
        return values;
      }

      const payload = {
        type: requiredType,
        description: (values.description ?? "").trim() || null,
        severity: (values.severity ?? "").trim() || null,
        diagnosisDate: values.diagnosisDate || null,
        notes: (values.notes ?? "").trim() || null,
      };

      if (!relationIdRef.current) {
        const created = await create(payload);
        if (!created) return values;
        relationIdRef.current = created.id;
        setActiveRelationId(created.id);
        const nextPath = withTenantPath(buildPeopleHealthConditionPath(personId, created.id), tenantSlug);
        router.replace(nextPath);
        return initialFormValues(created);
      }

      const updated = await update(relationIdRef.current, payload);
      return initialFormValues(updated ?? current ?? undefined);
    },
    onError: (nextError) => {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao salvar condicao de saude.";
      setSaveError(message);
    },
  });

  React.useEffect(() => {
    if (mode !== "edit" || !current) return;
    const nextDraft = initialFormValues(current);
    relationIdRef.current = current.id;
    setActiveRelationId(current.id);
    setDraft(nextDraft);
    replaceSavedDraft(nextDraft);
  }, [current, mode, replaceSavedDraft]);

  const handleValuesChange = React.useCallback(
    (values: HealthConditionFormValues) => {
      setDraft(values);
    },
    [],
  );

  const handleFieldCommit = React.useCallback(
    (values: HealthConditionFormValues) => {
      setDraft(values);
      if (mode === "edit") {
        commitDraft(values);
      }
    },
    [commitDraft, mode],
  );

  const handleNotesChange = React.useCallback((next: string | null) => {
    setDraft((previous) => ({ ...previous, notes: next ?? "" }));
  }, []);

  const handleNotesCommit = React.useCallback(
    (next: string | null) => {
      const nextDraft = { ...draft, notes: next ?? "" };
      setDraft(nextDraft);
      if (mode === "edit") {
        commitDraft(nextDraft);
      }
    },
    [commitDraft, draft, mode],
  );

  return (
    <PeopleRelationDetailShell
      personId={personId}
      recordType="health-condition"
      tab="saude"
      title={mode === "create" ? "Nova condição de saúde" : current?.type ?? "Condição de saúde"}
      mode={mode}
      saving={saving}
      onPrimarySave={
        mode === "create"
          ? async () => {
              setSaveError(null);
              await commitDraft(draft);
            }
          : undefined
      }
      primarySaveDisabled={mode === "create" && !draft.type.trim()}
      relationId={activeRelationId}
      auditConfig={HEALTH_CONDITION_AUDIT_CONFIG}
      notes={draft.notes}
      onNotesChange={handleNotesChange}
      onNotesCommit={handleNotesCommit}
    >
      {saveError ? <div className="text-sm text-destructive">{saveError}</div> : null}
      <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
        Para anexar laudos e comprovantes, use o bloco de Anexos no SideShell desta tela.
      </div>
      {error ? <div className="text-sm text-destructive">{error}</div> : null}
      {mode === "edit" && isLoading && !current ? (
        <div className="text-sm text-muted-foreground">Carregando condição...</div>
      ) : null}
      {mode === "edit" && !isLoading && !current ? (
        <div className="text-sm text-muted-foreground">Condição não encontrada.</div>
      ) : null}
      {mode === "create" || current ? (
        <HealthConditionForm
          initialValues={mode === "create" ? createInitialValues : initialFormValues(current ?? undefined)}
          hideActions
          submitLabel="Salvar"
          onCancel={() => router.push(backHref)}
          onValuesChange={handleValuesChange}
          onFieldCommit={handleFieldCommit}
          onSubmit={async (values) => {
            setDraft(values);
            setSaveError(null);
            await commitDraft(values);
          }}
        />
      ) : null}
    </PeopleRelationDetailShell>
  );
}
