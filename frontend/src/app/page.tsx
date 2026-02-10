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
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-md p-6 md:p-10">
        {/* Grid Interno */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Coluna 1 - Formulário */}
          <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
            {/* Campo */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instituição
                </label>

                <Input
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  placeholder="instituicao-exemplo"
                  className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Botão */}
            <div className="mt-8">
              <Button
                type="submit"
                className="w-full rounded-md bg-blue-600 py-3 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Continuar
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Exemplo: instituicao-exemplo
              </p>
            </div>
          </form>

          {/* Coluna 2 - Logo Grande */}
          <div className="hidden md:flex items-center justify-center">
            <div className="w-full h-full max-w-sm bg-gray-50 rounded-lg flex items-center justify-center p-10">
              <img
                src="/uploads/system/logo.png"
                alt="TerceiroGestor"
                className="w-60 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
