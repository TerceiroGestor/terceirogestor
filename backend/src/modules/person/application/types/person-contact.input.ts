export type PersonContactType = 'EMAIL' | 'PHONE';

export type PersonContactRole = 'SELF' | 'RESPONSIBLE' | 'EMERGENCY';

export type CreatePersonContactInput = {
  type: PersonContactType;
  value: string;
  role?: PersonContactRole;
  label?: string;
  name?: string;
  relationship?: string;
  isPrimary?: boolean;
  isWhatsapp?: boolean;
  notes?: string;
};

export type UpdatePersonContactInput = {
  type?: PersonContactType;
  value?: string;
  role?: PersonContactRole;
  label?: string;
  name?: string;
  relationship?: string;
  isPrimary?: boolean;
  isWhatsapp?: boolean;
  notes?: string;
};