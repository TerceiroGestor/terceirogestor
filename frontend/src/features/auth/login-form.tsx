"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-context";
import { apiRequest, resolveMediaUrl } from "@/lib/api";
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

  React.useEffect(() => {
    if (!resolvedSlug) return;
    let active = true;
    apiRequest<TenantPreview>(`/tenants/slug/${resolvedSlug}`)
      .then((data) => {
        if (active) {
          setTenant(data);
        }
      })
      .catch(() => {
        if (active) {
          setTenant(null);
        }
      });
    return () => {
      active = false;
    };
  }, [resolvedSlug]);

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
    <div className="min-h-[calc(100vh-64px)] px-4 py-10 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            {tenant?.logoUrl ? (
              <div className="flex size-11 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(tenant.logoUrl)}
                  alt={tenant.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div>
              <CardTitle>Acesso</CardTitle>
              <p className="text-xs text-muted-foreground">
                {tenant?.name ?? "Informe as credenciais para entrar."}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Ambiente de desenvolvimento. Use as credenciais de seed para entrar.
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Senha"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
