"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DETENTIONS_TEXT } from "../config/detentions.constants";

export type DetentionFormValues = {
  status: string;
  type: string;
  unit: string;
  startDate: string;
  endDate: string;
  notes: string;
};

type DetentionFormProps = {
  initialValues: DetentionFormValues;
  submitLabel: string;
  onSubmit: (values: DetentionFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function DetentionForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: DetentionFormProps) {
  const [form, setForm] = React.useState<DetentionFormValues>(initialValues);

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
        <Label>{DETENTIONS_TEXT.form.statusLabel}</Label>
        <Input
          value={form.status}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, status: event.target.value }))
          }
          placeholder={DETENTIONS_TEXT.form.statusPlaceholder}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{DETENTIONS_TEXT.form.typeLabel}</Label>
          <Input
            value={form.type}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, type: event.target.value }))
            }
            placeholder={DETENTIONS_TEXT.form.typePlaceholder}
          />
        </div>
        <div className="grid gap-2">
          <Label>{DETENTIONS_TEXT.form.unitLabel}</Label>
          <Input
            value={form.unit}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, unit: event.target.value }))
            }
            placeholder={DETENTIONS_TEXT.form.unitPlaceholder}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{DETENTIONS_TEXT.form.startDateLabel}</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, startDate: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>{DETENTIONS_TEXT.form.endDateLabel}</Label>
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
        <Label>{DETENTIONS_TEXT.form.notesLabel}</Label>
        <Textarea
          value={form.notes}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, notes: event.target.value }))
          }
          placeholder={DETENTIONS_TEXT.form.notesPlaceholder}
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

