"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-context";
import { API_URL, apiRequest, resolveMediaUrl } from "@/lib/api";
import {
  getTenantSlugFromPath,
  storeTenantSlug,
  withTenantPath,
} from "@/lib/tenant-path";

type TenantPreview = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
};

type LoginFormProps = {
  tenantSlug?: string | null;
};

export function LoginForm({ tenantSlug }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const resolvedSlug = tenantSlug ?? getTenantSlugFromPath(pathname);
  const { login } = useAuth();

  const [email, setEmail] = React.useState("admin@exemplo.com");
  const [password, setPassword] = React.useState("Admin@123");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tenant, setTenant] = React.useState<TenantPreview | null>(null);
  const [tenantError, setTenantError] = React.useState<string | null>(null);

  const fetchTenantBySlug = React.useCallback(async (slug: string) => {
    const response = await fetch(`${API_URL}/tenants/slug/${slug}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Instituição não encontrada");
    }
    return response.json() as Promise<TenantPreview>;
  }, []);

  React.useEffect(() => {
    if (!resolvedSlug) return;
    let active = true;
    setTenantError(null);
    fetchTenantBySlug(resolvedSlug)
      .then((data) => {
        if (active) {
          setTenant(data);
        }
      })
      .catch((err) => {
        if (active) {
          setTenant(null);
          setTenantError(
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: string }).message)
              : "Instituição não encontrada",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [resolvedSlug, fetchTenantBySlug]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      if (resolvedSlug) {
        storeTenantSlug(resolvedSlug);
      }
      const next = searchParams.get("next") ?? "/dashboard";
      router.replace(withTenantPath(next, resolvedSlug ?? null));
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha no login";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto bg-white [box-shadow:0_2px_10px_-3px_rgba(6,81,237,0.3)] p-4 lg:p-5 rounded-md">
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
                <div className="text-sm text-slate-400">
                  Logo da instituição
                </div>
              )}
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="max-w-md mx-auto w-full p-4 md:p-6"
          >
            <div className="mb-6">
              <h2 className="text-slate-900 text-lg font-semibold">
                {tenant?.name ? `${tenant.name}` : ""}
              </h2>
              <p className="text-sm text-slate-500">
                Informe as credenciais para entrar na instituição.
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
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full text-sm text-slate-900 bg-slate-100 focus:bg-transparent pl-4 pr-10 py-3 rounded-md border border-slate-100 focus:border-blue-600 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  Senha
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Senha"
                  className="w-full text-sm text-slate-900 bg-slate-100 focus:bg-transparent pl-4 pr-10 py-3 rounded-md border border-slate-100 focus:border-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            {error ? (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            ) : null}

            <div className="mt-8">
              <Button
                type="submit"
                className="w-full shadow-xl py-2 px-4 text-[15px] tracking-wide font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
