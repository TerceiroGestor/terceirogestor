"use client";

import * as React from "react";
import type { PersonFormData } from "../domain/types";
import { PeopleForm } from "./people-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PeopleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialValues?: Partial<PersonFormData>;
  submitLabel?: string;
  onSubmit?: (values: PersonFormData) => void | Promise<void>;
  tagSuggestions?: string[];
};

export function PeopleFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initialValues,
  submitLabel,
  onSubmit,
  tagSuggestions,
}: PeopleFormDialogProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(
    async (values: PersonFormData) => {
      try {
        setSubmitError(null);
        await onSubmit?.(values);
        onOpenChange(false);
      } catch (error) {
        const message = (() => {
          if (error && typeof error === "object" && "message" in error) {
            const raw = (error as { message?: unknown }).message;
            if (Array.isArray(raw)) {
              const joined = raw.map(String).join(", ");
              return joined || "Falha ao salvar.";
            }
            if (raw === null || raw === undefined) return "Falha ao salvar.";
            return String(raw);
          }
          return "Falha ao salvar.";
        })();
        setSubmitError(message);
        console.error(error);
      }
    },
    [onOpenChange, onSubmit],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,960px)] !max-w-[min(96vw,960px)] sm:!max-w-[960px] p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto px-6 pb-6 pt-4">
          {submitError ? (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}
          <PeopleForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            submitLabel={submitLabel}
            tagSuggestions={tagSuggestions}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
