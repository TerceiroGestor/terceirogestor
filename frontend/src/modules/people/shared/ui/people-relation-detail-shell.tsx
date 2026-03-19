"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { DetailShell } from "@/components/layout/DetailShell";
import { useAuth } from "@/features/auth/auth-context";
import { getPerson } from "@/modules/people/api";
import {
  buildPeopleDetailTabPath,
  type PeopleDetailTabValue,
} from "@/modules/people/shared/domain/people-relation-routes";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailAuditFeed } from "@/web-client/detail/DetailAuditFeed";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { useDetailAuditFeed } from "@/web-client/detail/useDetailAuditFeed";
import type { AuditFeedConfig } from "@/web-client/registry/types";

type PeopleRelationDetailShellProps = {
  personId: string;
  tab: Exclude<PeopleDetailTabValue, "atendimentos" | "resumo">;
  title: string;
  subtitle?: string;
  mode?: "create" | "edit";
  saving?: boolean;
  headerTitleSlot?: React.ReactNode;
  headerActionsSlot?: React.ReactNode;
  notes?: string | null;
  auditConfig?: AuditFeedConfig<{ relationId: string }>;
  relationId?: string | null;
  children: React.ReactNode;
};

export function PeopleRelationDetailShell({
  personId,
  tab,
  title,
  subtitle,
  mode = "edit",
  saving = false,
  headerTitleSlot,
  headerActionsSlot,
  notes,
  auditConfig,
  relationId = null,
  children,
}: PeopleRelationDetailShellProps) {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const [personName, setPersonName] = React.useState("Pessoa");
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

  React.useEffect(() => {
    if (!token || !personId) return;
    let cancelled = false;

    void getPerson(token, personId)
      .then((person) => {
        if (!cancelled) {
          setPersonName(person.fullName || "Pessoa");
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [personId, token]);

  const backHref = withTenantPath(buildPeopleDetailTabPath(personId, tab), tenantSlug);
  const detailAudit = useDetailAuditFeed({
    dataProvider,
    auditAdapter: { model: "audit.logs" },
    auditConfig,
    context: { relationId: relationId ?? "" },
    enabled: Boolean(relationId && auditConfig && token),
  });

  return (
    <DetailShell
      breadcrumbTitle={title}
      breadcrumbItems={[
        { label: "Pessoas", href: "/people" },
        { label: personName, href: buildPeopleDetailTabPath(personId, tab) },
        { label: title },
      ]}
      mode={mode}
      headerTitle={title}
      headerTitleSlot={headerTitleSlot}
      saving={saving}
      readOnly={false}
      onClose={() => router.push(backHref)}
      headerActionsSlot={headerActionsSlot}
      sideSlot={
        <DetailSideTabs
          tabs={[
            {
              value: "activity",
              label: "Auditoria",
              content: (
                <DetailAuditFeed
                  mode={mode}
                  auditState={detailAudit}
                  auditVisibleCount={auditVisibleCount}
                  onAuditVisibleCountChange={setAuditVisibleCount}
                  emptyLabel="Sem auditoria registrada."
                />
              ),
            },
            {
              value: "notes",
              label: "Notas internas",
              content: (
                <div className="border-t border-border/50 pt-4 text-sm text-muted-foreground">
                  {notes?.trim()
                    ? notes
                    : "Use o campo de notas do formulario para registrar observacoes deste item."}
                </div>
              ),
            },
          ]}
          defaultValue="activity"
        />
      }
      mainSlot={
        <div className="space-y-4">
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          {children}
        </div>
      }
    />
  );
}
