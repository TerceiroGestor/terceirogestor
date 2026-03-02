export const PANTRY_ITEM_UNIT = [
  { label: "Unidade (un)", value: "un" },
  { label: "Kilograma (kg)", value: "kg" },
  { label: "Grama (g)", value: "g" },
  { label: "Litro (l)", value: "l" },
  { label: "Mililitro (ml)", value: "ml" },
] as const;

export const PANTRY_ITEM_GROUP = [
  { label: "Grãos e Cereais", value: "Grãos e Cereais" },
  { label: "Leguminosas", value: "Leguminosas" },
  { label: "Farinhas e Derivados", value: "Farinhas e Derivados" },
  { label: "Massas", value: "Massas" },
  { label: "Óleos e Gorduras", value: "Óleos e Gorduras" },
  { label: "Temperos e Condimentos", value: "Temperos e Condimentos" },
  { label: "Açúcares e Adoçantes", value: "Açúcares e Adoçantes" },
  { label: "Enlatados", value: "Enlatados" },
  { label: "Conservas", value: "Conservas" },
  { label: "Molhos", value: "Molhos" },
  { label: "Alimentos Prontos", value: "Alimentos Prontos" },
  { label: "Café e Chás", value: "Café e Chás" },
  { label: "Leite e Derivados", value: "Leite e Derivados" },
  { label: "Achocolatados", value: "Achocolatados" },
  { label: "Biscoitos e Bolachas", value: "Biscoitos e Bolachas" },
  { label: "Snacks e Salgadinhos", value: "Snacks e Salgadinhos" },
  { label: "Doces e Sobremesas", value: "Doces e Sobremesas" },
  { label: "Cereais Matinais", value: "Cereais Matinais" },
  { label: "Produtos Diet e Light", value: "Produtos Diet e Light" },
  { label: "Produtos Integrais", value: "Produtos Integrais" },
  { label: "Alimentos Infantis", value: "Alimentos Infantis" },
  { label: "Bebidas", value: "Bebidas" },
  { label: "Suplementos Alimentares", value: "Suplementos Alimentares" },
  { label: "Hortifruti", value: "Hortifruti" },
  { label: "Proteínas Animais", value: "Proteínas Animais" },
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
  group: "Grupo de alimentos",
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
  donorsNew: "/pantry/donors/new",
  history: "/pantry/history",
  entries: "/pantry/entries",
  entriesNew: "/pantry/entries/new",
  exits: "/pantry/exits",
  exitsNew: "/pantry/exits/new",
  items: "/pantry/items",
  itemsNew: "/pantry/items/new",
} as const;

export const PANTRY_ACTION_IDS = {
  stock: "pantry.stock",
  donors: "pantry.donors",
  donorsNew: "pantry.donors.new",
  donorsDetail: "pantry.donors.detail",
  history: "pantry.history",
  itemsNew: "pantry.items.new",
  itemsDetail: "pantry.items.detail",
} as const;

export const PANTRY_SEARCH_VIEW_IDS = {
  stock: "pantry.stock.search",
  donors: "pantry.donors.search",
  history: "pantry.history.search",
} as const;
