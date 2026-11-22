"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Estimativa conservadora de largura média de caractere, pro texto de
 * 13px usado no corpo da tabela (`text-[13px]`, `components/ui/table.tsx`)
 * - usada só pra calcular `DISPLAY_TEXT_CHAR_LIMIT` (abaixo), não pra
 * nenhum layout real. Pecar pra cima (cortar meio caractere antes do
 * necessário) é seguro; pecar pra baixo não é - por isso o valor é
 * generoso (a maioria das letras minúsculas fica mais estreita que isso).
 */
const AVERAGE_CHAR_WIDTH_PX = 7;

/**
 * Célula de tabela pra texto que pode ser mais longo que a largura da
 * coluna (nome de projeto, Grupos, participante, etc., inclusive texto
 * livre como nota/descrição) - trunca com "..." dentro da largura
 * disponível e mostra o valor inteiro num tooltip ao passar o mouse. Não
 * usar na primeira coluna (nome/título) - o `ListView` já trata ela como
 * coluna principal automaticamente, com seu próprio limite de largura
 * (ver `getPrimaryColumnId` em `ListView.tsx`).
 *
 * `maxWidthPx` (padrão = `DEFAULT_COLUMN_MAX_WIDTH` de `ListView.tsx`, mas
 * não importado aqui de propósito - não criar dependência circular entre
 * `web-client/ui` e `web-client/views`; o valor literal abaixo precisa
 * ser mantido igual ao de lá) vira **duas** coisas: o `max-width` do
 * wrapper (de sempre) **e** um limite de caracteres pro valor **exibido**
 * (`DISPLAY_TEXT_CHAR_LIMIT` abaixo - o tooltip sempre mostra o `text`
 * inteiro, sem limite nenhum). O limite de caracteres existe por uma
 * pegadinha real do layout automático de tabela HTML (achado em
 * 2026-11-21, coluna "Notas" de Encontros): um `<span>` com
 * `white-space: nowrap` tem largura mínima de conteúdo igual ao texto
 * **inteiro** (não quebra nem uma palavra), e essa largura mínima pode
 * vencer o `max-width` do wrapper e esticar a coluna inteira pra fora da
 * tela - maior o texto, pior o estouro, sem limite nenhum pra texto livre
 * (nota, descrição). Cortar a string *antes* dela chegar no DOM garante
 * que essa largura mínima nunca passe de `maxWidthPx`, **independente**
 * de qualquer detalhe de layout do navegador - o `max-width` continua
 * fazendo o corte visual fino com "..." pra qualquer texto que ainda
 * passe do limite depois do corte (função de segurança, não a principal).
 */
export function TruncatedTextCell({
  text,
  icon,
  emptyLabel = "-",
  className,
  maxWidthPx = 280,
}: {
  text: string | null | undefined;
  icon?: React.ReactNode;
  emptyLabel?: string;
  className?: string;
  maxWidthPx?: number;
}) {
  const value = text?.trim();
  if (!value) {
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  }

  const displayCharLimit = Math.max(10, Math.floor(maxWidthPx / AVERAGE_CHAR_WIDTH_PX));
  const displayValue =
    value.length > displayCharLimit ? `${value.slice(0, displayCharLimit)}…` : value;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn("flex min-w-0 items-center gap-2", className)}
          style={{ maxWidth: maxWidthPx }}
        >
          {icon}
          <span className="min-w-0 truncate">{displayValue}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-left whitespace-pre-wrap">{value}</TooltipContent>
    </Tooltip>
  );
}
