export type CycleStatus = "Atual" | "Historico";

export type Cycle = {
  id: string;
  title: string;
  status: CycleStatus;
  startDate: string;
  endDate: string;
};

export type CycleFormData = Omit<Cycle, "id">;
