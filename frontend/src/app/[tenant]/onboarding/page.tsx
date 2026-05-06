"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { withTenantPath } from "@/lib/tenant-path";

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = typeof params?.tenant === "string" ? params.tenant : "";
  const { isLoading } = useRequireAuth();
  const { tenant } = useCurrentUser();

  React.useEffect(() => {
    if (!tenantSlug) return;
    router.replace(withTenantPath("/dashboard", tenantSlug));
  }, [router, tenantSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-sm font-medium text-slate-700">Iniciando seu tour guiado no sistema...</p>
        <p className="mt-2 text-xs text-slate-500">
          {tenant?.name ?? "Sua instituicao"}: voce sera redirecionado para a operacao principal.
        </p>
      </div>
    </div>
  );
}
