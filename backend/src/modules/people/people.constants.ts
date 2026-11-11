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

// Status interno de exclusão lógica (soft delete) - de propósito fora de
// STATUS_OPTIONS, para que nenhum DTO de create/update (@IsIn(STATUS_OPTIONS))
// aceite esse valor. Só o fluxo de remove() pode marcar uma pessoa assim.
export const EXCLUDED_PERSON_STATUS = 'Excluido';

export const PERSON_TYPE_OPTIONS = [
  'Atendido',
  'Familiar',
  'Funcionario',
  'Voluntario',
  'Oficineiro',
  'Parceiro',
  'Doador',
] as const;
