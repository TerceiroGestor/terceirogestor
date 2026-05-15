"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { useMedications } from "@/modules/people/features/medications/data/use-medications";
import { MedicationForm } from "@/modules/people/features/medications/ui/medication-form";
import type { MedicationFormValues } from "@/modules/people/features/medications/config/medication-form-config";
import type { Medication } from "@/modules/people/shared/domain/types";
import {
  buildPeopleDetailTabPath,
  buildPeopleMedicationPath,
} from "@/modules/people/shared/domain/people-relation-routes";
import { PeopleRelationDetailShell } from "@/modules/people/shared/ui/people-relation-detail-shell";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import type { AuditFeedConfig, DetailEditingConfig } from "@/web-client/registry/types";

type MedicationDraftValues = MedicationFormValues & {
  notes: string;
};

function initialValues(item?: Medication): MedicationFormValues {
  return {
    reason: item?.reason ?? "",
    medication: item?.medication ?? "",
    dosage: item?.dosage ?? "",
    schedule: item?.schedule ?? "",
    startDate: item?.startDate?.slice(0, 10) ?? "",
    endDate: item?.endDate?.slice(0, 10) ?? "",
    prescribingDoctor: item?.prescribingDoctor ?? "",
  };
}

function initialDraftValues(item?: Medication): MedicationDraftValues {
  return {
    ...initialValues(item),
    notes: item?.notes ?? "",
  };
}

const AUTO_EDITING: DetailEditingConfig = {
  saveMode: "auto",
  autoSave: { trigger: "field-commit" },
};

const MEDICATION_AUDIT_CONFIG: AuditFeedConfig<{ relationId: string }> = {
  primaryEntity: {
    key: "medication",
    entity: "PersonMedication",
    model: "audit.logs",
    label: "Medicação",
    fieldLabels: {
      reason: "Motivo",
      medication: "Medicação",
      dosage: "Dosagem",
      schedule: "Horário",
      startDate: "Início",
      endDate: "Fim",
      prescribingDoctor: "Médico prescritor",
      permissionDocumentUrl: "Autorização",
      documentUrl: "Documento",
      notes: "Notas",
    },
    valueFormatters: {
      documentUrl: (value) =>
        typeof value === "string" && value.trim() ? "Documento anexado" : "Sem documento",
      permissionDocumentUrl: (value) =>
        typeof value === "string" && value.trim()
          ? "Autorização anexada"
          : "Sem autorização",
    },
    resolveEntityId: ({ relationId }) => relationId,
  },
  filters: { entity: "PersonMedication" },
  sort: [{ field: "createdAt", direction: "desc" }],
  pagination: { limit: 120 },
};

function normalizeDraft(values: MedicationDraftValues): MedicationDraftValues {
  return {
    ...values,
    reason: (values.reason ?? "").trim(),
    medication: values.medication.trim(),
    dosage: (values.dosage ?? "").trim(),
    schedule: (values.schedule ?? "").trim(),
    startDate: values.startDate || "",
    endDate: values.endDate || "",
    prescribingDoctor: (values.prescribingDoctor ?? "").trim(),
    notes: (values.notes ?? "").trim(),
  };
}

