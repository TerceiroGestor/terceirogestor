export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 1000;

export const SEX_OPTIONS = [
  'Masculino',
  'Feminino',
  'Intersexo',
  'Nao informado',
] as const;

export const GENDER_OPTIONS = [
  'Homem',
  'Mulher',
  'Nao binario',
  'Genero fluido',
  'Agenero',
  'Outro',
  'Prefiro nao informar',
] as const;

export const RACE_COLOR_OPTIONS = [
  'Branca',
  'Preta',
  'Parda',
  'Amarela',
  'Indigena',
  'Prefiro nao informar',
] as const;

export const STATUS_OPTIONS = [
  'Ativo',
  'Inativo',
  'Em espera',
  'Em analise',
  'Desligado',
] as const;

export const PERSON_TYPE_OPTIONS = [
  'Atendido',
  'Familiar',
  'Funcionario',
  'Voluntario',
  'Oficineiro',
  'Parceiro',
  'Doador',
] as const;

export const PERSON_UPLOAD_PATH_PREFIXES = ['/uploads/people/'] as const;

export const PERSON_RECORD_TYPES = [
  'education',
  'health-condition',
  'medication',
  'detention',
  'financial-entry',
  'family-relation',
  'contact',
] as const;

export type PersonRecordType = (typeof PERSON_RECORD_TYPES)[number];