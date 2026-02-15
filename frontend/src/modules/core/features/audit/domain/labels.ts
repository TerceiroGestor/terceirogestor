import type { AdminAuditLogAction } from "@/features/admin/api";

export const auditActionLabels: Record<AdminAuditLogAction, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
};

