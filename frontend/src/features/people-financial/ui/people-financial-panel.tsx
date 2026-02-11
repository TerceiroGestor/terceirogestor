"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { FamilyMetricField } from "@/features/family-members/ui/family-metrics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/app/[tenant]/(modules)/people/utils";
import type { PersonExpense, PersonIncome } from "@/app/[tenant]/(modules)/people/types";
import { usePeopleFinancial } from "@/features/people-financial/data/use-people-financial";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";
import type { HouseholdTransfer } from "@/app/[tenant]/(modules)/people/types";

const frequencyOptions = [
  { value: "MONTHLY", label: "Mensal" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quinzenal" },
  { value: "ANNUAL", label: "Anual" },
  { value: "ONCE", label: "Avulso" },
];

const incomeTypeOptions = [
  { value: "Salario", label: "Salário" },
  { value: "Renda extra", label: "Renda extra" },
  { value: "Pensao", label: "Pensão" },
  { value: "Bolsa Familia", label: "Bolsa Família" },
  { value: "Auxilio", label: "Auxílio" },
  { value: "BPC", label: "BPC" },
  { value: "Beneficio eventual", label: "Benefício eventual" },
  { value: "Outro", label: "Outro" },
];

const contractTypeOptions = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" },
  { value: "Informal", label: "Informal" },
  { value: "Autonomo", label: "Autônomo" },
  { value: "Outro", label: "Outro" },
];

const transferTypeOptions = [
  { value: "PENSION", label: "Pensão" },
  { value: "TRANSFER", label: "Transferência" },
];

const getFrequencyLabel = (value: string) =>
  frequencyOptions.find((option) => option.value === value)?.label ?? value;
const getIncomeTypeLabel = (value: string) =>
  incomeTypeOptions.find((option) => option.value === value)?.label ?? value;
const getContractTypeLabel = (value: string) =>
  contractTypeOptions.find((option) => option.value === value)?.label ?? value;

type FinancialFormState = {
  type: string;
  amount: string;
  frequency: string;
  isHousehold: boolean;
  householdId: string;
  contractType: string;
  notes: string;
};

type FinancialDialogProps = {
  title: string;
  description: string;
  triggerLabel?: string;
  trigger?: React.ReactNode;
  isExpense?: boolean;
  initial?: Partial<PersonIncome | PersonExpense>;
  householdOptions?: { id: string; label: string }[];
  defaultHouseholdId?: string | null;
  onSubmit: (payload: {
    type: string;
    amount: number;
    frequency: string;
    isHousehold: boolean;
    householdId?: string;
    contractType?: string | null;
    notes?: string | null;
  }) => Promise<void>;
};

