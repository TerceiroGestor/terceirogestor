"use client";

import * as React from "react";
import { SectionCard } from "@/components/section-card";
import { FormEngine } from "@/components/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { updateTenantProfile } from "@/features/auth/api";
import { uploadTenantLogo } from "@/features/uploads/api";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { resolveMediaUrl } from "@/lib/api";

type TenantFormValues = {
  name: string;
  logoFile?: File | null;
  cnpj?: string;
  startYear?: number | null;
  description?: string;
};

const tenantFields: FormField<TenantFormValues>[] = [
  {
    name: "name",
    label: "Nome da instituicao",
    type: "text",
    required: true,
  },
  {
    name: "cnpj",
    label: "CNPJ",
    type: "text",
  },
  {
    name: "startYear",
    label: "Ano de inicio",
    type: "number",
  },
  {
    name: "logoFile",
    label: "Logo",
    type: "image",
    helperText: "PNG/JPG/WEBP ate 3MB",
  },
  {
    name: "description",
    label: "Descricao",
    type: "richtext",
  },
];

export default function AdminTenantPage() {
  const { token } = useAuth();
  const { tenant, refresh } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const currentLogo = tenant?.logoUrl ? resolveMediaUrl(tenant.logoUrl) : "";

  const handleSubmit = async (values: TenantFormValues) => {
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      let logoUrl = tenant?.logoUrl ?? undefined;
      if (values.logoFile instanceof File) {
        const uploaded = await uploadTenantLogo(token, values.logoFile);
        logoUrl = uploaded.path;
      }
      await updateTenantProfile(token, {
        name: values.name,
        logoUrl,
        cnpj: values.cnpj,
        startYear: values.startYear ? Number(values.startYear) : undefined,
        description: values.description,
      });
      await refresh();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao atualizar instituicao.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Instituicao"
        items={[
          { label: "Configuracoes", href: "/settings" },
          { label: "Instituicao", href: "/admin/tenant" },
        ]}
      />
      <SectionCard
        title="Instituicao"
        subtitle="Atualize os dados da instituicao e a identidade visual."
      >
        <div className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/20 p-3">
          <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl bg-muted text-sm font-semibold text-muted-foreground">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt={tenant?.name ?? "Logo"}
                className="size-full object-cover"
              />
            ) : (
              "TG"
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {tenant?.name ?? "Instituicao"}
            </p>
            <p className="text-xs text-muted-foreground">
              {tenant?.id ?? ""}
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <FormEngine<TenantFormValues>
          fields={tenantFields}
          initialValues={{
            name: tenant?.name ?? "",
            logoFile: null,
            cnpj: tenant?.cnpj ?? "",
            startYear: tenant?.startYear ?? null,
            description: tenant?.description ?? "",
          }}
          onSubmit={handleSubmit}
          actions={{
            submit: {
              label: isSaving ? "Salvando..." : "Salvar",
            },
          }}
        />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Button variant="outline" size="sm" onClick={refresh}>
            Recarregar dados
          </Button>
          <span>Atualize para ver o logo no sidebar.</span>
        </div>
      </SectionCard>
    </div>
  );
}
