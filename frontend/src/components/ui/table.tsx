"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"table"> & { containerClassName?: string }) {
  return (
    // Sem overflow próprio de propósito: este container não é mais o
    // contêiner de scroll horizontal da tabela - `ListView.tsx` já tem o
    // seu, um nível acima (`overflow-auto`, que rola nos dois eixos). Ter
    // dois contêineres de scroll aninhados aqui (este com overflow-x-auto
    // sozinho, o de fora com overflow-auto) quebrava o `position: sticky`
    // do cabeçalho - ele ficava "sticky" em relação ao de dentro, que só
    // rola horizontalmente, nunca verticalmente, então o sticky vertical
    // nunca tinha efeito (achado em 2026-11-20, lista principal de
    // Atividades: cabeçalho e barra de ação não travavam, tudo rolava
    // junto). Único contêiner de scroll = sticky funciona relativo a ele.
    <div
      data-slot="table-container"
      className={cn("relative w-full", containerClassName)}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-table-header [&_tr]:border-b [&_tr]:border-table-border", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "text-table-row-foreground border-b border-table-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "px-[var(--table-cell-padding-x)] py-[var(--table-header-padding-y)] text-left align-middle text-[11px] font-medium text-table-header-foreground uppercase tracking-[0.16em] whitespace-nowrap overflow-hidden text-ellipsis w-auto [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Margem de tolerância pra decidir que uma célula truncou de verdade
 * (`scrollWidth - clientWidth`, veja abaixo) - 1px não bastava: em
 * Windows com escala de tela diferente de 100% (125%/150%, comum), o
 * arredondamento de subpixel do layout por si só já cria 1-2px de
 * diferença entre `scrollWidth`/`clientWidth` em células que não
 * truncaram nada visualmente (achado em 2026-11-21 - usuário viu balão
 * em célula sem nenhum corte de texto visível). 2px cobre esse
 * arredondamento sem deixar passar truncamento real (que é bem maior que
 * isso - a largura de pelo menos mais um caractere).
 */
const CELL_OVERFLOW_TOLERANCE_PX = 2

/**
 * Tooltip automático (o mesmo balão estilizado de `TruncatedTextCell` -
 * `Tooltip`/`TooltipContent`, `components/ui/tooltip.tsx`) em qualquer
 * célula que trunque de verdade (`scrollWidth > clientWidth`, medido no
 * próprio `<td>`) - nenhum módulo precisa envolver o valor em nada pra
 * ganhar isso (2026-11-21: antes só quem usava `TruncatedTextCell`
 * manualmente tinha tooltip; a maioria das colunas - data, número,
 * "Tipo", a coluna principal - não tinha nenhum). Funciona com qualquer
 * conteúdo porque lê `textContent` do DOM já renderizado, não o
 * `children` do React - não interessa se é texto puro, um `<div>`
 * aninhado ou um `<Badge>`. Não duplica tooltip em quem já usa
 * `TruncatedTextCell`: a truncagem dela acontece num `<span>` **interno**
 * (seu próprio `overflow-hidden`/`text-ellipsis`), então o `<td>` por
 * fora nunca mede overflow (o filho já ficou do tamanho certo) - só este
 * `<td>` vira o ponto de truncagem quando não há wrapper próprio.
 * `ResizeObserver` reavalia ao redimensionar (resize de janela, mudança
 * de coluna). Só envolve em `Tooltip`/`TooltipTrigger` quando há overflow
 * de verdade - sem isso, qualquer célula curta também ganharia um balão
 * vazio ao passar o mouse. A 1ª medição espera 2 `requestAnimationFrame`
 * (layout/pintura assentarem, inclusive fonte web ainda carregando) antes
 * de checar - sem isso, uma medição cedo demais podia "travar" como
 * truncada mesmo depois do layout final não truncar mais (o
 * `ResizeObserver` só reage de novo se o próprio `<td>` mudar de
 * tamanho, não se só o texto reflow sem mudar a caixa).
 */
function TableCell({ className, children, ...props }: React.ComponentProps<"td">) {
  const ref = React.useRef<HTMLTableCellElement>(null)
  const [overflowText, setOverflowText] = React.useState<string | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => {
      const isTruncated = el.scrollWidth > el.clientWidth + CELL_OVERFLOW_TOLERANCE_PX
      setOverflowText(isTruncated ? el.textContent?.trim() || null : null)
    }

    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(check)
    })
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      observer.disconnect()
    }
  }, [children])

  const cell = (
    <td
      ref={ref}
      data-slot="table-cell"
      className={cn(
        "px-[var(--table-cell-padding-x)] py-[var(--table-cell-padding-y)] align-middle text-[13px] whitespace-nowrap overflow-hidden text-ellipsis w-auto [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    >
      {children}
    </td>
  )

  if (!overflowText) return cell

  return (
    <Tooltip>
      <TooltipTrigger asChild>{cell}</TooltipTrigger>
      <TooltipContent className="max-w-xs text-left whitespace-pre-wrap">
        {overflowText}
      </TooltipContent>
    </Tooltip>
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
