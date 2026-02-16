"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { requestPasswordReset } from "@/features/auth/api";
import { API_URL, resolveMediaUrl } from "@/lib/api";
import { withTenantPath } from "@/lib/tenant-path";

type TenantPreview = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
};

export default function ForgotPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const slug = typeof params?.tenant === "string" ? params.tenant : "";
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [tenant, setTenant] = React.useState<TenantPreview | null>(null);
  const [tenantError, setTenantError] = React.useState<string | null>(null);

  const fetchTenantBySlug = React.useCallback(async (tenantSlug: string) => {
    const response = await fetch(`${API_URL}/tenants/slug/${tenantSlug}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Instituição não encontrada");
    }
    return response.json() as Promise<TenantPreview>;
  }, []);

  React.useEffect(() => {
    if (!slug) return;
    let active = true;
    setTenantError(null);
    fetchTenantBySlug(slug)
      .then((data) => {
        if (active) setTenant(data);
      })
      .catch((err) => {
        if (!active) return;
        setTenant(null);
        setTenantError(
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Instituição não encontrada",
        );
      });
    return () => {
      active = false;
    };
  }, [slug, fetchTenantBySlug]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Email",
        description: "Informe um email válido.",
      });
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      toast({
        title: "Pronto",
        description:
          "Se existir uma conta com este email, enviaremos um link de redefinição.",
      });
      router.replace(withTenantPath("/login", slug));
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao solicitar redefinição.";
      toast({ variant: "destructive", title: "Erro", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen w-full flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-5xl mx-auto bg-white [box-shadow:0_2px_10px_-3px_rgba(6,81,237,0.3)] p-4 lg:p-5 rounded-md"
      >
        <div className="grid md:grid-cols-[1.05fr_0.95fr] items-center gap-y-8 gap-x-8">
          <div className="w-full h-full">
            <div className="aspect-square rounded-md overflow-hidden w-full h-full flex items-center justify-center">
              {tenant?.logoUrl ? (
                <img
                  src={resolveMediaUrl(tenant.logoUrl)}
                  className="max-h-120 w-auto object-contain"
                  alt={tenant.name}
                />
              ) : (
                <div className="text-sm text-slate-400">Logo da instituição</div>
              )}
            </div>
          </div>

          <div className="max-w-md mx-auto w-full p-4 md:p-6">
            <div className="mb-6">
              <h2 className="text-slate-900 text-lg font-semibold">
                {tenant?.name ? `${tenant.name}` : ""}
              </h2>
              <p className="text-sm text-slate-500">
                Informe o email para receber o link de redefinição.
              </p>
            </div>

            {tenantError ? (
              <p className="mb-3 text-xs text-red-600">{tenantError}</p>
            ) : null}

            <div className="space-y-6">
              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  autoComplete="email"
                  className="w-full text-sm text-slate-900 bg-slate-100 focus:bg-transparent pl-4 pr-10 py-3 rounded-md border border-slate-100 focus:border-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-8">
              <Button
                type="submit"
                className="w-full shadow-xl py-2 px-4 text-[15px] tracking-wide font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-3"
                onClick={() => router.push(withTenantPath("/login", slug))}
                disabled={loading}
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
