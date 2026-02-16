"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EDUCATION_STATUS_OPTIONS, EDUCATION_TEXT } from "../config/education.constants";

export type EducationFormValues = {
  level: string;
  status: string;
  institution: string;
  grade: string;
  schoolYear: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  notes: string;
};

type EducationFormProps = {
  initialValues: EducationFormValues;
  submitLabel: string;
  onSubmit: (values: EducationFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function EducationForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: EducationFormProps) {
  const [form, setForm] = React.useState<EducationFormValues>(initialValues);

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
        <Label>{EDUCATION_TEXT.form.levelLabel}</Label>
        <Input
          value={form.level}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, level: event.target.value }))
          }
          placeholder={EDUCATION_TEXT.form.levelPlaceholder}
        />
      </div>

      <div className="grid gap-2">
        <Label>{EDUCATION_TEXT.form.statusLabel}</Label>
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
            {EDUCATION_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>{EDUCATION_TEXT.form.institutionLabel}</Label>
        <Input
          value={form.institution}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, institution: event.target.value }))
          }
          placeholder={EDUCATION_TEXT.form.institutionPlaceholder}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{EDUCATION_TEXT.form.gradeLabel}</Label>
          <Input
            value={form.grade}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, grade: event.target.value }))
            }
            placeholder={EDUCATION_TEXT.form.gradePlaceholder}
          />
        </div>
        <div className="grid gap-2">
          <Label>{EDUCATION_TEXT.form.schoolYearLabel}</Label>
          <Input
            value={form.schoolYear}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, schoolYear: event.target.value }))
            }
            placeholder={EDUCATION_TEXT.form.schoolYearPlaceholder}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
        <div>
          <div className="text-sm font-medium text-foreground">
            {EDUCATION_TEXT.form.isCurrentLabel}
          </div>
          <div className="text-xs text-muted-foreground">
            Quando ativo, este registro aparece como o principal.
          </div>
        </div>
        <Switch
          checked={form.isCurrent}
          onCheckedChange={(checked) =>
            setForm((prev) => ({ ...prev, isCurrent: checked }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{EDUCATION_TEXT.form.startDateLabel}</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, startDate: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>{EDUCATION_TEXT.form.endDateLabel}</Label>
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
        <Label>{EDUCATION_TEXT.form.notesLabel}</Label>
        <Textarea
          value={form.notes}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, notes: event.target.value }))
          }
          placeholder={EDUCATION_TEXT.form.notesPlaceholder}
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

