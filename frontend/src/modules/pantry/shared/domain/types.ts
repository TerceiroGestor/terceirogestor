export type PantryItemFormValues = {
  name: string;
  group?: string;
  unit: string;
  minStock: number | "";
};

export type PantryDonorFormValues = {
  name: string;
  type: "PERSON" | "COMPANY";
  contact?: string;
};

export type PantryEntryFormValues = {
  itemId: string;
  donorId: string;
  sector: string;
  quantity: number | "";
  unit?: string;
  entryDate?: string;
  expiryDate?: string;
  notes?: string;
};

export type PantryExitFormValues = {
  itemId: string;
  entryId?: string;
  sector: string;
  quantity: number | "";
  unit?: string;
  exitDate?: string;
  type: "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";
  eventName?: string;
  notes?: string;
};
