export const SEX_OPTIONS = [
  "Masculino",
  "Feminino",
  "Intersexo",
  "Nao informado",
] as const;

export const GENDER_OPTIONS = [
  "Homem",
  "Mulher",
  "Nao binario",
  "Genero fluido",
  "Agenero",
  "Outro",
  "Prefiro nao informar",
] as const;

export const RACE_COLOR_OPTIONS = [
  "Branca",
  "Preta",
  "Parda",
  "Amarela",
  "Indigena",
  "Prefiro nao informar",
] as const;

export const STATUS_OPTIONS = [
  "Ativo",
  "Inativo",
  "Em espera",
  "Em analise",
  "Desligado",
] as const;

export const PERSON_TYPE_OPTIONS = [
  "Atendido",
  "Familiar",
  "Funcionario",
  "Voluntario",
  "Oficineiro",
  "Parceiro",
  "Doador",
] as const;

export const SEX_LABELS: Record<(typeof SEX_OPTIONS)[number], string> = {
  Masculino: "Masculino",
  Feminino: "Feminino",
  Intersexo: "Intersexo",
  "Nao informado": "Não informado",
};

export const GENDER_LABELS: Record<(typeof GENDER_OPTIONS)[number], string> = {
  Homem: "Homem",
  Mulher: "Mulher",
  "Nao binario": "Não binário",
  "Genero fluido": "Gênero fluido",
  Agenero: "Agênero",
  Outro: "Outro",
  "Prefiro nao informar": "Prefiro não informar",
};

export const RACE_COLOR_LABELS: Record<
  (typeof RACE_COLOR_OPTIONS)[number],
  string
> = {
  Branca: "Branca",
  Preta: "Preta",
  Parda: "Parda",
  Amarela: "Amarela",
  Indigena: "Indígena",
  "Prefiro nao informar": "Prefiro não informar",
};

export const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  Ativo: "Ativo",
  Inativo: "Inativo",
  "Em espera": "Em espera",
  "Em analise": "Em análise",
  Desligado: "Desligado",
};

export const PERSON_TYPE_LABELS: Record<(typeof PERSON_TYPE_OPTIONS)[number], string> = {
  Atendido: "Atendido",
  Familiar: "Familiar",
  Funcionario: "Funcionário",
  Voluntario: "Voluntário",
  Oficineiro: "Oficineiro",
  Parceiro: "Parceiro",
  Doador: "Doador",
};

export const MARITAL_STATUS_OPTIONS = [
  { label: "Solteiro(a)", value: "Solteiro(a)" },
  { label: "Casado(a)", value: "Casado(a)" },
  { label: "Divorciado(a)", value: "Divorciado(a)" },
  { label: "Viúvo(a)", value: "Viuvo(a)" },
] as const;
