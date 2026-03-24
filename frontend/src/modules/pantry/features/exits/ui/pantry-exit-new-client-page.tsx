"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { DetailShell } from "@/components/layout/DetailShell";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import {
  createPantryExit,
  createPantrySector,
  listPantryEntries,
  listPantrySectors,
  type ApiPantryEntry,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import {
  PANTRY_DEFAULT_SECTOR,
  PANTRY_DEFAULT_UNIT,
  PANTRY_EXIT_ENTRY_AUTO_VALUE,
  PANTRY_EXIT_TYPE_LABELS,
  PANTRY_EXIT_TYPE_OPTIONS,
  PANTRY_ITEM_UNIT,
  PANTRY_ROUTES,
} from "@/modules/pantry/shared/domain/pantry.constants";

type ExitDraft = {
  itemId: string;
  entryId: string;
  sector: string;
  quantity: number;
  unit: string;
  exitDate: string;
  type: (typeof PANTRY_EXIT_TYPE_OPTIONS)[number];
  eventName: string;
  notes: string;
};

const inputLineClassName =
  "h-9 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:ring-0";

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function resolveRemaining(entry: ApiPantryEntry) {
  if (typeof entry.remaining === "number") return entry.remaining;
  if (typeof entry.allocatedTotal === "number") return entry.quantity - entry.allocatedTotal;
  return entry.quantity;
}

