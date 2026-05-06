"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type DetailFormStep = {
  key: string;
  title: string;
  description?: React.ReactNode;
  disabled?: boolean;
  badge?: string;
};

export function DetailFormSteps({
  steps,
  value,
  onValueChange,
  className,
}: {
  steps: DetailFormStep[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  const activeStep = steps.find((step) => step.key === value) ?? steps[0] ?? null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/10 p-2">
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
                "group relative flex min-w-[190px] flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors sm:min-w-[210px]",
                isActive
                  ? "border-primary/60 bg-background text-foreground shadow-sm"
                  : "border-transparent bg-background/60 text-muted-foreground hover:border-border/80 hover:text-foreground",
                step.disabled
                  ? "cursor-not-allowed opacity-60 hover:border-transparent hover:text-muted-foreground"
                  : null,
              )}
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full text-[10px]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                  )}
                >
                  {index + 1}
                </span>
                <span>{step.title}</span>
                {step.badge ? (
                  <span className="rounded-full border border-border/80 px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-muted-foreground">
                    {step.badge}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      {activeStep?.description ? (
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
          {activeStep.description}
        </div>
      ) : null}
    </div>
  );
}