export function MedicationDetailPage({ mode }: { mode: "create" | "edit" }) {
  const params = useParams<{ id?: string; medicationId?: string }>();
  const personId = String(params?.id ?? "");
  const medicationId = mode === "edit" ? String(params?.medicationId ?? "") : "";
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { medications, isLoading, error, create, update } = useMedications(personId, {
    enabled: Boolean(personId),
  });
  const createInitialValues = React.useMemo(() => initialDraftValues(), []);

  const current = React.useMemo(
    () => medications.find((item) => item.id === medicationId) ?? null,
    [medicationId, medications],
  );
  const backHref = withTenantPath(buildPeopleDetailTabPath(personId, "medicacoes"), tenantSlug);
  const [draft, setDraft] = React.useState<MedicationDraftValues>(createInitialValues);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const relationIdRef = React.useRef<string | null>(medicationId || null);
  const [activeRelationId, setActiveRelationId] = React.useState<string | null>(medicationId || null);

  const { saving, replaceSavedDraft, commitDraft } = useDetailAutoSaveController({
    draft,
    enabled: mode === "edit" && Boolean(token),
    config: AUTO_EDITING,
    normalizeDraft,
    onSave: async (values) => {
      if (!token) return values;
      const requiredMedication = values.medication.trim();
      if (!requiredMedication) {
        return values;
      }

      const payload = {
        reason: (values.reason ?? "").trim() || null,
        medication: requiredMedication,
        dosage: (values.dosage ?? "").trim() || null,
        schedule: (values.schedule ?? "").trim() || null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        prescribingDoctor: (values.prescribingDoctor ?? "").trim() || null,
        notes: (values.notes ?? "").trim() || null,
      };
      if (!relationIdRef.current) {
        const created = await create(payload);
        if (!created) return values;
        relationIdRef.current = created.id;
        setActiveRelationId(created.id);
        router.replace(withTenantPath(buildPeopleMedicationPath(personId, created.id), tenantSlug));
        return initialDraftValues(created);
      }
      const updated = await update(relationIdRef.current, payload);
      return initialDraftValues(updated ?? current ?? undefined);
    },
    onError: (nextError) => {
      const message =
        nextError && typeof nextError === "object" && "message" in nextError
          ? String((nextError as { message?: string }).message)
          : "Falha ao salvar medicacao.";
      setSaveError(message);
    },
  });

  React.useEffect(() => {
    if (mode !== "edit" || !current) return;
    const nextDraft = initialDraftValues(current);
    relationIdRef.current = current.id;
    setActiveRelationId(current.id);
    setDraft(nextDraft);
    replaceSavedDraft(nextDraft);
  }, [current, mode, replaceSavedDraft]);

  const handleValuesChange = React.useCallback(
    (values: MedicationFormValues) => {
      setDraft((previous) => ({ ...previous, ...values }));
    },
    [],
  );

  const handleFieldCommit = React.useCallback(
    (values: MedicationFormValues) => {
      const nextDraft: MedicationDraftValues = { ...draft, ...values };
      setDraft(nextDraft);
      if (mode === "edit") {
        commitDraft(nextDraft);
      }
    },
    [commitDraft, draft, mode],
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
      recordType="medication"
      tab="medicacoes"
      title={mode === "create" ? "Nova medicação" : current?.medication ?? "Medicação"}
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
      primarySaveDisabled={mode === "create" && !draft.medication.trim()}
      relationId={activeRelationId}
      auditConfig={MEDICATION_AUDIT_CONFIG}
      notes={draft.notes}
      onNotesChange={handleNotesChange}
      onNotesCommit={handleNotesCommit}
    >
      {saveError ? <div className="text-sm text-destructive">{saveError}</div> : null}
      <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
        Para anexar receitas e documentos, use o bloco de Anexos no SideShell desta tela.
      </div>
      {error ? <div className="text-sm text-destructive">{error}</div> : null}
      {mode === "edit" && isLoading && !current ? (
        <div className="text-sm text-muted-foreground">Carregando medicação...</div>
      ) : null}
      {mode === "edit" && !isLoading && !current ? (
        <div className="text-sm text-muted-foreground">Medicação não encontrada.</div>
      ) : null}
      {mode === "create" || current ? (
        <MedicationForm
          initialValues={
            mode === "create"
              ? initialValues()
              : initialValues(current ?? undefined)
          }
          hideActions
          submitLabel="Salvar"
          onCancel={() => router.push(backHref)}
          onValuesChange={handleValuesChange}
          onFieldCommit={handleFieldCommit}
          onSubmit={async (values) => {
            const nextDraft: MedicationDraftValues = { ...draft, ...values };
            setDraft(nextDraft);
            setSaveError(null);
            await commitDraft(nextDraft);
          }}
        />
      ) : null}
    </PeopleRelationDetailShell>
  );
}
