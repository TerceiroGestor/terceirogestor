"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import type { ApiPantryHistoryMovement, ApiPantryItem } from "@/modules/pantry/api";

type Mode = "create" | "edit";

type ItemDraft = {
  name: string;
  group: string | null;
  defaultSector: string;
  unit: string;
  minStock: number;
};

const inputLineClassName =
  "h-9 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:ring-0";

function toInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDraft(draft: ItemDraft): ItemDraft {
  return {
    name: draft.name.trim(),
    group: draft.group?.trim() ? draft.group.trim() : null,
    defaultSector: draft.defaultSector.trim() || "Geral",
    unit: draft.unit.trim(),
    minStock: Number.isFinite(draft.minStock) ? draft.minStock : 0,
  };
}

function draftFromItem(item: ApiPantryItem): ItemDraft {
  return {
    name: item.name ?? "",
    group: item.group ?? null,
    defaultSector: item.defaultSector ?? "Geral",
    unit: item.unit ?? "kg",
    minStock: Number(item.minStock ?? 0),
  };
}

function describeHistoryRow(row: ApiPantryHistoryMovement) {
  const kindLabel = row.kind === "ENTRY" ? "Entrada" : "Saída";
  const qty = Number(row.quantity).toLocaleString("pt-BR");
  const sector = row.sector ? ` • ${row.sector}` : "";
  const donor = row.donorName ? ` • ${row.donorName}` : "";
  const event = row.eventName ? ` • ${row.eventName}` : "";
  return `${kindLabel} • ${qty} ${row.unit}${sector}${donor}${event}`;
}

