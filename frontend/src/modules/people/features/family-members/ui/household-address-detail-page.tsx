"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { FamilyRelationsProvider } from "@/modules/people/features/family-members/context/family-relations-context";
import { HouseholdAddressPanel } from "@/modules/people/features/family-members/ui/household-address-panel";
import { buildPeopleDetailTabPath } from "@/modules/people/shared/domain/people-relation-routes";

export function HouseholdAddressDetailPage() {
  const params = useParams<{ id?: string }>();
  const personId = String(params?.id ?? "");
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  if (!personId) {
    return <div className="text-sm text-destructive">Pessoa nao encontrada.</div>;
  }

  return (
    <FamilyRelationsProvider personId={personId} initialMode="detailed" autoLoad>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Endereco</h1>
            <p className="text-sm text-muted-foreground">Cadastro do endereco do nucleo familiar.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                withTenantPath(buildPeopleDetailTabPath(personId, "endereco"), tenantSlug),
              )
            }
          >
            Voltar
          </Button>
        </div>

        <HouseholdAddressPanel />
      </div>
    </FamilyRelationsProvider>
  );
}
