"use client";

import * as React from "react";
import type { PersonFormData } from "../types";
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
  onSubmit?: (values: PersonFormData) => void;
};

export function PeopleFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initialValues,
  submitLabel,
  onSubmit,
}: PeopleFormDialogProps) {
  const handleSubmit = React.useCallback(
    (values: PersonFormData) => {
      onSubmit?.(values);
      onOpenChange(false);
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
          <PeopleForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            submitLabel={submitLabel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
