"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const DETAIL_FIELD_LABEL_CLASS_NAME =
  "text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";

/**
 * Estilo padrão de todo campo que recebe dado (Input, Select, data) no
 * formulário principal do Detail e em qualquer filtro/painel que peça
 * valor ao usuário: só borda embaixo, sem caixa, sem sombra. Nunca
 * reescrever essa string em outro arquivo - importar daqui.
 */
export const DETAIL_LINE_INPUT_CLASS_NAME =
  "h-10 rounded-none border-0 border-b border-border/60 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";

/** Mesmo padrão de `DETAIL_LINE_INPUT_CLASS_NAME`, para Textarea - sem altura fixa, cada campo define a sua via `min-h-[...]` ao combinar a className. */
export const DETAIL_LINE_TEXTAREA_CLASS_NAME =
  "rounded-none border-0 border-b border-border/60 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";

/** Cabeçalho de seção do formulário de Detail: título curto + barra de acento colorida, sem texto descritivo. */
export function DetailSectionHeading({
  title,
  className,
}: {
  title: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="h-4 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
  );
}

export function DetailSectionField({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className={DETAIL_FIELD_LABEL_CLASS_NAME}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </div>
      {children}
    </div>
  );
}
