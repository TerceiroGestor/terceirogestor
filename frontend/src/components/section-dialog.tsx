"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import clsx from "clsx";

type SectionDialogProps = {
  title: string;
  description?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  contentClassName?: string;
};

export function SectionDialog({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  children,
  contentClassName,
}: SectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className={clsx(
          "w-[calc(100vw-2rem)] max-w-[640px] max-h-[85vh] overflow-y-auto",
          contentClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export type { SectionDialogProps };
