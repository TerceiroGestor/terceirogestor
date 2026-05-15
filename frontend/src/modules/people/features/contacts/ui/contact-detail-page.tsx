"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { ContactForm } from "@/modules/people/features/contacts/ui/contact-form";
import type { ContactFormValues } from "@/modules/people/features/contacts/config/contact-form-config";
import { useContacts } from "@/modules/people/features/contacts/data/use-contacts";
import type { ApiPersonContact, PersonContactInput } from "@/modules/people/api";
import {
  buildPeopleContactPath,
  buildPeopleDetailTabPath,
} from "@/modules/people/shared/domain/people-relation-routes";
import { PeopleRelationDetailShell } from "@/modules/people/shared/ui/people-relation-detail-shell";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import type { AuditFeedConfig, DetailEditingConfig } from "@/web-client/registry/types";

type ContactDraftValues = ContactFormValues & {
  notes: string;
};

function initialFormValues(item?: ApiPersonContact): ContactFormValues {
  return {
    role: item?.role ?? "SELF",
    type: item?.type ?? "PHONE",
    value: item?.value ?? "",
    label: item?.label ?? "",
    name: item?.name ?? "",
    relationship: item?.relationship ?? "",
    isPrimary: Boolean(item?.isPrimary),
    isWhatsapp: Boolean(item?.isWhatsapp),
  };
}

function initialDraftValues(item?: ApiPersonContact): ContactDraftValues {
  return {
    ...initialFormValues(item),
    notes: item?.notes ?? "",
  };
}

const AUTO_EDITING: DetailEditingConfig = {
  saveMode: "auto",
  autoSave: { trigger: "field-commit" },
};

const CONTACT_AUDIT_CONFIG: AuditFeedConfig<{ relationId: string }> = {
  primaryEntity: {
    key: "contact",
    entity: "PersonContact",
    model: "audit.logs",
    label: "Contato",
    fieldLabels: {
      role: "Categoria",
      type: "Tipo",
      value: "Valor",
      label: "Rótulo",
      name: "Nome",
      relationship: "Parentesco",
      isPrimary: "Contato principal",
      isWhatsapp: "WhatsApp",
      notes: "Notas",
    },
    valueFormatters: {
      isPrimary: (value) => (value ? "Sim" : "Nao"),
      isWhatsapp: (value) => (value ? "Sim" : "Nao"),
    },
    resolveEntityId: ({ relationId }) => relationId,
  },
  filters: { entity: "PersonContact" },
  sort: [{ field: "createdAt", direction: "desc" }],
  pagination: { limit: 120 },
};

function normalizeDraft(values: ContactDraftValues): ContactDraftValues {
  return {
    ...values,
    value: (values.value ?? "").trim(),
    label: (values.label ?? "").trim(),
    name: (values.name ?? "").trim(),
    relationship: (values.relationship ?? "").trim(),
    notes: (values.notes ?? "").trim(),
    isPrimary: Boolean(values.isPrimary),
    isWhatsapp: values.type === "PHONE" ? Boolean(values.isWhatsapp) : false,
  };
}

export function ContactDetailPage({ mode }: { mode: "create" | "edit" }) {
  const params = useParams<{ id?: string; contactId?: string }>();
  const personId = String(params?.id ?? "");
  const contactId = mode === "edit" ? String(params?.contactId ?? "") : "";
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { contacts, isLoading, create, update } = useContacts(personId);
  const createInitialValues = React.useMemo(() => initialDraftValues(), []);

  const current = React.useMemo(
    () => contacts.find((item) => item.id === contactId) ?? null,
    [contactId, contacts],
  );
  const backHref = withTenantPath(buildPeopleDetailTabPath(personId, "contatos"), tenantSlug);
  const [draft, setDraft] = React.useState<ContactDraftValues>(createInitialValues);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const relationIdRef = React.useRef<string | null>(contactId || null);
  const [activeRelationId, setActiveRelationId] = React.useState<string | null>(contactId || null);

  const { saving, replaceSavedDraft, commitDraft } = useDetailAutoSaveController({
    draft,
    enabled: mode === "edit" && Boolean(token),
    config: AUTO_EDITING,
    normalizeDraft,
    onSave: async (values) => {
      if (!token) return values;
      if (!values.value.trim()) return values;
      if (values.role !== "SELF" && !values.name?.trim()) return values;

      const payload: PersonContactInput = {
        type: values.type,
        role: values.role,
        value: values.value.trim(),
        label: values.label?.trim() || null,
        name: values.role === "SELF" ? null : values.name?.trim() || null,
        relationship: values.relationship?.trim() || null,
        isPrimary: Boolean(values.isPrimary),
        isWhatsapp: values.type === "PHONE" ? Boolean(values.isWhatsapp) : false,
        notes: values.notes?.trim() || null,
      };

      if (!relationIdRef.current) {
        const created = await create(payload);
        if (!created) return values;
        relationIdRef.current = created.id;
        setActiveRelationId(created.id);
        const nextPath = withTenantPath(
          buildPeopleContactPath(personId, created.id),
          tenantSlug,
        );
        router.replace(nextPath);
        return initialDraftValues(created);
      }

      const updated = await update(relationIdRef.current, payload);
      return initialDraftValues(updated ?? current ?? undefined);
    },
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar contato.";
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

  const handleValuesChange = React.useCallback((values: ContactFormValues) => {
    setDraft((previous) => ({ ...previous, ...values }));
  }, []);

  const handleFieldCommit = React.useCallback(
    (values: ContactFormValues) => {
      const nextDraft: ContactDraftValues = { ...draft, ...values };
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
      recordType="contact"
      tab="contatos"
      title={mode === "create" ? "Novo contato" : "Contato"}
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
      primarySaveDisabled={
        mode === "create" &&
        (!draft.value.trim() ||
          (draft.role !== "SELF" && !(draft.name ?? "").trim()))
      }
      relationId={activeRelationId}
      auditConfig={CONTACT_AUDIT_CONFIG}
      notes={draft.notes}
      onNotesChange={handleNotesChange}
      onNotesCommit={handleNotesCommit}
    >
      {saveError ? <div className="text-sm text-destructive">{saveError}</div> : null}
      {mode === "edit" && isLoading && !current ? (
        <div className="text-sm text-muted-foreground">Carregando contato...</div>
      ) : null}
      {mode === "edit" && !isLoading && !current ? (
        <div className="text-sm text-muted-foreground">Contato não encontrado.</div>
      ) : null}
      {mode === "create" || current ? (
        <ContactForm
          initialValues={
            mode === "create"
              ? initialFormValues()
              : initialFormValues(current ?? undefined)
          }
          hideActions
          submitLabel="Salvar"
          onCancel={() => router.push(backHref)}
          onValuesChange={handleValuesChange}
          onFieldCommit={handleFieldCommit}
          onSubmit={async (values) => {
            const nextDraft: ContactDraftValues = { ...draft, ...values };
            setDraft(nextDraft);
            setSaveError(null);
            await commitDraft(nextDraft);
          }}
        />
      ) : null}
    </PeopleRelationDetailShell>
  );
}
