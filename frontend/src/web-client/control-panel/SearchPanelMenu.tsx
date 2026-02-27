"use client";

import * as React from "react";
import { Check, SlidersHorizontal, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Domain, DomainCombinator } from "@/web-client/domain/types";
import type { SearchViewDefinition } from "@/web-client/search/types";
import { AdvancedFilterBuilder } from "@/web-client/control-panel/AdvancedFilterBuilder";
import {
  loadFavorites,
  saveFavorites,
  type FavoriteDefinition,
} from "@/web-client/control-panel/favorites-storage";

export function SearchPanelMenu<TState extends Record<string, unknown>>({
  actionId,
  searchView,
  domain,
  onDomainChange,
  groupBy,
  onGroupByChange,
  groupByMode = "single",
  allowEmptyGroupBy = false,
  variant = "wide",
  trigger,
  valueSuggestions,
  snapshot,
  onApplyFavorite,
}: {
  actionId: string;
  searchView: SearchViewDefinition;
  domain: Domain;
  onDomainChange: (next: Domain) => void;
  groupBy: string[];
  onGroupByChange: (next: string[]) => void;
  groupByMode?: "single" | "multi";
  allowEmptyGroupBy?: boolean;
  variant?: "wide" | "compact";
  trigger?: React.ReactNode;
  valueSuggestions?: (fieldName: string) => string[];
  snapshot: TState;
  onApplyFavorite: (state: TState) => void;
}) {
  const storageKey = `favorites:${actionId}`;
  const hasAdvancedFilters = searchView.fields.length > 0;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [favorites, setFavorites] = React.useState<Array<FavoriteDefinition<TState>>>([]);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [customFilterOpen, setCustomFilterOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [pendingDomain, setPendingDomain] = React.useState<Domain>(domain);
  const allowedCombinators = React.useMemo<DomainCombinator[]>(() => {
    const configured = searchView.filterCombinators?.filter(Boolean);
    return configured?.length ? configured : ["and"];
  }, [searchView.filterCombinators]);

  React.useEffect(() => {
    setFavorites(loadFavorites<TState>(storageKey));
  }, [storageKey]);

  React.useEffect(() => {
    if (!customFilterOpen) return;
    setPendingDomain(domain);
  }, [customFilterOpen, domain]);

  const persist = React.useCallback(
    (next: Array<FavoriteDefinition<TState>>) => {
      setFavorites(next);
      saveFavorites(storageKey, next);
    },
    [storageKey],
  );

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Pesquisar"
              aria-label="Pesquisar"
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={variant === "compact" ? "end" : "start"}
          sideOffset={6}
          className={
            variant === "compact" ? "w-[min(96vw,36rem)] p-2" : "w-[min(96vw,68rem)] p-0"
          }
        >
          {variant === "compact" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <SlidersHorizontal className="size-4" />
                  Filtros
                </div>

                {searchView.presets?.length ? (
                  <div className="space-y-1">
                    {searchView.presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        onClick={(e) => {
                          e.preventDefault();
                          onDomainChange(preset.domain);
                        }}
                      >
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground disabled:opacity-50"
                  disabled={!hasAdvancedFilters}
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    setCustomFilterOpen(true);
                  }}
                >
                  <span className="truncate">Filtro personalizado...</span>
                </button>

                {!hasAdvancedFilters ? (
                  <div className="px-2 text-xs text-muted-foreground">
                    Nenhum filtro configurado.
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Agrupar por
                  </div>
                  {searchView.groupBy?.length ? (
                    <div className="space-y-1">
                      {searchView.groupBy.map((opt) => (
                        <button
                          key={opt.field}
                          type="button"
                          className={[
                            "flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-xs",
                            groupBy.includes(opt.field)
                              ? "bg-muted/40 text-foreground"
                              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                          ].join(" ")}
                          onClick={(e) => {
                            e.preventDefault();
                            const isActive = groupBy.includes(opt.field);
                            if (groupByMode === "multi") {
                              const next = isActive
                                ? groupBy.filter((field) => field !== opt.field)
                                : [...groupBy, opt.field];
                              onGroupByChange(next);
                              return;
                            }
                            if (isActive) {
                              if (allowEmptyGroupBy) onGroupByChange([]);
                              return;
                            }
                            onGroupByChange([opt.field]);
                          }}
                          title="Organizar por"
                        >
                          <span className="truncate">{opt.label}</span>
                          {groupBy.includes(opt.field) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                              <Check className="size-3.5" />
                              Ativo
                            </span>
                          ) : null}
                        </button>
                      ))}
                      {groupByMode === "multi" && groupBy.length ? (
                        <button
                          type="button"
                          className="w-full rounded-sm px-2 py-1 text-left text-[11px] text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            onGroupByChange([]);
                          }}
                        >
                          Limpar agrupamento
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="px-2 text-xs text-muted-foreground">Nenhuma opção.</div>
                  )}
                </div>

                <div className="h-px w-full bg-border/60" />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Star className="size-4" />
                    Favoritos
                  </div>

                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      setName("");
                      setMenuOpen(false);
                      setSaveOpen(true);
                    }}
                  >
                    <Star className="size-4" />
                    Salvar pesquisa atual...
                  </button>

                  <div className="max-h-[40vh] space-y-1 overflow-auto pr-1">
                    {favorites.length ? (
                      favorites.map((fav) => (
                        <div
                          key={fav.id}
                          className="flex items-center justify-between gap-2 rounded-sm px-2 py-1 text-xs hover:bg-muted/30"
                        >
                          <button
                            type="button"
                            className="min-w-0 flex-1 truncate text-left"
                            title={fav.name}
                            onClick={(e) => {
                              e.preventDefault();
                              onApplyFavorite(fav.state);
                            }}
                          >
                            {fav.name}
                          </button>
                          <button
                            type="button"
                            className="inline-flex size-7 items-center justify-center rounded hover:bg-muted"
                            title="Remover"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!window.confirm(`Remover favorito "${fav.name}"?`)) return;
                              persist(favorites.filter((item) => item.id !== fav.id));
                            }}
                          >
                            <Trash2 className="size-4 text-muted-foreground" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="px-2 text-xs text-muted-foreground">
                        Nenhum favorito salvo.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
            <div className="border-b border-border/60 p-3 md:border-b-0 md:border-r">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                <SlidersHorizontal className="size-4 text-muted-foreground" />
                Filtros
              </div>

              {searchView.presets?.length ? (
                <div className="mb-3 space-y-1">
                  {searchView.presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted/30"
                      onClick={(e) => {
                        e.preventDefault();
                        onDomainChange(preset.domain);
                      }}
                    >
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                className="mt-2 w-full rounded-sm px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground disabled:opacity-50"
                disabled={!hasAdvancedFilters}
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  setCustomFilterOpen(true);
                }}
              >
                Filtro personalizado...
              </button>

              {!hasAdvancedFilters ? (
                <div className="mt-2 text-xs text-muted-foreground">Nenhum filtro configurado.</div>
              ) : null}
            </div>

            <div className="border-b border-border/60 p-3 md:border-b-0 md:border-r">
              <div className="mb-2 text-xs font-semibold text-foreground">Agrupar por</div>
              {searchView.groupBy?.length ? (
                <div className="space-y-1">
                  {searchView.groupBy.map((opt) => (
                    <button
                      key={opt.field}
                      type="button"
                      className={[
                        "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs",
                        groupBy.includes(opt.field)
                          ? "bg-muted/40 text-foreground"
                          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                      ].join(" ")}
                      onClick={(e) => {
                        e.preventDefault();
                        const isActive = groupBy.includes(opt.field);
                        if (groupByMode === "multi") {
                          const next = isActive
                            ? groupBy.filter((field) => field !== opt.field)
                            : [...groupBy, opt.field];
                          onGroupByChange(next);
                          return;
                        }
                        if (isActive) {
                          if (allowEmptyGroupBy) onGroupByChange([]);
                          return;
                        }
                        onGroupByChange([opt.field]);
                      }}
                      title="Organizar por"
                    >
                      <span className="truncate">{opt.label}</span>
                      {groupBy.includes(opt.field) ? (
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Ativo
                        </span>
                      ) : null}
                    </button>
                  ))}
                  {groupByMode === "multi" && groupBy.length ? (
                    <button
                      type="button"
                      className="mt-2 w-full rounded-sm px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        onGroupByChange([]);
                      }}
                    >
                      Limpar agrupamento
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Nenhuma opção.</div>
              )}
            </div>

            <div className="p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                <Star className="size-4 text-muted-foreground" />
                Favoritos
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full justify-start"
                onClick={(e) => {
                  e.preventDefault();
                  setName("");
                  setMenuOpen(false);
                  setSaveOpen(true);
                }}
              >
                <Star className="mr-2 size-4" />
                Salvar pesquisa atual...
              </Button>

              <div className="mt-3 max-h-[60vh] space-y-1 overflow-auto pr-1">
                {favorites.length ? (
                  favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-muted/30"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left"
                        title={fav.name}
                        onClick={(e) => {
                          e.preventDefault();
                          onApplyFavorite(fav.state);
                        }}
                      >
                        {fav.name}
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded hover:bg-muted"
                        title="Remover"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!window.confirm(`Remover favorito "${fav.name}"?`)) return;
                          persist(favorites.filter((item) => item.id !== fav.id));
                        }}
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground">Nenhum favorito salvo.</div>
                )}
              </div>
            </div>
          </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar favorito</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="favorite-name">Nome</Label>
            <Input
              id="favorite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Entradas em fevereiro"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                const trimmed = name.trim();
                if (!trimmed) return;
                const next: FavoriteDefinition<TState> = {
                  id: crypto.randomUUID(),
                  name: trimmed,
                  state: snapshot,
                  createdAt: new Date().toISOString(),
                };
                persist([next, ...favorites]);
                setSaveOpen(false);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customFilterOpen} onOpenChange={setCustomFilterOpen}>
        <DialogContent className="w-[min(96vw,68rem)]">
          <DialogHeader>
            <DialogTitle>Filtro personalizado</DialogTitle>
          </DialogHeader>
          {hasAdvancedFilters ? (
            <AdvancedFilterBuilder
              key={customFilterOpen ? "open" : "closed"}
              searchView={searchView}
              value={pendingDomain}
              onChange={setPendingDomain}
              density="line"
              syncFromValue={false}
              allowedCombinators={allowedCombinators}
              valueSuggestions={valueSuggestions}
              className="max-h-[65vh] overflow-auto pr-1"
            />
          ) : (
            <div className="text-sm text-muted-foreground">Nenhum filtro configurado.</div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomFilterOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                onDomainChange(pendingDomain);
                setCustomFilterOpen(false);
              }}
              disabled={!hasAdvancedFilters}
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
