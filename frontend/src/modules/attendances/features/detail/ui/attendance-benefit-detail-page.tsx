"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  getAttendance,
  updateAttendanceBenefit,
  type ApiAttendanceBenefit,
} from "@/modules/attendances/api";
import { ATTENDANCE_TYPE_LABELS } from "@/modules/attendances/shared/domain/attendances.constants";
import { AttendanceRelationDetailShell } from "@/modules/attendances/shared/ui/attendance-relation-detail-shell";
import { DetailSectionField } from "@/web-client/detail/DetailFormSection";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import type { AuditFeedConfig, DetailEditingConfig } from "@/web-client/registry/types";

const DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const DETAIL_TEXTAREA_CLASS =
  "min-h-[120px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";

const AUTO_EDITING: DetailEditingConfig = {
  saveMode: "auto",
  autoSave: { trigger: "field-commit" },
};

const BENEFIT_AUDIT_CONFIG: AuditFeedConfig<{ relationId: string }> = {
  primaryEntity: {
    key: "benefit",
    entity: "AttendanceBenefit",
    model: "audit.logs",
    label: "Benefício",
    fieldLabels: { name: "Nome", date: "Data", quantity: "Quantidade", notes: "Observações" },
    resolveEntityId: ({ relationId }) => relationId,
  },
  filters: { entity: "AttendanceBenefit" },
  sort: [{ field: "createdAt", direction: "desc" }],
  pagination: { limit: 120 },
};

type BenefitDraft = { name: string; date: string; quantity: string; notes: string };

function toDraft(item: ApiAttendanceBenefit): BenefitDraft {
  return {
    name: item.name,
    date: item.date.slice(0, 10),
    quantity: item.quantity ? String(item.quantity) : "",
    notes: item.notes ?? "",
  };
}

function normalizeDraft(draft: BenefitDraft): BenefitDraft {
  return {
    name: draft.name.trim(),
    date: draft.date,
    quantity: draft.quantity.trim(),
    notes: draft.notes.trim(),
  };
}

export function AttendanceBenefitDetailPage() {
  const params = useParams<{ id?: string; benefitId?: string }>();
  const attendanceId = String(params?.id ?? "");
  const benefitId = String(params?.benefitId ?? "");
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";

  const [attendanceType, setAttendanceType] = React.useState<string | null>(null);
  const [benefit, setBenefit] = React.useState<ApiAttendanceBenefit | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState<BenefitDraft>({
    name: "",
    date: "",
    quantity: "",
    notes: "",
  });

  const parentHref = withTenantPath(`/attendances/${attendanceId}`, tenantSlug);

  const { saving, replaceSavedDraft, commitField } = useDetailAutoSaveController<BenefitDraft>({
    draft,
    enabled: Boolean(benefit),
    config: AUTO_EDITING,
    normalizeDraft,
    onSave: async (nextDraft) => {
      if (!token) return nextDraft;
      const normalized = normalizeDraft(nextDraft);
      const parsedQuantity = normalized.quantity ? Number(normalized.quantity) : null;
      const updated = await updateAttendanceBenefit(token, attendanceId, benefitId, {
        name: normalized.name,
        date: normalized.date,
        quantity: parsedQuantity && parsedQuantity > 0 ? parsedQuantity : null,
        notes: normalized.notes || null,
      });
      const updatedItem = updated.benefits.find((item) => item.id === benefitId);
      if (updatedItem) {
        setBenefit(updatedItem);
        return toDraft(updatedItem);
      }
      return nextDraft;
    },
    onError: () => {
      toast({ variant: "destructive", title: "Falha ao salvar benefício" });
    },
  });

  React.useEffect(() => {
    if (!token || !attendanceId || !benefitId) return;
    setLoading(true);
    getAttendance(token, attendanceId)
      .then((loaded) => {
        setAttendanceType(loaded.type);
        const found = loaded.benefits.find((item) => item.id === benefitId) ?? null;
        setBenefit(found);
        if (found) {
          const nextDraft = toDraft(found);
          setDraft(nextDraft);
          replaceSavedDraft(nextDraft);
        }
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Falha ao carregar benefício" });
      })
      .finally(() => setLoading(false));
  }, [attendanceId, benefitId, replaceSavedDraft, toast, token]);

  const title = benefit ? benefit.name : "Benefício";

  return (
    <AttendanceRelationDetailShell
      parentLabel={attendanceType ? ATTENDANCE_TYPE_LABELS[attendanceType] ?? attendanceType : "Atendimento"}
      parentHref={parentHref}
      title={title}
      saving={saving}
      auditConfig={BENEFIT_AUDIT_CONFIG}
      relationId={benefitId}
      onClose={() => router.push(parentHref)}
    >
      {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
      {!loading && !benefit ? (
        <p className="text-sm text-muted-foreground">Benefício não encontrado.</p>
      ) : null}
      {benefit ? (
        <>
          <DetailSectionField label="Benefício" required>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))}
              onBlur={() => commitField("name")}
              className={DETAIL_INPUT_CLASS}
            />
          </DetailSectionField>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <DetailSectionField label="Data" required>
              <Input
                type="date"
                value={draft.date}
                onChange={(event) => setDraft((previous) => ({ ...previous, date: event.target.value }))}
                onBlur={() => commitField("date")}
                className={DETAIL_INPUT_CLASS}
              />
            </DetailSectionField>
            <DetailSectionField label="Quantidade">
              <Input
                type="number"
                min={1}
                value={draft.quantity}
                onChange={(event) => setDraft((previous) => ({ ...previous, quantity: event.target.value }))}
                onBlur={() => commitField("quantity")}
                className={DETAIL_INPUT_CLASS}
              />
            </DetailSectionField>
          </div>
          <div className="mt-6">
            <DetailSectionField label="Observações">
              <Textarea
                value={draft.notes}
                onChange={(event) => setDraft((previous) => ({ ...previous, notes: event.target.value }))}
                onBlur={() => commitField("notes")}
                className={DETAIL_TEXTAREA_CLASS}
              />
            </DetailSectionField>
          </div>
        </>
      ) : null}
    </AttendanceRelationDetailShell>
  );
}
