"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEngine } from "@/components/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { useToast } from "@/components/ui/use-toast";
import { storeTenantSlug, withTenantPath } from "@/lib/tenant-path";
import {
  confirmTenantRegistration,
  getTenantRegistration,
  type TenantRegistrationInfo,
} from "@/modules/core/api/registration";

type ConfirmValues = {
  code: string;
  password?: string;
  passwordConfirm?: string;
};

export function RegisterConfirmClientPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const registrationId = params.get("rid") ?? "";

  const [info, setInfo] = React.useState<TenantRegistrationInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const run = async () => {
      if (!registrationId) return;
      setIsLoading(true);
      try {
        const payload = await getTenantRegistration(registrationId);
        if (active) setInfo(payload);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Erro", description: error?.message ?? "Registro inválido." });
      } finally {
        if (active) setIsLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [registrationId, toast]);

  const fields = React.useMemo<FormField<ConfirmValues>[]>(() => {
    const base: FormField<ConfirmValues>[] = [{ name: "code", label: "Código", type: "text", required: true }];
    if (info?.passwordRequired) {
      base.push({ name: "password", label: "Definir senha", type: "password", required: true });
      base.push({ name: "passwordConfirm", label: "Confirmar senha", type: "password", required: true });
    }
    return base;
  }, [info?.passwordRequired]);

  const initialValues = React.useMemo<ConfirmValues>(() => ({ code: "" }), []);

  const handleSubmit = async (values: ConfirmValues) => {
    if (!registrationId) return;
    if (info?.passwordRequired && values.password !== values.passwordConfirm) {
      toast({ variant: "destructive", title: "Senha", description: "As senhas não conferem." });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = await confirmTenantRegistration({
        registrationId,
        code: values.code,
        ...(info?.passwordRequired ? { password: values.password } : {}),
      });

      storeTenantSlug(payload.tenantSlug);
      window.dispatchEvent(new CustomEvent("auth:token", { detail: { token: payload.accessToken } }));
      toast({ variant: "success", title: "Conta criada", description: "Bem-vindo!" });
      router.replace(withTenantPath("/dashboard", payload.tenantSlug));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error?.message ?? "Falha ao confirmar." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!registrationId) {
    return <div className="p-6">Registro não informado.</div>;
  }

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6 md:p-10 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Confirmar cadastro</h1>
          <p className="text-sm text-muted-foreground">
            {info?.adminEmail ? `Enviamos um código para ${info.adminEmail}.` : "Enviamos um código para seu email."}
          </p>
        </div>

        <FormEngine<ConfirmValues>
          fields={fields}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
          actions={{
            submit: { label: isSubmitting ? "Confirmando..." : "Confirmar", variant: "primary" },
          }}
        />
      </div>
    </div>
  );
}
