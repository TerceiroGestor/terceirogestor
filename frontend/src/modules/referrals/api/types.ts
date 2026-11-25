export type ReferralType =
  | "SAUDE"
  | "EDUCACAO"
  | "CONSELHO_TUTELAR"
  | "ASSISTENCIA_SOCIAL"
  | "JURIDICO"
  | "OUTRO";

export type ReferralStatus = "ABERTO" | "EM_ACOMPANHAMENTO" | "ENCERRADO";

export type ApiReferralAttachment = {
  id: string;
  label: string;
  filePath: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  uploadedBy: {
    id: string | null;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiReferralDestination = {
  id: string;
  tenantId: string;
  name: string;
  contactInfo: string | null;
  responsibleName: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReferralDestinationInput = {
  name: string;
  contactInfo?: string | null;
  responsibleName?: string | null;
  address?: string | null;
  isActive?: boolean;
};

export type ApiReferral = {
  id: string;
  tenantId: string;
  attendanceId: string;
  evolutionId: string;
  destinationId: string;
  type: ReferralType;
  status: ReferralStatus;
  outcomeNotes: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attendance: {
    id: string;
    type: "SOCIAL" | "PSICOLOGICO";
    scheduledDate: string;
  };
  evolution: {
    id: string;
    date: string;
    notes: string;
  };
  destination: {
    id: string;
    name: string;
  };
  attachments: ApiReferralAttachment[];
};

/**
 * `evolutionId` so e enviado na criacao (vinculo de origem, imutavel
 * depois) - update nunca manda esse campo. Ver
 * docs/terceiro-gestor-plano-de-desenvolvimento-modulos-atendimento-e-projetos.md,
 * secao "Revisao da Fase 7".
 */
export type ReferralInput = {
  evolutionId?: string;
  destinationId: string;
  type: ReferralType;
  status?: ReferralStatus;
  outcomeNotes?: string | null;
};

export type ReferralAttachmentInput = {
  label: string;
  filePath: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
};

export type ReferralsListResponse = {
  data: ApiReferral[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type ReferralsDashboard = {
  openCount: number;
  averageClosingDays: number | null;
};
