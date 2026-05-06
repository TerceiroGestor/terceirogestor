"use client";

import * as React from "react";
import { Compass, PlayCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type UsageDocumentationItem = {
  id: string;
  title: string;
  content: React.ReactNode;
  searchText?: string;
};

export type UsageFlowItem = {
  id: string;
  title: string;
  description: string;
  tourId: string;
  searchText?: string;
};

type UsageDocumentationProps = {
  title: string;
  items?: UsageDocumentationItem[];
  flows?: UsageFlowItem[];
  children?: React.ReactNode;
  widthPx?: number;
};

const DEFAULT_WIDTH_PX = 380;

export function UsageDocumentation({
  title,
  items,
  flows,
  children,
  widthPx = DEFAULT_WIDTH_PX,
}: UsageDocumentationProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const inset = document.querySelector(
      '[data-slot="sidebar-inset"]',
    ) as HTMLElement | null;
    if (!inset) return;

    const prevPaddingRight = inset.style.paddingRight;
    const prevTransition = inset.style.transition;

    inset.style.transition = inset.style.transition || "padding-right 150ms ease-out";
    inset.style.paddingRight = open ? `${widthPx}px` : prevPaddingRight || "";

    return () => {
      inset.style.paddingRight = prevPaddingRight;
      inset.style.transition = prevTransition;
    };
  }, [open, widthPx]);

  React.useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("tg:usage-docs:open", handleOpen);
    return () => window.removeEventListener("tg:usage-docs:open", handleOpen);
  }, []);

  const filteredItems = React.useMemo(() => {
    const list = items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => {
      const haystack = `${item.title} ${item.searchText ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  const filteredFlows = React.useMemo(() => {
    const list = flows ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((flow) => {
      const haystack = `${flow.title} ${flow.description} ${flow.searchText ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [flows, query]);

  const hasPageDocs = Boolean(items);
  const hasFlows = Boolean(flows?.length);
  const hasAnyHelpContent = hasFlows || hasPageDocs || Boolean(children);

  const [tab, setTab] = React.useState<"flows" | "docs">("flows");

  React.useEffect(() => {
    if (hasFlows) {
      setTab("flows");
      return;
    }
    setTab("docs");
  }, [hasFlows]);

  const startFlow = React.useCallback((tourId: string) => {
    window.dispatchEvent(new CustomEvent("tg:tour:open", { detail: { tourId } }));
    setOpen(false);
  }, []);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex h-svh flex-col border-l border-border/60 bg-background/95 shadow-xl backdrop-blur transition-transform duration-150 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        style={{ width: `${widthPx}px` }}
        aria-hidden={!open}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              Central de ajuda
            </div>
            <div className="mt-0.5 truncate text-base font-semibold">Tire suas duvidas aqui</div>
            <div className="mt-1 truncate text-xs text-muted-foreground">Contexto atual: {title}</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setOpen(false)}
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite sua duvida, termo ou fluxo..."
            className="h-9"
          />

          {hasFlows || hasPageDocs ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={tab === "flows" ? "default" : "outline"}
                className="h-8"
                disabled={!hasFlows}
                onClick={() => setTab("flows")}
              >
                Fluxos guiados
              </Button>
              <Button
                type="button"
                variant={tab === "docs" ? "default" : "outline"}
                className="h-8"
                disabled={!hasPageDocs}
                onClick={() => setTab("docs")}
              >
                Respostas da pagina
              </Button>
            </div>
          ) : null}

          {hasAnyHelpContent ? (
            <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
              Encontre respostas rapidas, siga fluxos guiados e reduza duvidas operacionais sem sair da tela.
            </div>
          ) : null}

          {tab === "flows" && hasFlows ? (
            filteredFlows.length === 0 ? (
              <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                Nenhum fluxo guiado encontrado para &quot;{query.trim()}&quot;.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFlows.map((flow) => (
                  <div key={flow.id} className="rounded-lg border border-border/60 bg-muted/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{flow.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{flow.description}</p>
                      </div>
                      <Compass className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3 h-8"
                      onClick={() => startFlow(flow.tourId)}
                    >
                      <PlayCircle className="mr-1.5 h-4 w-4" />
                      Iniciar tour
                    </Button>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {tab === "docs" ? (
            items ? (
            <>
              {filteredItems.length === 0 ? (
                <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                  Nenhuma resposta encontrada para &quot;{query.trim()}&quot;.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <details
                      key={item.id}
                      className="group rounded-lg border border-border/60 bg-muted/10 px-3 py-2 open:bg-background"
                    >
                      <summary className="cursor-pointer list-none select-none text-sm font-medium">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate">{item.title}</span>
                          <span className="text-xs text-muted-foreground group-open:hidden">
                            Abrir
                          </span>
                          <span className="hidden text-xs text-muted-foreground group-open:inline">
                            Fechar
                          </span>
                        </div>
                      </summary>
                      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {item.content}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </>
            ) : (
              children
            )
          ) : null}

          {!hasAnyHelpContent ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-3 py-3 text-xs leading-5 text-muted-foreground">
              Ainda nao ha conteudo de ajuda cadastrado para este contexto. Em breve voce encontrara aqui respostas, orientacoes e fluxos guiados.
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
