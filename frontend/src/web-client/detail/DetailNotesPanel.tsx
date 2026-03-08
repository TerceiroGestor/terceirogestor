"use client";

import { Textarea } from "@/components/ui/textarea";

const textareaClassName =
  "min-h-[220px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";

export function DetailNotesPanel({
  value,
  onChange,
  onBlur,
  readOnly,
  placeholder = "Anotacoes internas...",
  intro = "Visivel apenas para a equipe interna.",
  footer = "Essas notas ficam salvas no registro.",
}: {
  value: string | null | undefined;
  onChange: (next: string | null) => void;
  onBlur: () => void;
  readOnly?: boolean;
  placeholder?: string;
  intro?: string;
  footer?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="border-b border-border/50 pb-3 text-[11px] text-muted-foreground">
        {intro}
      </div>
      <Textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={textareaClassName}
        readOnly={readOnly}
      />
      <div className="text-[11px] text-muted-foreground">{footer}</div>
    </div>
  );
}
