export const DEPOSIT_ITEM_UNIT = [
  { label: "Unidade (un)", value: "un" },
  { label: "Kit", value: "kit" },
  { label: "Caixa (cx)", value: "cx" },
  { label: "Par", value: "par" },
  { label: "Conjunto", value: "conj" },
  { label: "Pacote (pct)", value: "pct" },
  { label: "Rolo", value: "rolo" },
  { label: "Metro (m)", value: "m" },
] as const;

export const DEPOSIT_ITEM_GROUP = [
  { label: "Material Escolar", value: "Material Escolar" },
  { label: "Brinquedos", value: "Brinquedos" },
  { label: "Roupas", value: "Roupas" },
  { label: "Calcados", value: "Calcados" },
  { label: "Material de Oficina", value: "Material de Oficina" },
  { label: "Material Esportivo", value: "Material Esportivo" },
  { label: "Livros", value: "Livros" },
  { label: "Material de Escritorio", value: "Material de Escritorio" },
  { label: "Eletronicos", value: "Eletronicos" },
  { label: "Mobilia", value: "Mobilia" },
  { label: "Outros", value: "Outros" },
] as const;

export const DEPOSIT_DEFAULT_SECTOR = "Geral" as const;
export const DEPOSIT_DEFAULT_UNIT = "un" as const;

export const DEPOSIT_EXIT_ENTRY_AUTO_VALUE = "__auto__" as const;
export const DEPOSIT_ENTRY_DONOR_NONE_VALUE = "__none__" as const;

export const DEPOSIT_EXIT_TYPE_OPTIONS = [
  "LOAN",
  "FINAL_REMOVAL",
  "TRANSFER",
  "ADJUSTMENT",
  "LOSS",
] as const;

export const DEPOSIT_EXIT_TYPE_LABELS: Record<
  (typeof DEPOSIT_EXIT_TYPE_OPTIONS)[number],
  string
> = {
  LOAN: "Emprestimo",
  FINAL_REMOVAL: "Doacao",
  TRANSFER: "Transferencia",
  ADJUSTMENT: "Ajuste",
  LOSS: "Perda",
};

export const DEPOSIT_DONOR_TYPE_LABELS: Record<"PERSON" | "COMPANY", string> = {
  PERSON: "Pessoa",
  COMPANY: "Empresa",
};

export const DEPOSIT_AUDIT_FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  group: "Grupo de objetos",
  defaultSector: "Setor",
  unit: "Unidade",
  minStock: "Estoque minimo",
  notes: "Notas internas",
};

export const DEPOSIT_DONOR_AUDIT_FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  type: "Tipo",
  contact: "Contato",
  avatarUrl: "Foto",
};

export const DEPOSIT_ENTRY_AUDIT_FIELD_LABELS: Record<string, string> = {
  donorId: "Fonte",
  sector: "Setor",
  quantity: "Quantidade",
  unit: "Unidade",
  entryDate: "Data da entrada",
  expiryDate: "Data limite",
  notes: "Notas",
  reversalOfExitId: "Retorno de saida",
};

export const DEPOSIT_EXIT_AUDIT_FIELD_LABELS: Record<string, string> = {
  sector: "Setor",
  quantity: "Quantidade",
  unit: "Unidade",
  exitDate: "Data da saida",
  type: "Tipo de saida",
  destinationName: "Destino",
  destinationType: "Tipo de destino",
  expectedReturnAt: "Retorno previsto",
  returnedAt: "Retornado em",
  returnedQuantity: "Quantidade retornada",
  returnNotes: "Notas do retorno",
  notes: "Notas",
  reversalOfEntryId: "Estorno de entrada",
};

export const DEPOSIT_SCREEN_STATE_KEYS = {
  stock: "screenState:deposit.stock",
  donors: "screenState:deposit.donors",
  history: "screenState:deposit.history",
  itemsDetail: "screenState:deposit.items.detail",
  donorsDetail: "screenState:deposit.donors.detail",
  entriesDetail: "screenState:deposit.entries.detail",
  exitsDetail: "screenState:deposit.exits.detail",
} as const;

export const DEPOSIT_ROUTES = {
  root: "/deposit",
  stock: "/deposit/stock",
  donors: "/deposit/donors",
  donorsNew: "/deposit/donors/new",
  history: "/deposit/history",
  entries: "/deposit/entries",
  entriesNew: "/deposit/entries/new",
  exits: "/deposit/exits",
  exitsNew: "/deposit/exits/new",
  items: "/deposit/items",
  itemsNew: "/deposit/items/new",
} as const;

export const DEPOSIT_ACTION_IDS = {
  stock: "deposit.stock",
  donors: "deposit.donors",
  donorsNew: "deposit.donors.new",
  donorsDetail: "deposit.donors.detail",
  history: "deposit.history",
  entriesNew: "deposit.entries.new",
  entriesDetail: "deposit.entries.detail",
  exitsNew: "deposit.exits.new",
  exitsDetail: "deposit.exits.detail",
  itemsNew: "deposit.items.new",
  itemsDetail: "deposit.items.detail",
} as const;

export const DEPOSIT_SEARCH_VIEW_IDS = {
  stock: "deposit.stock.search",
  donors: "deposit.donors.search",
  history: "deposit.history.search",
  entries: "deposit.entries.search",
  exits: "deposit.exits.search",
} as const;
