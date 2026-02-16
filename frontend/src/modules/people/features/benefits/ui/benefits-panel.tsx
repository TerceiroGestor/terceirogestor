"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BenefitForm, type BenefitFormValues } from "./benefit-form";
import { useBenefits } from "@/modules/people/features/benefits/data/use-benefits";
import type { PersonBenefit } from "@/modules/people/shared/domain/types";
import {
  formatCurrency,
  formatDate,
  toDateInputValue,
} from "@/modules/people/shared/domain/utils";
import {
  BENEFIT_TYPE_OPTIONS,
  BENEFIT_FREQUENCY_OPTIONS,
  BENEFITS_TEXT,
} from "../config/benefits.constants";
import { useFamilyRelationsContext } from "@/modules/people/features/family-members/context/family-relations-context";

const getFrequencyLabel = (value: string) =>
  BENEFIT_FREQUENCY_OPTIONS.find((option) => option.value === value)?.label ??
  value;

const getTypeLabel = (value: string) =>
  BENEFIT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;

const buildFormValues = (benefit?: PersonBenefit): BenefitFormValues => ({
  type: benefit?.type ?? "",
  status: benefit?.status ?? "",
  amount:
    typeof benefit?.amount === "number" ? String(benefit.amount) : "",
  frequency: benefit?.frequency ?? "MONTHLY",
  startDate: toDateInputValue(benefit?.startDate ?? null),
  endDate: toDateInputValue(benefit?.endDate ?? null),
  notes: benefit?.notes ?? "",
});

type BenefitsPanelProps = {
  personId: string;
};

export function BenefitsPanel({ personId }: BenefitsPanelProps) {
  const { benefits, isLoading, error, create, update, remove } =
    useBenefits(personId);
  const { refresh: refreshFamily } = useFamilyRelationsContext();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PersonBenefit | null>(null);

  const initialValues = useMemo(() => buildFormValues(editing ?? undefined), [
    editing,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setEditing(null);
  };

  const handleSubmit = async (values: BenefitFormValues) => {
    if (!values.type.trim()) return;
    const amount = values.amount.trim()
      ? Number(values.amount.replace(",", "."))
      : null;
    const payload = {
      type: values.type.trim(),
      status: values.status?.trim() || null,
      amount: amount !== null && !Number.isNaN(amount) ? amount : null,
      frequency: values.frequency,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      notes: values.notes?.trim() || null,
    };
    if (editing) {
      await update(editing.id, payload);
    } else {
      await create(payload);
    }
    await refreshFamily();
    setOpen(false);
  };

  const handleRemove = async (benefitId: string) => {
    await remove(benefitId);
    await refreshFamily();
  };

  return (
    <SectionCard
      title={BENEFITS_TEXT.cardTitle}
      subtitle={BENEFITS_TEXT.cardSubtitle}
      actions={
        <SectionDialog
          open={open}
          onOpenChange={handleOpenChange}
          title={editing ? BENEFITS_TEXT.dialog.editTitle : BENEFITS_TEXT.dialog.createTitle}
          description={BENEFITS_TEXT.dialog.description}
          trigger={
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
              <Plus className="size-3.5" />
              {BENEFITS_TEXT.actions.new}
            </Button>
          }
        >
          <BenefitForm
            initialValues={initialValues}
            submitLabel={
              editing ? BENEFITS_TEXT.form.submitEdit : BENEFITS_TEXT.form.submitCreate
            }
            onSubmit={handleSubmit}
            onCancel={() => handleOpenChange(false)}
          />
        </SectionDialog>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {benefits.length ? (
        <SectionList>
          {benefits.map((benefit) => (
            <SectionListItem
              key={benefit.id}
              title={<span>{getTypeLabel(benefit.type)}</span>}
              subtitle={benefit.notes ? benefit.notes : undefined}
              meta={
                <>
                  {benefit.status ? (
                    <Badge variant="outline">{benefit.status}</Badge>
                  ) : null}
                  {benefit.amount !== null && benefit.amount !== undefined ? (
                    <Badge variant="secondary">
                      {formatCurrency(Number(benefit.amount))}
                    </Badge>
                  ) : null}
                  {benefit.frequency ? (
                    <Badge variant="outline">
                      {getFrequencyLabel(benefit.frequency)}
                    </Badge>
                  ) : null}
                  {benefit.startDate ? (
                    <Badge variant="secondary">
                      Início: {formatDate(benefit.startDate)}
                    </Badge>
                  ) : null}
                  {benefit.endDate ? (
                    <Badge variant="secondary">
                      Fim: {formatDate(benefit.endDate)}
                    </Badge>
                  ) : null}
                </>
              }
              actions={
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(benefit);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(benefit.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              }
            />
          ))}
        </SectionList>
      ) : (
        <p className="text-xs text-muted-foreground">{BENEFITS_TEXT.emptyState}</p>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}
    </SectionCard>
  );
}
