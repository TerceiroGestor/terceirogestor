"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import clsx from "clsx";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type SectionDialogProps = {
  title: string;
  description?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  contentClassName?: string;
  headerSlot?: ReactNode;
};

export function SectionDialog({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  children,
  contentClassName,
  headerSlot,
}: SectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        showCloseButton={false}
        className={clsx(
          "flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-[min(96vw,60rem)] flex-col overflow-hidden p-0",
          contentClassName,
        )}
      >
        <div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 px-6 pb-4 pt-6 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? (
                <DialogDescription>{description}</DialogDescription>
              ) : null}
            </DialogHeader>

            <div className="flex items-center gap-2">
              {headerSlot}
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Fechar"
                  title="Fechar"
                >
                  <XIcon className="size-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6 pt-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { SectionDialogProps };
