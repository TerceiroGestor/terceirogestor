"use client";

import * as React from "react";
import { SlidersHorizontal, Star, Trash2 } from "lucide-react";
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
import type { Domain } from "@/web-client/domain/types";
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
  snapshot,
  onApplyFavorite,
}: {
  actionId: string;
  searchView: SearchViewDefinition;
  domain: Domain;
  onDomainChange: (next: Domain) => void;
  snapshot: TState;
  onApplyFavorite: (state: TState) => void;
}) {
  const storageKey = `favorites:${actionId}`;
  const [favorites, setFavorites] = React.useState<Array<FavoriteDefinition<TState>>>([]);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    setFavorites(loadFavorites<TState>(storageKey));
  }, [storageKey]);

  const persist = React.useCallback(
    (next: Array<FavoriteDefinition<TState>>) => {
      setFavorites(next);
      saveFavorites(storageKey, next);
    },
    [storageKey],
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
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
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-[min(96vw,68rem)] p-0"
        >
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

              <div className="max-h-[60vh] overflow-auto pr-1">
                <AdvancedFilterBuilder
                  searchView={searchView}
                  value={domain}
                  onChange={onDomainChange}
                />
              </div>
            </div>

            <div className="border-b border-border/60 p-3 md:border-b-0 md:border-r">
              <div className="mb-2 text-xs font-semibold text-foreground">Agrupar por</div>
              {searchView.groupBy?.length ? (
                <div className="space-y-1">
                  {searchView.groupBy.map((opt) => (
                    <div
                      key={opt.field}
                      className="rounded-sm px-2 py-1.5 text-xs text-muted-foreground"
                      title="GroupBy será ligado em uma próxima etapa"
                    >
                      {opt.label}
                    </div>
                  ))}
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
    </>
  );
}

