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
  "Em analise",
  "Desligado",
] as const;

export const SEX_LABELS: Record<(typeof SEX_OPTIONS)[number], string> = {
  Masculino: "Masculino",
  Feminino: "Feminino",
  Intersexo: "Intersexo",
  "Nao informado": "Nao informado",
};

export const GENDER_LABELS: Record<(typeof GENDER_OPTIONS)[number], string> = {
  Homem: "Homem",
  Mulher: "Mulher",
  "Nao binario": "Nao binario",
  "Genero fluido": "Genero fluido",
  Agenero: "Agenero",
  Outro: "Outro",
  "Prefiro nao informar": "Prefiro nao informar",
};

export const RACE_COLOR_LABELS: Record<
  (typeof RACE_COLOR_OPTIONS)[number],
  string
> = {
  Branca: "Branca",
  Preta: "Preta",
  Parda: "Parda",
  Amarela: "Amarela",
  Indigena: "Indigena",
  "Prefiro nao informar": "Prefiro nao informar",
};
