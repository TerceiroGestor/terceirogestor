"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { FamilyCard } from "@/features/family-members/ui/family-card";
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
import { formatCurrency } from "@/app/(modules)/people/utils";
import type { PersonExpense, PersonIncome } from "@/app/(modules)/people/types";
import { usePeopleFinancial } from "@/features/people-financial/data/use-people-financial";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";

const frequencyOptions = [
  { value: "MONTHLY", label: "Mensal" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quinzenal" },
  { value: "ANNUAL", label: "Anual" },
  { value: "ONCE", label: "Avulso" },
];

const getFrequencyLabel = (value: string) =>
  frequencyOptions.find((option) => option.value === value)?.label ?? value;

type FinancialFormState = {
  type: string;
  amount: string;
  frequency: string;
  isHousehold: boolean;
  householdId: string;
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
      notes: initial?.notes ?? "",
    }),
    [initial, isExpense, defaultHouseholdId],
  );
  const [form, setForm] = useState<FinancialFormState>(formDefaults);

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
          <div className="grid gap-2">
            <Label>Descricao</Label>
            <Input
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value }))
              }
              placeholder="Ex: Salario, pensao, aluguel"
            />
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
            <Label>Frequencia</Label>
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
          {householdOptions.length ? (
            <div className="grid gap-2">
              <Label>Familia</Label>
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
                  ? "Inclui este gasto no resumo da familia."
                  : "Inclui esta renda no resumo da familia."}
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
            <Label>Observacoes</Label>
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
  const { data: familyData } = useFamilyRelationsContext();
  const {
    incomes,
    expenses,
    isLoading,
    error,
    createIncome,
    updateIncome,
    deleteIncome,
    createExpense,
    updateExpense,
    deleteExpense,
  } = usePeopleFinancial(personId);

  const householdOptions = useMemo(() => {
    if (!familyData?.household?.id) return [];
    return [
      {
        id: familyData.household.id,
        label: familyData.household.name ?? "Residencia atual",
      },
    ];
  }, [familyData]);
  const defaultHouseholdId = householdOptions[0]?.id ?? null;

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

      <FamilyCard
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
      </FamilyCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <FamilyCard
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
                  notes: payload.notes ?? null,
                })
              }
            />
          }
        >
          <div className="space-y-3">
            {incomes.length ? (
              incomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{income.type}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatCurrency(income.amount)}</span>
                      <Badge variant="outline">
                        {getFrequencyLabel(income.frequency)}
                      </Badge>
                      {income.isHouseholdContribution ? (
                        <Badge variant="secondary">Familia</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhuma renda cadastrada.
              </p>
            )}
          </div>
        </FamilyCard>

        <FamilyCard
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
          <div className="space-y-3">
            {expenses.length ? (
              expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{expense.type}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatCurrency(expense.amount)}</span>
                      <Badge variant="outline">
                        {getFrequencyLabel(expense.frequency)}
                      </Badge>
                      {expense.isHouseholdExpense ? (
                        <Badge variant="secondary">Familia</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhum gasto cadastrado.
              </p>
            )}
          </div>
        </FamilyCard>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando dados...</p>
      ) : null}
    </div>
  );
}
