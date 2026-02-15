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

export const PERSON_TYPE_OPTIONS = ["Atendido", "Familiar"] as const;

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
