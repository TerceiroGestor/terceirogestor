"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BENEFIT_TYPE_OPTIONS,
  BENEFIT_FREQUENCY_OPTIONS,
  BENEFIT_STATUS_OPTIONS,
  BENEFITS_TEXT,
} from "../config/benefits.constants";

export type BenefitFormValues = {
  type: string;
  status: string;
  amount: string;
  frequency: string;
  startDate: string;
  endDate: string;
  notes: string;
};

type BenefitFormProps = {
  initialValues: BenefitFormValues;
  submitLabel: string;
  onSubmit: (values: BenefitFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function BenefitForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: BenefitFormProps) {
  const [form, setForm] = React.useState<BenefitFormValues>(initialValues);

  const typeValue = React.useMemo(() => {
    const exists = BENEFIT_TYPE_OPTIONS.some((option) => option.value === form.type);
    return exists ? form.type : "Outro";
  }, [form.type]);

  React.useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="grid gap-2">
        <Label>{BENEFITS_TEXT.form.typeLabel}</Label>
        <Select
          value={typeValue}
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
            {BENEFIT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {typeValue === "Outro" ? (
          <Input
            value={form.type}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, type: event.target.value }))
            }
            placeholder={BENEFITS_TEXT.form.typePlaceholder}
          />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{BENEFITS_TEXT.form.statusLabel}</Label>
          <Select
            value={form.status}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {BENEFIT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>{BENEFITS_TEXT.form.frequencyLabel}</Label>
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
              {BENEFIT_FREQUENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>{BENEFITS_TEXT.form.amountLabel}</Label>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{BENEFITS_TEXT.form.startDateLabel}</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, startDate: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>{BENEFITS_TEXT.form.endDateLabel}</Label>
          <Input
            type="date"
            value={form.endDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, endDate: event.target.value }))
            }
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>{BENEFITS_TEXT.form.notesLabel}</Label>
        <Textarea
          value={form.notes}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, notes: event.target.value }))
          }
          placeholder={BENEFITS_TEXT.form.notesPlaceholder}
          rows={4}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
