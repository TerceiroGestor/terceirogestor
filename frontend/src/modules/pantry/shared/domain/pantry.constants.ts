export const PANTRY_ITEM_UNIT = [
  { label: "Unidade (Un)", value: "Un" },
  { label: "Kilograma (Kg)", value: "Kg" },
  { label: "Grama (g)", value: "g" },
  { label: "Litro (L)", value: "L" },
  { label: "Mililitro (ml)", value: "ml" },
] as const;

export const PANTRY_ITEM_GROUP = [
  { label: "Grãos e Cereais", value: "GraosCereais" },
  { label: "Leguminosas", value: "Leguminosas" },
  { label: "Farinhas e Derivados", value: "FarinhasDerivados" },
  { label: "Massas", value: "Massas" },
  { label: "Óleos e Gorduras", value: "OleosGorduras" },
  { label: "Temperos e Condimentos", value: "TemperosCondimentos" },
  { label: "Açúcares e Adoçantes", value: "AcucaresAdocantes" },
  { label: "Enlatados", value: "Enlatados" },
  { label: "Conservas", value: "Conservas" },
  { label: "Molhos", value: "Molhos" },
  { label: "Alimentos Prontos", value: "AlimentosProntos" },
  { label: "Café e Chás", value: "CafeChas" },
  { label: "Leite e Derivados", value: "LeiteDerivados" },
  { label: "Achocolatados", value: "Achocolatados" },
  { label: "Biscoitos e Bolachas", value: "BiscoitosBolachas" },
  { label: "Snacks e Salgadinhos", value: "SnacksSalgadinhos" },
  { label: "Doces e Sobremesas", value: "DocesSobremesas" },
  { label: "Cereais Matinais", value: "CereaisMatinais" },
  { label: "Produtos Diet e Light", value: "DietLight" },
  { label: "Produtos Integrais", value: "Integrais" },
  { label: "Alimentos Infantis", value: "AlimentosInfantis" },
  { label: "Bebidas", value: "Bebidas" },
  { label: "Suplementos Alimentares", value: "Suplementos" },
  { label: "Hortifruti", value: "Hortifruti" },
  { label: "Proteínas Animais", value: "ProteinasAnimais" },
  { label: "Congelados", value: "Congelados" },
  { label: "Panificados", value: "Panificados" },
  { label: "Outros", value: "Outros" },
] as const;

export const PANTRY_DEFAULT_SECTOR = "Geral" as const;
export const PANTRY_DEFAULT_UNIT = "kg" as const;

export const PANTRY_EXIT_ENTRY_AUTO_VALUE = "__auto__" as const;
export const PANTRY_ENTRY_DONOR_NONE_VALUE = "__none__" as const;

export const PANTRY_EXIT_TYPE_OPTIONS = [
  "ATTENDED",
  "DONATION",
  "EVENT",
  "PARTY",
  "CORRECTION",
] as const;

export const PANTRY_EXIT_TYPE_LABELS: Record<
  (typeof PANTRY_EXIT_TYPE_OPTIONS)[number],
  string
> = {
  ATTENDED: "Atendido",
  DONATION: "Doação",
  EVENT: "Evento",
  PARTY: "Festa",
  CORRECTION: "Correção",
};

export const PANTRY_DONOR_TYPE_LABELS: Record<"PERSON" | "COMPANY", string> = {
  PERSON: "Pessoa",
  COMPANY: "Empresa",
};

export const PANTRY_AUDIT_FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  group: "Grupo",
  defaultSector: "Setor",
  unit: "Unidade",
  minStock: "Estoque mínimo",
  notes: "Notas internas",
};

export const PANTRY_SCREEN_STATE_KEYS = {
  stock: "screenState:pantry.stock",
  donors: "screenState:pantry.donors",
  history: "screenState:pantry.history",
} as const;

export const PANTRY_ROUTES = {
  root: "/pantry",
  stock: "/pantry/stock",
  donors: "/pantry/donors",
  history: "/pantry/history",
  items: "/pantry/items",
  itemsNew: "/pantry/items/new",
} as const;

export const PANTRY_ACTION_IDS = {
  stock: "pantry.stock",
  donors: "pantry.donors",
  history: "pantry.history",
  itemsNew: "pantry.items.new",
  itemsDetail: "pantry.items.detail",
} as const;

export const PANTRY_SEARCH_VIEW_IDS = {
  stock: "pantry.stock.search",
  donors: "pantry.donors.search",
  history: "pantry.history.search",
} as const;
