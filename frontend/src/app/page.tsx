"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import {
  readStoredTenantSlug,
  storeTenantSlug,
  withTenantPath,
} from "@/lib/tenant-path";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [tenantSlug, setTenantSlug] = React.useState("");

  React.useEffect(() => {
    if (isLoading) return;
    const stored = readStoredTenantSlug();
    if (!stored) return;
    const target = isAuthenticated ? "/dashboard" : "/login";
    router.replace(withTenantPath(target, stored));
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenantSlug.trim()) return;
    const slug = tenantSlug.trim();
    storeTenantSlug(slug);
    router.replace(withTenantPath("/login", slug));
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Acessar instituicao</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe o identificador da instituicao para continuar.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            value={tenantSlug}
            onChange={(event) => setTenantSlug(event.target.value)}
            placeholder="instituicao-exemplo"
          />
          <Button type="submit" className="w-full">
            Continuar
          </Button>
        </form>
      </div>
    </div>
  );
}
