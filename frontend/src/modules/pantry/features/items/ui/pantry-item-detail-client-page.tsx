"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR, formatDateTimePtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import {
  createPantrySector,
  listPantryItemAuditLogs,
  listPantrySectors,
  type ApiPantryAuditLog,
  type ApiPantryItem,
} from "@/modules/pantry/api";

type Mode = "create" | "edit";

type ItemDraft = {
  name: string;
  group: string | null;
  defaultSector: string;
  unit: string;
  minStock: number;
  notes: string | null;
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
    notes: draft.notes?.trim() ? draft.notes.trim() : null,
  };
}

function draftFromItem(item: ApiPantryItem): ItemDraft {
  return {
    name: item.name ?? "",
    group: item.group ?? null,
    defaultSector: item.defaultSector ?? "Geral",
    unit: item.unit ?? "kg",
    minStock: Number(item.minStock ?? 0),
    notes: item.notes ?? null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const ITEM_AUDIT_LABELS: Record<string, string> = {
  name: "Nome",
  group: "Grupo",
  defaultSector: "Setor",
  unit: "Unidade",
  minStock: "Estoque mínimo",
  notes: "Notas internas",
};

function resolveAuditActionLabel(action: ApiPantryAuditLog["action"]) {
  switch (action) {
    case "CREATE":
      return "Criado";
    case "UPDATE":
      return "Atualizado";
    case "DELETE":
      return "Removido";
    default:
      return action;
  }
}

function formatAuditValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value.trim() ? value : "—";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function diffAuditFields(log: ApiPantryAuditLog) {
  const before = isRecord(log.before) ? log.before : {};
  const after = isRecord(log.after) ? log.after : {};
  const keys = Object.keys({ ...before, ...after }).filter((k) => k in ITEM_AUDIT_LABELS);

  return keys
    .map((key) => ({
      key,
      label: ITEM_AUDIT_LABELS[key] ?? key,
      before: before[key],
      after: after[key],
    }))
    .filter((row) => JSON.stringify(row.before) !== JSON.stringify(row.after));
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
    notes: null,
  });
  const lastSavedRef = React.useRef<ItemDraft>(draft);

  const [loading, setLoading] = React.useState(mode === "edit");
  const [saving, setSaving] = React.useState(false);

  const [sectorsLoading, setSectorsLoading] = React.useState(false);
  const [sectors, setSectors] = React.useState<string[]>([]);
  const [newSectorOpen, setNewSectorOpen] = React.useState(false);
  const [newSectorName, setNewSectorName] = React.useState("");

  const [auditLoading, setAuditLoading] = React.useState(false);
  const [auditLogs, setAuditLogs] = React.useState<ApiPantryAuditLog[]>([]);

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

  const loadSectors = React.useCallback(async () => {
    if (!token || !enabled) return;
    setSectorsLoading(true);
    try {
      const response = await listPantrySectors(token);
      const list = response.data.map((s) => s.name).filter(Boolean);
      setSectors(list.sort((a, b) => a.localeCompare(b)));
    } catch {
      setSectors([]);
    } finally {
      setSectorsLoading(false);
    }
  }, [enabled, token]);

  const loadAudit = React.useCallback(async () => {
    if (!token || !enabled || mode !== "edit") return;
    setAuditLoading(true);
    try {
      const response = await listPantryItemAuditLogs(token, id, { limit: 120 });
      setAuditLogs(response.data);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, [enabled, id, mode, token]);

  React.useEffect(() => {
    void loadItem();
  }, [loadItem]);

  React.useEffect(() => {
    void loadSectors();
  }, [loadSectors]);

  React.useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

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

  const sectorOptions = React.useMemo(() => {
    const current = normalizeDraft(draft).defaultSector;
    const set = new Set<string>(["Geral", ...sectors]);
    if (current) set.add(current);
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [draft, sectors]);

  const createSector = React.useCallback(async () => {
    if (!token) return;
    const name = newSectorName.trim();
    if (!name) return;

    setSaving(true);
    try {
      await createPantrySector(token, { name });
      setNewSectorOpen(false);
      setNewSectorName("");
      await loadSectors();
      setDraft((prev) => ({ ...prev, defaultSector: name }));
      if (mode !== "create") {
        await applyPatch({ defaultSector: name });
      }
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao criar setor.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setSaving(false);
    }
  }, [applyPatch, loadSectors, mode, newSectorName, toast, token]);

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
                  <div className="flex items-center gap-2">
                    <Select
                      value={draft.defaultSector}
                      onValueChange={(value) => {
                        setDraft((prev) => ({ ...prev, defaultSector: value }));
                        if (mode !== "create") void applyPatch({ defaultSector: value });
                      }}
                      disabled={readOnly || sectorsLoading}
                    >
                      <SelectTrigger className={inputLineClassName}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sectorOptions.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {!readOnly ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Novo setor"
                        aria-label="Novo setor"
                        onClick={() => setNewSectorOpen(true)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    ) : null}
                  </div>
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
                <TabsTrigger value="notes">
                  Notas internas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity">
                {mode !== "edit" ? (
                  <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    Salve o registro para ver a auditoria.
                  </div>
                ) : auditLoading ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : auditLogs.length ? (
                  <div className="space-y-2">
                    {auditLogs.slice(0, 120).map((log) => {
                      const actor = log.user?.name ?? log.user?.email ?? "Sistema";
                      const rows = log.action === "UPDATE" ? diffAuditFields(log) : [];

                      return (
                        <div
                          key={log.id}
                          className="rounded-md border border-border/60 bg-muted/10 px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-xs font-semibold text-foreground">
                              {actor}
                            </div>
                            <div className="shrink-0 text-[11px] text-muted-foreground">
                              {formatDateTimePtBR(log.createdAt)}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {resolveAuditActionLabel(log.action)}
                          </div>
                          {rows.length ? (
                            <div className="mt-2 space-y-1">
                              {rows.map((row) => (
                                <div key={row.key} className="text-xs text-foreground">
                                  <span className="text-muted-foreground">{row.label}:</span>{" "}
                                  <span className="font-mono">{formatAuditValue(row.before)}</span>{" "}
                                  <span className="text-muted-foreground">→</span>{" "}
                                  <span className="font-mono">{formatAuditValue(row.after)}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    Sem auditoria.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes">
                <div className="space-y-2">
                  <Textarea
                    value={draft.notes ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, notes: e.target.value || null }))
                    }
                    onBlur={() => maybeCommitField("notes")}
                    placeholder="Anotações internas..."
                    className="min-h-[220px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    readOnly={readOnly}
                  />
                  <div className="text-[11px] text-muted-foreground">
                    Essas notas ficam salvas no registro.
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={newSectorOpen} onOpenChange={setNewSectorOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Novo setor</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Nome do setor</div>
            <Input
              value={newSectorName}
              onChange={(e) => setNewSectorName(e.target.value)}
              placeholder="Ex: Congelados"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewSectorOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={createSector} disabled={!newSectorName.trim() || saving}>
              {saving ? "Salvando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PantryItemNewClientPage() {
  return <PantryItemDetailClientPage mode="create" />;
}

export function PantryItemEditClientPage() {
  return <PantryItemDetailClientPage mode="edit" />;
}