export function PantryItemDetailClientPage({ mode }: { mode: Mode }) {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");
  const canUpdate = permissions.includes("pantry.update");

  const id = mode === "edit" ? (params?.id ? String(params.id) : "") : "";
  const enabled = Boolean(token && canRead && (mode === "create" || id));

  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [item, setItem] = React.useState<ApiPantryItem | null>(null);
  const [draft, setDraft] = React.useState<ItemDraft>({
    name: "",
    group: null,
    defaultSector: "Geral",
    unit: "kg",
    minStock: 0,
  });
  const lastSavedRef = React.useRef<ItemDraft>(draft);

  const [loading, setLoading] = React.useState(mode === "edit");
  const [saving, setSaving] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [history, setHistory] = React.useState<ApiPantryHistoryMovement[]>([]);

  const backToList = React.useCallback(() => {
    router.push(withTenantPath("/pantry/items", tenantSlug));
  }, [router, tenantSlug]);

  const loadItem = React.useCallback(async () => {
    if (!enabled || mode !== "edit") return;
    setLoading(true);
    try {
      const loaded = await dataProvider.read<ApiPantryItem>("pantry.items", id);
      setItem(loaded);
      const nextDraft = draftFromItem(loaded);
      setDraft(nextDraft);
      lastSavedRef.current = nextDraft;
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar alimento.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, enabled, id, mode, toast]);

  const loadHistory = React.useCallback(async () => {
    if (!enabled || mode !== "edit") return;
    setHistoryLoading(true);
    try {
      const response = await dataProvider.search<ApiPantryHistoryMovement>("pantry.history", {
        domain: { type: "condition", field: "itemId", operator: "=", value: id },
        all: true,
      });
      setHistory(
        response.data
          .slice()
          .sort((a, b) => Date.parse(b.movementDate) - Date.parse(a.movementDate)),
      );
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [dataProvider, enabled, id, mode]);

  React.useEffect(() => {
    void loadItem();
  }, [loadItem]);

  React.useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const applyPatch = React.useCallback(
    async (patch: Partial<ItemDraft>) => {
      if (!enabled) return;
      if (mode === "create") return;
      if (!canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar alimentos.",
        });
        return;
      }

      setSaving(true);
      try {
        const updated = await dataProvider.update<ApiPantryItem>("pantry.items", id, patch);
        setItem(updated);
        const nextDraft = draftFromItem(updated);
        setDraft(nextDraft);
        lastSavedRef.current = nextDraft;
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar.";
        toast({ variant: "destructive", title: "Falha ao salvar", description: message });
      } finally {
        setSaving(false);
      }
    },
    [canUpdate, dataProvider, enabled, id, mode, toast],
  );

  const createItem = React.useCallback(async () => {
    if (!enabled) return;
    if (!canCreate) {
      toast({
        variant: "destructive",
        title: "Sem permissão",
        description: "Você não tem permissão para criar alimentos.",
      });
      return;
    }

    const normalized = normalizeDraft(draft);
    if (!normalized.name || !normalized.unit || !normalized.defaultSector) {
      toast({
        variant: "destructive",
        title: "Dados inválidos",
        description: "Preencha nome, setor e unidade.",
      });
      return;
    }

    setSaving(true);
    try {
      const created = await dataProvider.create<ApiPantryItem>("pantry.items", normalized);
      toast({ variant: "success", title: "Alimento criado" });
      router.replace(withTenantPath(`/pantry/items/${created.id}`, tenantSlug));
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao criar alimento.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setSaving(false);
    }
  }, [canCreate, dataProvider, draft, enabled, router, tenantSlug, toast]);

  const headerTitle =
    mode === "create" ? "Novo alimento" : item?.name ? item.name : "Alimento";

  const readOnly = mode === "edit" ? !canUpdate : !canCreate;

  const maybeCommitField = (key: keyof ItemDraft) => {
    if (mode === "create") return;
    const current = normalizeDraft(draft);
    const last = lastSavedRef.current;
    if (current[key] === last[key]) return;
    void applyPatch({ [key]: current[key] } as Partial<ItemDraft>);
  };

  return (
    <div className="px-4 py-4">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              {mode === "create" ? "Criar" : "Detalhes"}
            </div>
            <h1 className="truncate text-2xl font-semibold text-foreground">{headerTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            {mode === "create" ? (
              <Button size="sm" onClick={createItem} disabled={saving || readOnly}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            ) : (
              <div className="text-[11px] text-muted-foreground">
                {saving ? "Salvando..." : loading ? "Carregando..." : "Pronto"}
              </div>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={backToList}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
          <div className="rounded-md border border-border/60 bg-background p-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-muted-foreground">Nome</div>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                    onBlur={() => maybeCommitField("name")}
                    placeholder="Ex: Arroz"
                    className={inputLineClassName}
                    readOnly={readOnly}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-muted-foreground">Unidade</div>
                  <Input
                    value={draft.unit}
                    onChange={(e) => setDraft((prev) => ({ ...prev, unit: e.target.value }))}
                    onBlur={() => maybeCommitField("unit")}
                    placeholder="Ex: kg"
                    className={inputLineClassName}
                    readOnly={readOnly}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-muted-foreground">Grupo</div>
                  <Input
                    value={draft.group ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, group: e.target.value || null }))
                    }
                    onBlur={() => maybeCommitField("group")}
                    placeholder="Opcional"
                    className={inputLineClassName}
                    readOnly={readOnly}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-muted-foreground">Setor</div>
                  <Input
                    value={draft.defaultSector}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, defaultSector: e.target.value }))
                    }
                    onBlur={() => maybeCommitField("defaultSector")}
                    placeholder="Ex: Geral"
                    className={inputLineClassName}
                    readOnly={readOnly}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    Estoque mínimo
                  </div>
                  <Input
                    type="number"
                    value={String(draft.minStock)}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, minStock: toInt(e.target.value) }))
                    }
                    onBlur={() => maybeCommitField("minStock")}
                    className={inputLineClassName}
                    readOnly={readOnly}
                  />
                </div>
              </div>

              {mode === "edit" && item ? (
                <div className="grid grid-cols-1 gap-3 pt-2 lg:grid-cols-3">
                  <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                    <div className="text-[11px] text-muted-foreground">Saldo</div>
                    <div className="font-mono text-lg tabular-nums text-foreground">
                      {Number(item.stock).toLocaleString("pt-BR")}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {item.isBelowMin ? (
                        <Badge variant="destructive">Abaixo do mínimo</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </div>
                  </div>
                  <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                    <div className="text-[11px] text-muted-foreground">Próx. validade</div>
                    <div className="text-sm font-medium text-foreground">
                      {item.nextExpiryDate ? formatDateOnlyPtBR(item.nextExpiryDate) : "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {item.daysToExpire !== null ? `${item.daysToExpire} dia(s)` : ""}
                    </div>
                  </div>
                  <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                    <div className="text-[11px] text-muted-foreground">Último movimento</div>
                    <div className="text-sm font-medium text-foreground">
                      {item.lastMovementDate ? formatDateOnlyPtBR(item.lastMovementDate) : "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Criado em {formatDateOnlyPtBR(item.createdAt)}
                    </div>
                  </div>
                </div>
              ) : null}

              {readOnly ? (
                <div className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                  {mode === "create"
                    ? "Você não tem permissão para criar."
                    : "Você não tem permissão para editar."}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border border-border/60 bg-background p-3">
            <Tabs defaultValue="activity">
              <TabsList>
                <TabsTrigger value="activity">Atividade</TabsTrigger>
                <TabsTrigger value="notes" disabled>
                  Notas internas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity">
                {mode !== "edit" ? (
                  <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    Salve o registro para ver o histórico.
                  </div>
                ) : historyLoading ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : history.length ? (
                  <div className="space-y-2">
                    {history.slice(0, 80).map((row) => (
                      <div
                        key={row.id}
                        className="rounded-md border border-border/60 bg-muted/10 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-xs font-semibold text-foreground">
                            {row.actor}
                          </div>
                          <div className="shrink-0 text-[11px] text-muted-foreground">
                            {formatDateOnlyPtBR(row.movementDate)}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {describeHistoryRow(row)}
                        </div>
                        {row.notes ? (
                          <div className="mt-1 text-xs text-foreground">{row.notes}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    Sem histórico.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes">
                <div className="text-sm text-muted-foreground">Em breve.</div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PantryItemNewClientPage() {
  return <PantryItemDetailClientPage mode="create" />;
}

export function PantryItemEditClientPage() {
  return <PantryItemDetailClientPage mode="edit" />;
}
