"use client";

import { Textarea } from "@/components/ui/textarea";
import { RichText } from "@/components/ui/richtext/RichText";
import type { MentionSuggestionUser } from "@/components/ui/richtext/mention-suggestion";

const textareaClassName =
  "min-h-[220px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";

export function DetailNotesPanel({
  value,
  onChange,
  onBlur,
  readOnly,
  placeholder = "Notas internas",
  intro = null,
  footer = null,
  richText = false,
  mentionUsers,
}: {
  value: string | null | undefined;
  onChange: (next: string | null) => void;
  onBlur: () => void;
  readOnly?: boolean;
  placeholder?: string;
  intro?: string | null;
  footer?: string | null;
  /** Usa o editor com formatação (negrito, listas, @menção) em vez de texto simples. */
  richText?: boolean;
  /** Pessoas disponíveis para @menção. Só tem efeito quando `richText` é true. */
  mentionUsers?: MentionSuggestionUser[];
}) {
  return (
    <div className="space-y-3">
      {intro ? (
        <div className="border-b border-border/50 pb-3 text-[11px] text-muted-foreground">
          {intro}
        </div>
      ) : null}
      {richText ? (
        <RichText
          value={value ?? ""}
          disabled={readOnly}
          onChange={(next) => onChange(next || null)}
          onBlur={onBlur}
          mentionUsers={mentionUsers}
        />
      ) : (
        <Textarea
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value || null)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={textareaClassName}
          readOnly={readOnly}
        />
      )}
      {footer ? <div className="text-[11px] text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
