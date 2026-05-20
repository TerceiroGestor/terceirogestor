export type UpsertPersonSensitiveDocumentsInput = {
  cpf?: string;
  rg?: string;
  nis?: string;
  cns?: string;
};

export type PersonSensitiveDocumentsPayload = {
  cpf: string | null;
  rg: string | null;
  nis: string | null;
  cns: string | null;
};