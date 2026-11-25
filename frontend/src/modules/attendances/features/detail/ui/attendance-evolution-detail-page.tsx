"use client";

import * as React from "react";
import Link from "next/link";
import { Gift, Send } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { formatDateOnlyPtBR } from "@/lib/date";
import {
  addAttendanceBenefit,
  getAttendance,
  updateAttendanceEvolution,
  type ApiAttendanceEvolution,
} from "@/modules/attendances/api";
import { ATTENDANCE_TYPE_LABELS } from "@/modules/attendances/shared/domain/attendances.constants";
import { AttendanceBenefitDialog } from "@/modules/attendances/features/detail/ui/attendance-benefit-dialog";
import { AttendanceRelationDetailShell } from "@/modules/attendances/shared/ui/attendance-relation-detail-shell";
import { DetailSectionField } from "@/web-client/detail/DetailFormSection";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import type { AuditFeedConfig, DetailEditingConfig } from "@/web-client/registry/types";

const DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const DETAIL_TEXTAREA_CLASS =
  "min-h-[160px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";

const AUTO_EDITING: DetailEditingConfig = {
  saveMode: "auto",
  autoSave: { trigger: "field-commit" },
};

const EVOLUTION_AUDIT_CONFIG: AuditFeedConfig<{ relationId: string }> = {
  primaryEntity: {
    key: "evolution",
    entity: "AttendanceEvolution",
    model: "audit.logs",
    label: "Evolução",
    fieldLabels: { date: "Data", notes: "Registro" },
    resolveEntityId: ({ relationId }) => relationId,
  },
  filters: { entity: "AttendanceEvolution" },
  sort: [{ field: "createdAt", direction: "desc" }],
  pagination: { limit: 120 },
};

type EvolutionDraft = { date: string; notes: string };

function toDraft(item: ApiAttendanceEvolution): EvolutionDraft {
  return { date: item.date.slice(0, 10), notes: item.notes };
}

function normalizeDraft(draft: EvolutionDraft): EvolutionDraft {
  return { date: draft.date, notes: draft.notes.trim() };
}

export function AttendanceEvolutionDetailPage() {
  const params = useParams<{ id?: string; evolutionId?: string }>();
  const attendanceId = String(params?.id ?? "");
  const evolutionId = String(params?.evolutionId ?? "");
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";

  const [attendanceType, setAttendanceType] = React.useState<string | null>(null);
  const [evolution, setEvolution] = React.useState<ApiAttendanceEvolution | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState<EvolutionDraft>({ date: "", notes: "" });
  const [benefitDialogOpen, setBenefitDialogOpen] = React.useState(false);

  const parentHref = withTenantPath(`/attendances/${attendanceId}`, tenantSlug);
  const referralHref = withTenantPath(`/referrals/new?evolutionId=${evolutionId}`, tenantSlug);

  const handleAddBenefit = React.useCallback(
    async (payload: { name: string; date: string; quantity: number | null; notes: string | null }) => {
      if (!token || !attendanceId || !evolutionId) return;
      await addAttendanceBenefit(token, attendanceId, { ...payload, evolutionId });
      toast({ title: "Benefício lançado" });
    },
    [attendanceId, evolutionId, toast, token],
  );

  const { saving, replaceSavedDraft, commitField } = useDetailAutoSaveController<EvolutionDraft>({
    draft,
    enabled: Boolean(evolution),
    config: AUTO_EDITING,
    normalizeDraft,
    onSave: async (nextDraft) => {
      if (!token) return nextDraft;
      const normalized = normalizeDraft(nextDraft);
      const updated = await updateAttendanceEvolution(token, attendanceId, evolutionId, {
        date: normalized.date,
        notes: normalized.notes,
      });
      const updatedItem = updated.evolutions.find((item) => item.id === evolutionId);
      if (updatedItem) {
        setEvolution(updatedItem);
        return toDraft(updatedItem);
      }
      return nextDraft;
    },
    onError: () => {
      toast({ variant: "destructive", title: "Falha ao salvar evolução" });
    },
  });

  React.useEffect(() => {
    if (!token || !attendanceId || !evolutionId) return;
    setLoading(true);
    getAttendance(token, attendanceId)
      .then((loaded) => {
        setAttendanceType(loaded.type);
        const found = loaded.evolutions.find((item) => item.id === evolutionId) ?? null;
        setEvolution(found);
        if (found) {
          const nextDraft = toDraft(found);
          setDraft(nextDraft);
          replaceSavedDraft(nextDraft);
        }
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Falha ao carregar evolução" });
      })
      .finally(() => setLoading(false));
  }, [attendanceId, evolutionId, replaceSavedDraft, toast, token]);

  const title = evolution ? `Evolução de ${formatDateOnlyPtBR(evolution.date)}` : "Evolução";

  const headerActionsSlot = evolution ? (
    <>
      <Button type="button" variant="default" size="icon-sm" title="Lançar benefício" aria-label="Lançar benefício" onClick={() => setBenefitDialogOpen(true)}>
        <Gift className="h-4 w-4" />
      </Button>
      <Button type="button" variant="default" size="icon-sm" title="Registrar encaminhamento a partir desta evolução" aria-label="Registrar encaminhamento" asChild>
        <Link href={referralHref}>
          <Send className="h-4 w-4" />
        </Link>
      </Button>
    </>
  ) : null;

  return (
    <AttendanceRelationDetailShell
      parentLabel={attendanceType ? ATTENDANCE_TYPE_LABELS[attendanceType] ?? attendanceType : "Atendimento"}
      parentHref={parentHref}
      title={title}
      saving={saving}
      auditConfig={EVOLUTION_AUDIT_CONFIG}
      relationId={evolutionId}
      onClose={() => router.push(parentHref)}
      headerActionsSlot={headerActionsSlot}
    >
      {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
      {!loading && !evolution ? (
        <p className="text-sm text-muted-foreground">Evolução não encontrada.</p>
      ) : null}
      {evolution ? (
        <>
          <DetailSectionField label="Data" required>
            <Input
              type="date"
              value={draft.date}
              onChange={(event) => setDraft((previous) => ({ ...previous, date: event.target.value }))}
              onBlur={() => commitField("date")}
              className={DETAIL_INPUT_CLASS}
            />
          </DetailSectionField>
          <div className="mt-6">
            <DetailSectionField label="Registro" required>
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
      <AttendanceBenefitDialog
        open={benefitDialogOpen}
        onOpenChange={setBenefitDialogOpen}
        onSubmit={handleAddBenefit}
      />
    </AttendanceRelationDetailShell>
  );
}
