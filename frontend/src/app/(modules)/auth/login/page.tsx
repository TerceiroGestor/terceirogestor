"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginForm } from "@/features/auth/login-form";
import {
  readStoredTenantSlug,
  storeTenantSlug,
  withTenantPath,
} from "@/lib/tenant-path";

function TenantLoginEntry() {
  const router = useRouter();
  const [slug, setSlug] = React.useState(readStoredTenantSlug() ?? "");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!slug.trim()) return;
    const nextSlug = slug.trim();
    storeTenantSlug(nextSlug);
    router.replace(withTenantPath("/login", nextSlug));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Acessar instituicao</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe o identificador da instituicao para continuar.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
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

export default function LoginPage() {
  const stored = readStoredTenantSlug();
  if (!stored) {
    return <TenantLoginEntry />;
  }
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] px-4 py-10 flex items-center justify-center text-sm text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <LoginForm tenantSlug={stored} />
    </React.Suspense>
  );
}