export function PantryExitNewClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");

  const itemId = searchParams.get("itemId") ?? "";
  const entryIdFromQuery = searchParams.get("entryId") ?? "";
  const returnTo = searchParams.get("returnTo");

  const enabled = Boolean(token && canRead && itemId);
  const readOnly = !canCreate;
  const entryLocked = Boolean(entryIdFromQuery);

  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [item, setItem] = React.useState<ApiPantryItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [entriesLoading, setEntriesLoading] = React.useState(false);
  const [entries, setEntries] = React.useState<ApiPantryEntry[]>([]);

  const [sectorsLoading, setSectorsLoading] = React.useState(false);
  const [sectors, setSectors] = React.useState<string[]>([]);

  const [newSectorOpen, setNewSectorOpen] = React.useState(false);
  const [newSectorName, setNewSectorName] = React.useState("");

  const [draft, setDraft] = React.useState<ExitDraft>(() => ({
    itemId,
    entryId: "",
    sector: PANTRY_DEFAULT_SECTOR,
    quantity: 1,
    unit: PANTRY_DEFAULT_UNIT,
    exitDate: todayIsoDate(),
    type: "ATTENDED",
    eventName: "",
    notes: "",
  }));

  React.useEffect(() => {
    setDraft((prev) => ({ ...prev, itemId }));
  }, [itemId]);

  React.useEffect(() => {
    if (!entryIdFromQuery) return;
    setDraft((prev) => ({ ...prev, entryId: entryIdFromQuery }));
  }, [entryIdFromQuery]);

  const close = React.useCallback(() => {
    if (returnTo && returnTo.startsWith("/")) {
      router.push(returnTo);
      return;
    }
    router.push(withTenantPath(PANTRY_ROUTES.stock, tenantSlug));
  }, [returnTo, router, tenantSlug]);

  const loadItem = React.useCallback(async () => {
    if (!enabled) {
      setItem(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const loaded = await dataProvider.read<ApiPantryItem>("pantry.items", itemId);
      setItem(loaded);
      setDraft((prev) => ({
        ...prev,
        unit: loaded.unit ?? prev.unit,
        sector: loaded.defaultSector ?? prev.sector,
      }));
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar o alimento.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, enabled, itemId, toast]);

  const loadEntries = React.useCallback(async () => {
    if (!token || !enabled) return;
    setEntriesLoading(true);
    try {
      const res = await listPantryEntries(token, { itemId, all: true });
      const allRows = res.data ?? [];
      const available = allRows
        .filter((row) => !row.isClosed)
        .filter((row) => resolveRemaining(row) > 0);

      const forced =
        draft.entryId && !available.some((row) => row.id === draft.entryId)
          ? allRows.find((row) => row.id === draft.entryId) ?? null
          : null;

      const list = (forced ? [forced, ...available] : available).sort((a, b) =>
        String(a.expiryDate ?? a.entryDate ?? "").localeCompare(String(b.expiryDate ?? b.entryDate ?? "")),
      );
      setEntries(list);
    } catch {
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }, [draft.entryId, enabled, itemId, token]);

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

  React.useEffect(() => {
    void loadItem();
  }, [loadItem]);

  React.useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  React.useEffect(() => {
    void loadSectors();
  }, [loadSectors]);

  const sectorOptions = React.useMemo(() => {
    const set = new Set<string>([PANTRY_DEFAULT_SECTOR, ...sectors]);
    if (draft.sector?.trim()) set.add(draft.sector.trim());
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [draft.sector, sectors]);

  const selectedEntry = React.useMemo(() => {
    if (!draft.entryId) return null;
    return entries.find((row) => row.id === draft.entryId) ?? null;
  }, [draft.entryId, entries]);

  React.useEffect(() => {
    if (!selectedEntry) return;
    setDraft((prev) => ({
      ...prev,
      sector: selectedEntry.sector ?? PANTRY_DEFAULT_SECTOR,
      unit: selectedEntry.unit ?? prev.unit,
    }));
  }, [selectedEntry]);

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
      setDraft((prev) => ({ ...prev, sector: name }));
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao criar setor.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setSaving(false);
    }
  }, [loadSectors, newSectorName, toast, token]);

  const save = React.useCallback(async () => {
    if (!token || !enabled) return;
    if (!canCreate) {
      toast({
        variant: "destructive",
        title: "Sem permissão",
        description: "Você não tem permissão para registrar saídas.",
      });
      return;
    }

    const quantity = Number(draft.quantity);
    const sector = String(draft.sector ?? "").trim();
    const unit = String(draft.unit ?? "").trim();

    if (!sector || !unit || !Number.isFinite(quantity) || quantity <= 0) {
      toast({
        variant: "destructive",
        title: "Dados inválidos",
        description: "Informe setor, unidade e quantidade.",
      });
      return;
    }

    setSaving(true);
    try {
      await createPantryExit(token, {
        itemId,
        entryId: draft.entryId.trim() ? draft.entryId.trim() : undefined,
        sector,
        quantity,
        unit,
        exitDate: draft.exitDate.trim() ? draft.exitDate.trim() : undefined,
        type: draft.type,
        eventName: draft.eventName.trim() ? draft.eventName.trim() : null,
        notes: draft.notes.trim() ? draft.notes.trim() : null,
      });
      toast({ variant: "success", title: "Saída registrada" });
      close();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao registrar saída.";
      toast({ variant: "destructive", title: "Falha", description: message });
    } finally {
      setSaving(false);
    }
  }, [canCreate, close, draft, enabled, itemId, toast, token]);

  const headerTitle = item?.name ? `Nova saída de ${item.name}` : "Nova saída";

  return (
    <>
      <DetailShell
        breadcrumbTitle="Nova saída"
        breadcrumbItems={[
          { label: "Despensa", href: PANTRY_ROUTES.stock },
          ...(item?.name ? [{ label: item.name, href: `${PANTRY_ROUTES.items}/${itemId}` }] : []),
        ]}
        mode="create"
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={readOnly}
        onSave={save}
        onClose={close}
        mainSlot={
          !itemId ? (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              Informe um item para registrar saída.
            </div>
          ) : (
            <div className="rounded-md border border-border/60 bg-background px-3 py-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[120px_1fr_1fr] md:items-end">
                <Input
                  value={String(draft.quantity)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                  className={inputLineClassName}
                  inputMode="numeric"
                  placeholder="Qtd."
                  readOnly={saving || readOnly}
                />

                <Select
                  value={draft.unit}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, unit: value }))}
                  disabled={saving || readOnly}
                >
                  <SelectTrigger className={inputLineClassName}>
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {PANTRY_ITEM_UNIT.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Select
                    value={draft.sector}
                    onValueChange={(value) => setDraft((prev) => ({ ...prev, sector: value }))}
                    disabled={saving || readOnly || Boolean(selectedEntry)}
                  >
                    <SelectTrigger className={inputLineClassName}>
                      <SelectValue placeholder={sectorsLoading ? "Carregando..." : "Setor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorOptions.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    title="Novo setor"
                    aria-label="Novo setor"
                    onClick={() => setNewSectorOpen(true)}
                    disabled={saving || readOnly || Boolean(selectedEntry)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_180px_180px] md:items-end">
                <div>
                  <Select
                    value={draft.entryId || PANTRY_EXIT_ENTRY_AUTO_VALUE}
                    onValueChange={(value) =>
                      setDraft((prev) => {
                        const nextEntryId = value === PANTRY_EXIT_ENTRY_AUTO_VALUE ? "" : value;
                        const nextEntry = entries.find((row) => row.id === nextEntryId) ?? null;
                        return {
                          ...prev,
                          entryId: nextEntryId,
                          sector: nextEntry ? nextEntry.sector ?? PANTRY_DEFAULT_SECTOR : item?.defaultSector ?? prev.sector,
                          unit: nextEntry ? nextEntry.unit ?? prev.unit : prev.unit,
                        };
                      })
                    }
                    disabled={saving || readOnly || entryLocked}
                  >
                    <SelectTrigger className={inputLineClassName}>
                      <SelectValue placeholder={entriesLoading ? "Carregando..." : "Validade (lote)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PANTRY_EXIT_ENTRY_AUTO_VALUE}>Automático</SelectItem>
                      {entries.map((entry) => {
                        const remaining = resolveRemaining(entry);
                        const expiry = entry.expiryDate ? formatDateOnlyPtBR(entry.expiryDate) : "—";
                        return (
                          <SelectItem key={entry.id} value={entry.id}>
                            {`Validade ${expiry} • ${entry.sector || PANTRY_DEFAULT_SECTOR} • ${Number(remaining).toLocaleString("pt-BR")} ${entry.unit}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {selectedEntry ? (
                      <>
                        Saindo do lote com validade{" "}
                        <span className="font-medium text-foreground">
                          {selectedEntry.expiryDate ? formatDateOnlyPtBR(selectedEntry.expiryDate) : "—"}
                        </span>
                        {" • "}
                        <span className="font-medium text-foreground">
                          {selectedEntry.sector || PANTRY_DEFAULT_SECTOR}
                        </span>
                        {" • restante "}
                        <span className="font-mono font-medium text-foreground">
                          {Number(resolveRemaining(selectedEntry)).toLocaleString("pt-BR")} {selectedEntry.unit}
                        </span>
                      </>
                    ) : (
                      "Automático: usa a validade mais próxima disponível."
                    )}
                  </div>
                </div>

                <Input
                  type="date"
                  value={draft.exitDate}
                  onChange={(e) => setDraft((prev) => ({ ...prev, exitDate: e.target.value }))}
                  className={inputLineClassName}
                  readOnly={saving || readOnly}
                  title="Data da saída"
                />

                <Select
                  value={draft.type}
                  onValueChange={(value) =>
                    setDraft((prev) => ({ ...prev, type: value as ExitDraft["type"] }))
                  }
                  disabled={saving || readOnly}
                >
                  <SelectTrigger className={inputLineClassName}>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PANTRY_EXIT_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {PANTRY_EXIT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {draft.type === "EVENT" ? (
                <div className="mt-3">
                  <Input
                    value={draft.eventName}
                    onChange={(e) => setDraft((prev) => ({ ...prev, eventName: e.target.value }))}
                    className={inputLineClassName}
                    placeholder="Nome do evento"
                    readOnly={saving || readOnly}
                  />
                </div>
              ) : null}

              <div className="mt-3">
                <Input
                  value={draft.notes}
                  onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
                  className={inputLineClassName}
                  placeholder="Notas (opcional)"
                  readOnly={saving || readOnly}
                />
              </div>
            </div>
          )
        }
        sideSlot={
          <div className="rounded-md border border-border/60 bg-background">
            <Tabs defaultValue="activity">
              <TabsList className="h-9 w-full justify-start gap-4 rounded-none border-0 border-b border-border/60 bg-transparent px-3">
                <TabsTrigger
                  value="activity"
                  className="rounded-none border-b-2 border-transparent bg-transparent px-0 text-xs text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground"
                >
                  Atividade
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="rounded-none border-b-2 border-transparent bg-transparent px-0 text-xs text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground"
                >
                  Notas internas
                </TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="p-4">
                <div className="text-sm text-muted-foreground">Salve para ver a auditoria.</div>
              </TabsContent>
              <TabsContent value="notes" className="p-4">
                <div className="text-sm text-muted-foreground">
                  Notas internas estarão disponíveis na próxima versão.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        }
      />

      <Dialog open={newSectorOpen} onOpenChange={setNewSectorOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Novo setor</DialogTitle>
          </DialogHeader>

          <Input
            value={newSectorName}
            onChange={(e) => setNewSectorName(e.target.value)}
            placeholder="Ex: Estoque"
          />

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setNewSectorOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={createSector} disabled={saving || !newSectorName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
