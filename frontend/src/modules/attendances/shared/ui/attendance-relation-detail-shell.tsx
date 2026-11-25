"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import { buildAuditHistoryItems } from "@/web-client/detail/audit-feed-utils";
import { useDetailAuditFeed } from "@/web-client/detail/useDetailAuditFeed";
import type { AuditFeedConfig } from "@/web-client/registry/types";
import { defineRelationDetailModule } from "@/web-client/starter";

type AttendanceRelationDetailShellContext = {
  relationId: string;
};

const attendanceRelationDetailModuleDefinition =
  defineRelationDetailModule<AttendanceRelationDetailShellContext>({
    moduleId: "attendances.relation.detail",
    basePath: "/attendances",
    actionKey: "attendances.relation.detail.screen",
    favoriteKey: "attendances.relation.detail.favorites",
    permissions: {
      canRead: "attendances.read",
    },
  });

type AttendanceRelationDetailShellProps = {
  parentLabel: string;
  parentHref: string;
  title: string;
  saving?: boolean;
  auditConfig?: AuditFeedConfig<AttendanceRelationDetailShellContext>;
  relationId: string | null;
  onClose: () => void;
  children: React.ReactNode;
  headerActionsSlot?: React.ReactNode;
};

/**
 * Versao enxuta de `PeopleRelationDetailShell` pros sub-registros do
 * Atendimento (Evolucao/Beneficio): side so com Auditoria - Tags/Notas/
 * Anexos ficam pra depois, quando Attendance ganhar as tabelas de
 * metadata que Activity ja tem (ver docs/backlog.md).
 */
export function AttendanceRelationDetailShell({
  parentLabel,
  parentHref,
  title,
  saving = false,
  auditConfig,
  relationId,
  onClose,
  children,
  headerActionsSlot,
}: AttendanceRelationDetailShellProps) {
  const { token } = useAuth();
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

  const detailAudit = useDetailAuditFeed({
    dataProvider,
    auditAdapter: { model: "audit.logs" },
    auditConfig,
    context: { relationId: relationId ?? "" },
    enabled: Boolean(relationId && auditConfig && token),
  });
  const historyItems = React.useMemo(
    () => buildAuditHistoryItems(detailAudit?.logs ?? []),
    [detailAudit?.logs],
  );

  return (
    <DetailShellEngine
      moduleDefinition={attendanceRelationDetailModuleDefinition}
      context={{ relationId: relationId ?? "" }}
      dataProvider={dataProvider}
      breadcrumbTitle={title}
      breadcrumbItems={[
        { label: "Atendimentos", href: "/attendances" },
        { label: parentLabel, href: parentHref },
        { label: title },
      ]}
      mode="edit"
      headerTitle={title}
      saving={saving}
      readOnly={false}
      loading={false}
      onClose={onClose}
      headerActionsSlot={headerActionsSlot}
      fallbackSideSlot={
        <StandardDetailMetadataSide
          mode="edit"
          readOnly={false}
          detailAudit={detailAudit}
          auditVisibleCount={auditVisibleCount}
          onAuditVisibleCountChange={setAuditVisibleCount}
          canAudit
          history={{
            items: historyItems,
            emptyLabel: "Nenhum histórico disponível.",
          }}
          tabOrder={["activity"]}
          defaultTab="activity"
        />
      }
      fallbackMainSlot={<div className="space-y-4">{children}</div>}
    />
  );
}