function FinancialDialog({
  title,
  description,
  triggerLabel,
  trigger,
  isExpense,
  initial,
  householdOptions = [],
  defaultHouseholdId,
  onSubmit,
}: FinancialDialogProps) {
  const [open, setOpen] = useState(false);
  const formDefaults: FinancialFormState = useMemo(
    () => ({
      type: initial?.type ?? "",
      amount:
        typeof initial?.amount === "number"
          ? String(initial.amount)
          : "",
      frequency: initial?.frequency ?? "MONTHLY",
      isHousehold: isExpense
        ? (initial as PersonExpense | undefined)?.isHouseholdExpense ?? true
        : (initial as PersonIncome | undefined)?.isHouseholdContribution ?? true,
      householdId:
        (initial as PersonIncome | PersonExpense | undefined)?.householdId ??
        defaultHouseholdId ??
        "",
      contractType:
        (initial as PersonIncome | undefined)?.contractType ?? "",
      notes: initial?.notes ?? "",
    }),
    [initial, isExpense, defaultHouseholdId],
  );
  const [form, setForm] = useState<FinancialFormState>(formDefaults);

  const incomeTypeValue = useMemo(() => {
    if (isExpense) return "";
    const exists = incomeTypeOptions.some((option) => option.value === form.type);
    return exists ? form.type : "Outro";
  }, [form.type, isExpense]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setForm(formDefaults);
    }
  };

  const handleSubmit = async () => {
    const amount = Number(form.amount.replace(",", "."));
    if (!form.type.trim() || Number.isNaN(amount)) return;
    await onSubmit({
      type: form.type.trim(),
      amount,
      frequency: form.frequency,
      isHousehold: form.isHousehold,
      householdId: form.householdId || undefined,
      contractType: form.contractType || null,
      notes: form.notes.trim() || null,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
            <Plus className="size-3.5" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {isExpense ? (
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, type: event.target.value }))
                }
                placeholder="Ex: Aluguel, mercado"
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Tipo de renda</Label>
              <Select
                value={incomeTypeValue}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    type: value === "Outro" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {incomeTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {incomeTypeValue === "Outro" ? (
                <Input
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, type: event.target.value }))
                  }
                  placeholder="Descreva a renda"
                />
              ) : null}
            </div>
          )}
          <div className="grid gap-2">
            <Label>Valor</Label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, amount: event.target.value }))
              }
              placeholder="0.00"
            />
          </div>
          <div className="grid gap-2">
            <Label>Frequência</Label>
            <Select
              value={form.frequency}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, frequency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isExpense ? (
            <div className="grid gap-2">
              <Label>Forma contratual</Label>
              <Select
                value={form.contractType}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, contractType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {householdOptions.length ? (
            <div className="grid gap-2">
              <Label>Família</Label>
              <Select
                value={form.householdId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, householdId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {householdOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">
                {isExpense ? "Considerar no gasto familiar" : "Contribui na renda familiar"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isExpense
                  ? "Inclui este gasto no resumo da família."
                  : "Inclui esta renda no resumo da família."}
              </p>
            </div>
            <Switch
              checked={form.isHousehold}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, isHousehold: checked }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Detalhes adicionais"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TransferFormState = {
  fromHouseholdId: string;
  toHouseholdId: string;
  amount: string;
  frequency: string;
  type: string;
  notes: string;
};

type TransferDialogProps = {
  trigger?: React.ReactNode;
  triggerLabel?: string;
  householdOptions: { id: string; label: string }[];
  initial?: Partial<HouseholdTransfer>;
  onSubmit: (payload: {
    fromHouseholdId: string;
    toHouseholdId: string;
    amount: number;
    frequency: string;
    type: string;
    notes?: string | null;
  }) => Promise<void>;
};

function TransferDialog({
  trigger,
  triggerLabel,
  householdOptions,
  initial,
  onSubmit,
}: TransferDialogProps) {
  const [open, setOpen] = useState(false);
  const formDefaults: TransferFormState = useMemo(
    () => ({
      fromHouseholdId: initial?.fromHouseholdId ?? "",
      toHouseholdId: initial?.toHouseholdId ?? "",
      amount:
        typeof initial?.amount === "number"
          ? String(initial.amount)
          : "",
      frequency: initial?.frequency ?? "MONTHLY",
      type: initial?.type ?? "PENSION",
      notes: initial?.notes ?? "",
    }),
    [initial],
  );
  const [form, setForm] = useState<TransferFormState>(formDefaults);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setForm(formDefaults);
    }
  };

  const handleSubmit = async () => {
    const amount = Number(form.amount.replace(",", "."));
    if (
      !form.fromHouseholdId ||
      !form.toHouseholdId ||
      Number.isNaN(amount)
    ) {
      return;
    }
    await onSubmit({
      fromHouseholdId: form.fromHouseholdId,
      toHouseholdId: form.toHouseholdId,
      amount,
      frequency: form.frequency,
      type: form.type,
      notes: form.notes.trim() || null,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
            <Plus className="size-3.5" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Transferência entre famílias</DialogTitle>
          <DialogDescription>
            Registre pensão ou transferências financeiras.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Residência de origem</Label>
            <Select
              value={form.fromHouseholdId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, fromHouseholdId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {householdOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Residência de destino</Label>
            <Select
              value={form.toHouseholdId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, toHouseholdId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {householdOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {transferTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Valor</Label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, amount: event.target.value }))
              }
              placeholder="0.00"
            />
          </div>
          <div className="grid gap-2">
            <Label>Frequência</Label>
            <Select
              value={form.frequency}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, frequency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Detalhes adicionais"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PeopleFinancialPanelProps = {
  personId: string;
};

export function PeopleFinancialPanel({ personId }: PeopleFinancialPanelProps) {
  const { data: familyData, loadDetailed } = useFamilyRelationsContext();
  const {
    incomes,
    expenses,
    transfers,
    isLoading,
    error,
    createIncome,
    updateIncome,
    deleteIncome,
    createExpense,
    updateExpense,
    deleteExpense,
    createTransfer,
    updateTransfer,
    deleteTransfer,
  } = usePeopleFinancial(personId);

  useEffect(() => {
    if (!familyData) {
      loadDetailed();
    }
  }, [familyData, loadDetailed]);

  const householdOptions = useMemo(() => {
    const options: { id: string; label: string }[] = [];
    const currentId = familyData?.household?.id ?? null;
    if (currentId) {
      options.push({
        id: currentId,
        label: familyData?.household?.name ?? "Residência atual",
      });
    }
    const related = familyData?.relatedHouseholds ?? [];
    related.forEach((item) => {
      if (!item.householdId) return;
      if (item.householdId === currentId) return;
      const base =
        item.householdName ??
        `Residência de ${item.personName}`;
      const label = item.relationType ? `${base} (${item.relationType})` : base;
      options.push({ id: item.householdId, label });
    });
    const seen = new Set<string>();
    return options.filter((option) => {
      if (seen.has(option.id)) return false;
      seen.add(option.id);
      return true;
    });
  }, [familyData]);
  const defaultHouseholdId = householdOptions[0]?.id ?? null;
  const householdLabelById = useMemo(() => {
    const map = new Map<string, string>();
    householdOptions.forEach((option) => {
      map.set(option.id, option.label);
    });
    return map;
  }, [householdOptions]);

  const incomeTotal = incomes.reduce((sum, income) => sum + income.amount, 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const balance = incomeTotal - expenseTotal;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <SectionCard
        title="Resumo financeiro"
        subtitle="Renda, gastos e saldo da pessoa"
      >
        <div className="grid gap-2 md:grid-cols-3">
          <FamilyMetricField
            label="Renda total"
            value={formatCurrency(incomeTotal)}
          />
          <FamilyMetricField
            label="Gastos totais"
            value={formatCurrency(expenseTotal)}
          />
          <FamilyMetricField
            label="Saldo"
            value={formatCurrency(balance)}
          />
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Rendas"
          subtitle="Fontes de renda cadastradas"
          actions={
            <FinancialDialog
              title="Adicionar renda"
              description="Registre a renda da pessoa."
              triggerLabel="Nova renda"
              householdOptions={householdOptions}
              defaultHouseholdId={defaultHouseholdId}
              onSubmit={(payload) =>
                createIncome({
                  type: payload.type,
                  amount: payload.amount,
                  frequency: payload.frequency,
                  isHouseholdContribution: payload.isHousehold,
                  householdId: payload.householdId ?? null,
                  contractType: payload.contractType ?? null,
                  notes: payload.notes ?? null,
                })
              }
            />
          }
        >
          {incomes.length ? (
            <SectionList>
              {incomes.map((income) => (
                <SectionListItem
                  key={income.id}
                  title={<span>{getIncomeTypeLabel(income.type)}</span>}
                  subtitle={
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatCurrency(income.amount)}</span>
                      <Badge variant="outline">
                        {getFrequencyLabel(income.frequency)}
                      </Badge>
                      {income.contractType ? (
                        <Badge variant="outline">
                          {getContractTypeLabel(income.contractType)}
                        </Badge>
                      ) : null}
                      {income.isHouseholdContribution ? (
                        <Badge variant="secondary">Família</Badge>
                      ) : null}
                      {income.householdId &&
                      householdLabelById.has(income.householdId) ? (
                        <Badge variant="secondary">
                          {householdLabelById.get(income.householdId)}
                        </Badge>
                      ) : null}
                    </div>
                  }
                  actions={
                    <div className="flex items-center gap-1">
                      <FinancialDialog
                        title="Editar renda"
                        description="Atualize a renda selecionada."
                        initial={income}
                        householdOptions={householdOptions}
                        defaultHouseholdId={defaultHouseholdId}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="size-4" />
                          </Button>
                        }
                        onSubmit={(payload) =>
                          updateIncome(income.id, {
                            type: payload.type,
                            amount: payload.amount,
                            frequency: payload.frequency,
                            isHouseholdContribution: payload.isHousehold,
                            householdId: payload.householdId ?? null,
                            contractType: payload.contractType ?? null,
                            notes: payload.notes ?? null,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteIncome(income.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  }
                />
              ))}
            </SectionList>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhuma renda cadastrada.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Gastos"
          subtitle="Despesas cadastradas"
          actions={
            <FinancialDialog
              title="Adicionar gasto"
              description="Registre um gasto da pessoa."
              triggerLabel="Novo gasto"
              isExpense
              householdOptions={householdOptions}
              defaultHouseholdId={defaultHouseholdId}
              onSubmit={(payload) =>
                createExpense({
                  type: payload.type,
                  amount: payload.amount,
                  frequency: payload.frequency,
                  isHouseholdExpense: payload.isHousehold,
                  householdId: payload.householdId ?? null,
                  notes: payload.notes ?? null,
                })
              }
            />
          }
        >
          {expenses.length ? (
            <SectionList>
              {expenses.map((expense) => (
                <SectionListItem
                  key={expense.id}
                  title={<span>{expense.type}</span>}
                  subtitle={
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatCurrency(expense.amount)}</span>
                      <Badge variant="outline">
                        {getFrequencyLabel(expense.frequency)}
                      </Badge>
                      {expense.isHouseholdExpense ? (
                        <Badge variant="secondary">Família</Badge>
                      ) : null}
                      {expense.householdId &&
                      householdLabelById.has(expense.householdId) ? (
                        <Badge variant="secondary">
                          {householdLabelById.get(expense.householdId)}
                        </Badge>
                      ) : null}
                    </div>
                  }
                  actions={
                    <div className="flex items-center gap-1">
                      <FinancialDialog
                        title="Editar gasto"
                        description="Atualize o gasto selecionado."
                        isExpense
                        initial={expense}
                        householdOptions={householdOptions}
                        defaultHouseholdId={defaultHouseholdId}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="size-4" />
                          </Button>
                        }
                        onSubmit={(payload) =>
                          updateExpense(expense.id, {
                            type: payload.type,
                            amount: payload.amount,
                            frequency: payload.frequency,
                            isHouseholdExpense: payload.isHousehold,
                            householdId: payload.householdId ?? null,
                            notes: payload.notes ?? null,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  }
                />
              ))}
            </SectionList>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum gasto cadastrado.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Transferências"
        subtitle="Pensão ou repasse entre famílias"
        actions={
          householdOptions.length >= 2 ? (
            <TransferDialog
              triggerLabel="Nova transferência"
              householdOptions={householdOptions}
              onSubmit={(payload) =>
                createTransfer({
                  fromHouseholdId: payload.fromHouseholdId,
                  toHouseholdId: payload.toHouseholdId,
                  amount: payload.amount,
                  frequency: payload.frequency,
                  type: payload.type,
                  notes: payload.notes ?? null,
                })
              }
            />
          ) : null
        }
      >
        {householdOptions.length < 2 ? (
          <p className="text-xs text-muted-foreground">
            Cadastre outra residência para registrar transferências.
          </p>
        ) : transfers.length ? (
          <SectionList>
            {transfers.map((transfer) => {
              const fromLabel =
                householdLabelById.get(transfer.fromHouseholdId) ??
                transfer.fromHouseholdId;
              const toLabel =
                householdLabelById.get(transfer.toHouseholdId) ??
                transfer.toHouseholdId;
              return (
                <SectionListItem
                  key={transfer.id}
                  title={
                    <span>
                      {transfer.type === "PENSION" ? "Pensão" : "Transferência"}
                    </span>
                  }
                  subtitle={
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatCurrency(transfer.amount)}</span>
                      <Badge variant="outline">
                        {getFrequencyLabel(transfer.frequency)}
                      </Badge>
                      <Badge variant="secondary">{fromLabel}</Badge>
                      <Badge variant="secondary">{toLabel}</Badge>
                    </div>
                  }
                  actions={
                    <div className="flex items-center gap-1">
                      <TransferDialog
                        householdOptions={householdOptions}
                        initial={transfer}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="size-4" />
                          </Button>
                        }
                        onSubmit={(payload) =>
                          updateTransfer(transfer.id, {
                            fromHouseholdId: payload.fromHouseholdId,
                            toHouseholdId: payload.toHouseholdId,
                            amount: payload.amount,
                            frequency: payload.frequency,
                            type: payload.type,
                            notes: payload.notes ?? null,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTransfer(transfer.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  }
                />
              );
            })}
          </SectionList>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhuma transferência cadastrada.
          </p>
        )}
      </SectionCard>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando dados...</p>
      ) : null}
    </div>
  );
}



