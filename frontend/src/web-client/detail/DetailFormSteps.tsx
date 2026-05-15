"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type DetailFormStep = {
  key: string;
  title: string;
  description?: React.ReactNode;
  disabled?: boolean;
  badge?: string;
  icon?: React.ReactNode;
};

export function DetailFormSteps({
  steps,
  value,
  onValueChange,
  className,
  showActiveDescription = false,
}: {
  steps: DetailFormStep[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  showActiveDescription?: boolean;
}) {
  const activeStep = steps.find((step) => step.key === value) ?? steps[0] ?? null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full items-center justify-start gap-1 border-b border-border/60">
          {steps.map((step, index) => {
            const isActive = step.key === value;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => !step.disabled && onValueChange(step.key)}
                disabled={step.disabled}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "group inline-flex h-10 shrink-0 items-center gap-2 border-b-2 border-transparent px-2.5 text-sm transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  step.disabled
                    ? "cursor-not-allowed opacity-60 hover:text-muted-foreground"
                    : null,
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full border border-border/60 text-[10px]",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {step.icon ?? index + 1}
                </span>
                <span className="truncate text-[12px] font-medium uppercase tracking-[0.12em]">
                  {step.title}
                </span>
                {step.badge ? (
                  <span
                    className={cn(
                      "rounded-full border border-border/70 px-1.5 py-0.5 text-[9px] leading-none tracking-[0.08em]",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      {showActiveDescription && activeStep?.description ? (
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
          {activeStep.description}
        </div>
      ) : null}
    </div>
  );
}
