"use client";

import * as React from "react";
import { Copy, Save } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  getPersonSensitiveDocuments,
  upsertPersonSensitiveDocuments,
} from "@/modules/people/api";
import type { ApiError } from "@/lib/api";

type FormState = {
  cpf: string;
  rg: string;
  nis: string;
  cns: string;
};

const emptyForm = (seed?: Partial<FormState>): FormState => ({
  cpf: seed?.cpf ?? "",
  rg: seed?.rg ?? "",
  nis: seed?.nis ?? "",
  cns: seed?.cns ?? "",
});

const lineInputClassName =
  "h-10 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0";
const fieldLabelClassName =
  "text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";

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

function safeErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: string }).message);
  }
  return fallback;
}

export function PersonSensitiveDocumentsInlineForm({
  personId,
  canRead,
  canUpdate,
  readOnly,
}: {
  personId: string;
  canRead: boolean;
  canUpdate: boolean;
  readOnly: boolean;
}) {
  const { token } = useAuth();
  const { refresh: refreshCurrentUser } = useCurrentUser();
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm());

  const canEdit = canUpdate && !readOnly;

  const load = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    try {
      const data = await getPersonSensitiveDocuments(token, personId);
      setForm(
        emptyForm({
          cpf: data?.cpf ?? "",
          rg: data?.rg ?? "",
          nis: data?.nis ?? "",
          cns: data?.cns ?? "",
        }),
      );
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      if (apiError?.status === 403) {
        toast({
          title: "Permissão negada",
          description: "Você não tem acesso para visualizar documentos sensíveis.",
          variant: "destructive",
        });
        await refreshCurrentUser();
        return;
      }
      toast({
        title: "Falha ao carregar documentos",
        description: safeErrorMessage(err, "Tente novamente."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [canRead, personId, refreshCurrentUser, toast, token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleCopy = React.useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || !navigator?.clipboard?.writeText) return;
      navigator.clipboard.writeText(trimmed);
      toast({ title: "Copiado", description: "Valor copiado para a área de transferência." });
    },
    [toast],
  );

  const handleSave = React.useCallback(async () => {
    if (!token || !canEdit) return;
    setSaving(true);
    try {
      await upsertPersonSensitiveDocuments(token, personId, {
        cpf: form.cpf,
        rg: form.rg,
        nis: form.nis,
        cns: form.cns,
      });
      toast({
        title: "Documentos atualizados",
        description: "As alterações foram salvas. O acesso é auditado (LGPD).",
      });
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      if (apiError?.status === 403) {
        toast({
          title: "Permissão negada",
          description: "Você não tem acesso para editar documentos sensíveis.",
          variant: "destructive",
        });
        await refreshCurrentUser();
        return;
      }
      toast({
        title: "Falha ao salvar documentos",
        description: safeErrorMessage(err, "Verifique os dados e tente novamente."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [canEdit, form.cns, form.cpf, form.nis, form.rg, personId, refreshCurrentUser, toast, token]);

  if (!canRead && !canUpdate) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-4 text-sm text-muted-foreground">
        Você não possui permissão para acessar documentos sensíveis.
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-4 text-sm text-muted-foreground">
        Você não tem permissão para visualizar documentos sensíveis.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-sm font-medium text-foreground">Documentos sensíveis</div>
        <p className="text-sm text-muted-foreground">
          CPF, RG, NIS e CNS são protegidos e auditados conforme LGPD.
        </p>
      </div>

      {loading ? <div className="text-sm text-muted-foreground">Carregando...</div> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {([
          { key: "cpf", label: "CPF", placeholder: "Somente dígitos (11)" },
          { key: "rg", label: "RG", placeholder: "Ex.: MG-12.345.678" },
          { key: "nis", label: "NIS", placeholder: "Somente dígitos (11)" },
          { key: "cns", label: "CNS (Cartão SUS)", placeholder: "Somente dígitos (15)" },
        ] as const).map((field) => (
          <SectionField label={field.label} key={field.key}>
            <div className="flex items-center gap-2">
              <Input
                value={form[field.key]}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, [field.key]: event.target.value }))
                }
                placeholder={field.placeholder}
                disabled={!canEdit}
                className={lineInputClassName}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleCopy(form[field.key])}
                title={`Copiar ${field.label}`}
                disabled={!form[field.key].trim()}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </SectionField>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={!canEdit || saving}>
          <Save className="mr-2 h-4 w-4" />
          Salvar
        </Button>
      </div>

      {!canEdit ? (
        <p className="text-xs text-muted-foreground">
          Você não tem permissão para editar documentos sensíveis.
        </p>
      ) : null}
    </div>
  );
}
