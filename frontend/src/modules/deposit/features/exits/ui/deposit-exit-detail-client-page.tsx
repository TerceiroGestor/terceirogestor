"use client";

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
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
import { useConfirm } from "@/components/confirm/use-confirm";
import { DetailShell } from "@/components/layout/DetailShell";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  createDepositSector,
  deleteDepositExit,
  getDepositExit,
  listDepositEntries,
  listDepositSectors,
  updateDepositExit,
  type ApiDepositEntry,
  type ApiDepositExit,
} from "@/modules/deposit/api";
import {
  DEPOSIT_DEFAULT_SECTOR,
  DEPOSIT_DEFAULT_UNIT,
  DEPOSIT_EXIT_ENTRY_AUTO_VALUE,
  DEPOSIT_EXIT_TYPE_LABELS,
  DEPOSIT_EXIT_TYPE_OPTIONS,
  DEPOSIT_ITEM_UNIT,
  DEPOSIT_ROUTES,
} from "@/modules/deposit/shared/domain/deposit.constants";

type ExitDraft = {
  entryId: string;
  sector: string;
  quantity: number;
  unit: string;
  exitDate: string;
  type: (typeof DEPOSIT_EXIT_TYPE_OPTIONS)[number];
  destinationName: string;
  notes: string;
};

const inputLineClassName =
  "h-9 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:ring-0";

function normalizeStringOrNull(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function resolveRemaining(entry: ApiDepositEntry) {
  if (typeof entry.remaining === "number") return entry.remaining;
  if (typeof entry.allocatedTotal === "number") return entry.quantity - entry.allocatedTotal;
  return entry.quantity;
}

function draftFromExit(exit: ApiDepositExit): ExitDraft {
  return {
    entryId: exit.entryIds?.length ? String(exit.entryIds[0] ?? "") : "",
    sector: exit.sector ?? DEPOSIT_DEFAULT_SECTOR,
    quantity: Number(exit.quantity ?? 0),
    unit: exit.unit ?? DEPOSIT_DEFAULT_UNIT,
    exitDate: String(exit.exitDate ?? "").slice(0, 10),
    type: exit.type ?? "FINAL_REMOVAL",
    destinationName: exit.destinationName ?? "",
    notes: exit.notes ?? "",
  };
}

export function DepositExitDetailClientPage() {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = permissions.includes("deposit.read");
  const canUpdate = permissions.includes("deposit.update");

  const id = params?.id ? String(params.id) : "";
  const enabled = Boolean(token && canRead && id);
  const readOnly = !canUpdate;

  const returnTo = searchParams.get("returnTo");

  const [exit, setExit] = React.useState<ApiDepositExit | null>(null);
  const [draft, setDraft] = React.useState<ExitDraft>(() => ({
    entryId: "",
    sector: DEPOSIT_DEFAULT_SECTOR,
    quantity: 1,
    unit: DEPOSIT_DEFAULT_UNIT,
    exitDate: "",
    type: "FINAL_REMOVAL",
    destinationName: "",
    notes: "",
  }));
  const lastSavedRef = React.useRef<ExitDraft>(draft);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [entriesLoading, setEntriesLoading] = React.useState(false);
  const [entries, setEntries] = React.useState<ApiDepositEntry[]>([]);

  const [sectorsLoading, setSectorsLoading] = React.useState(false);
  const [sectors, setSectors] = React.useState<string[]>([]);

  const [newSectorOpen, setNewSectorOpen] = React.useState(false);
  const [newSectorName, setNewSectorName] = React.useState("");

  const close = React.useCallback(() => {
    if (returnTo && returnTo.startsWith("/")) {
      router.push(returnTo);
      return;
    }
    if (exit?.itemId) {
      router.push(withTenantPath(`${DEPOSIT_ROUTES.items}/${exit.itemId}`, tenantSlug));
      return;
    }
    router.push(withTenantPath(DEPOSIT_ROUTES.stock, tenantSlug));
  }, [exit?.itemId, returnTo, router, tenantSlug]);

  const loadExit = React.useCallback(async () => {
    if (!enabled || !token) return;
    setLoading(true);
    try {
      const loaded = await getDepositExit(token, id);
      setExit(loaded);
      const next = draftFromExit(loaded);
      setDraft(next);
      lastSavedRef.current = next;
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar saÃ­da.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setExit(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, id, toast, token]);

  const loadEntries = React.useCallback(async () => {
    if (!token || !enabled || !exit?.itemId) return;
    setEntriesLoading(true);
    try {
      const res = await listDepositEntries(token, { itemId: exit.itemId, all: true });
      const list = (res.data ?? [])
        .filter((row) => !row.isClosed)
        .sort((a, b) =>
          String(a.expiryDate ?? a.entryDate ?? "").localeCompare(
            String(b.expiryDate ?? b.entryDate ?? ""),
          ),
        );
      setEntries(list);
    } catch {
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }, [enabled, exit?.itemId, token]);

  const loadSectors = React.useCallback(async () => {
    if (!token || !enabled) return;
    setSectorsLoading(true);
    try {
      const response = await listDepositSectors(token);
      const list = response.data.map((s) => s.name).filter(Boolean);
      setSectors(list.sort((a, b) => a.localeCompare(b)));
    } catch {
      setSectors([]);
    } finally {
      setSectorsLoading(false);
    }
  }, [enabled, token]);

  React.useEffect(() => {
    void loadExit();
  }, [loadExit]);

  React.useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  React.useEffect(() => {
    void loadSectors();
  }, [loadSectors]);

  const sectorOptions = React.useMemo(() => {
    const set = new Set<string>([DEPOSIT_DEFAULT_SECTOR, ...sectors]);
    if (draft.sector?.trim()) set.add(draft.sector.trim());
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [draft.sector, sectors]);

  const selectedEntry = React.useMemo(() => {
    if (!draft.entryId) return null;
    return entries.find((row) => row.id === draft.entryId) ?? null;
  }, [draft.entryId, entries]);

  const applyPatch = React.useCallback(
    async (patch: Partial<ExitDraft>) => {
      if (!token || !enabled || !exit) return;
      if (!canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissÃ£o",
          description: "VocÃª nÃ£o tem permissÃ£o para editar saÃ­das.",
        });
        return;
      }

      setSaving(true);
      try {
        const updated = await updateDepositExit(token, exit.id, {
          entryId: patch.entryId?.trim() ? patch.entryId.trim() : undefined,
          sector: patch.sector ?? undefined,
          quantity: typeof patch.quantity === "number" ? patch.quantity : undefined,
          unit: patch.unit ?? undefined,
          exitDate: patch.exitDate?.trim() ? patch.exitDate.trim() : undefined,
          type: patch.type ?? undefined,
          destinationName: patch.destinationName !== undefined ? normalizeStringOrNull(patch.destinationName) : undefined,
          notes: patch.notes !== undefined ? normalizeStringOrNull(patch.notes) : undefined,
        });
        setExit(updated);
        const next = draftFromExit(updated);
        setDraft(next);
        lastSavedRef.current = next;
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
    [canUpdate, enabled, exit, toast, token],
  );

  const createSector = React.useCallback(async () => {
    if (!token) return;
    const name = newSectorName.trim();
    if (!name) return;

    setSaving(true);
    try {
      await createDepositSector(token, { name });
      setNewSectorOpen(false);
      setNewSectorName("");
      await loadSectors();
      setDraft((prev) => ({ ...prev, sector: name }));
      void applyPatch({ sector: name });
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao criar setor.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setSaving(false);
    }
  }, [applyPatch, loadSectors, newSectorName, toast, token]);

  const maybeCommitField = (key: keyof ExitDraft) => {
    if (!exit) return;
    const current = draft;
    const last = lastSavedRef.current;
    if (current[key] === last[key]) return;
    void applyPatch({ [key]: current[key] } as Partial<ExitDraft>);
  };

  const handleDelete = React.useCallback(async () => {
    if (!token || !exit) return;
    const ok = await confirm({
      title: "Excluir saÃ­da?",
      description: "Esta aÃ§Ã£o nÃ£o pode ser desfeita.",
      confirmLabel: "Excluir",
      confirmVariant: "destructive",
    });
    if (!ok) return;

    setSaving(true);
    try {
      await deleteDepositExit(token, exit.id);
      toast({ variant: "success", title: "SaÃ­da excluÃ­da" });
      close();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao excluir saÃ­da.";
      toast({ variant: "destructive", title: "Falha ao excluir", description: message });
    } finally {
      setSaving(false);
    }
  }, [close, confirm, exit, toast, token]);

  const headerTitle = exit
    ? `SaÃ­da â€¢ ${formatDateOnlyPtBR(exit.exitDate)}`
    : "SaÃ­da";

  const headerInfoSlot = React.useMemo(() => {
    if (!exit) return null;
    return (
      <div className="rounded-md border border-border/60 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Quantidade</div>
            <div className="font-mono font-medium text-foreground tabular-nums">
              {Number(exit.quantity).toLocaleString("pt-BR")} {exit.unit}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Tipo</div>
            <div className="font-medium text-foreground">
              {DEPOSIT_EXIT_TYPE_LABELS[exit.type]}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Setor</div>
            <div className="font-medium text-foreground">
              {exit.sector || DEPOSIT_DEFAULT_SECTOR}
            </div>
          </div>
        </div>
      </div>
    );
  }, [exit]);

  return (
    <>
      <DetailShell
        breadcrumbTitle="SaÃ­da"
        breadcrumbItems={[
          { label: "Deposit", href: DEPOSIT_ROUTES.stock },
          ...(exit?.itemId && exit?.item?.name
            ? [{ label: exit.item.name, href: `${DEPOSIT_ROUTES.items}/${exit.itemId}` }]
            : []),
        ]}
        mode="edit"
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={readOnly}
        onClose={close}
        headerActionsSlot={
          exit && canUpdate ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              title="Excluir saÃ­da"
            >
              <Trash2 className="mr-1 size-4" />
              Excluir
            </Button>
          ) : null
        }
        headerInfoSlot={headerInfoSlot}
        mainSlot={
          !exit ? (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              Nenhuma saÃ­da encontrada.
            </div>
          ) : (
            <div className="rounded-md border border-border/60 bg-background px-3 py-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[120px_1fr_1fr] md:items-end">
                <Input
                  value={String(draft.quantity)}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, quantity: Number(e.target.value) }))
                  }
                  onBlur={() => maybeCommitField("quantity")}
                  className={inputLineClassName}
                  inputMode="numeric"
                  placeholder="Qtd."
                  readOnly={saving || readOnly}
                />

                <Select
                  value={draft.unit}
                  onValueChange={(value) => {
                    setDraft((prev) => ({ ...prev, unit: value }));
                    void applyPatch({ unit: value });
                  }}
                  disabled={saving || readOnly}
                >
                  <SelectTrigger className={inputLineClassName}>
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPOSIT_ITEM_UNIT.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Select
                    value={draft.sector}
                    onValueChange={(value) => {
                      setDraft((prev) => ({ ...prev, sector: value }));
                      void applyPatch({ sector: value });
                    }}
                    disabled={saving || readOnly}
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
                    disabled={saving || readOnly}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_180px_180px] md:items-end">
                <div>
                  <Select
                    value={draft.entryId || DEPOSIT_EXIT_ENTRY_AUTO_VALUE}
                    onValueChange={(value) => {
                      const next = value === DEPOSIT_EXIT_ENTRY_AUTO_VALUE ? "" : value;
                      setDraft((prev) => ({ ...prev, entryId: next }));
                      void applyPatch({ entryId: next });
                    }}
                    disabled={saving || readOnly}
                  >
                    <SelectTrigger className={inputLineClassName}>
                      <SelectValue placeholder={entriesLoading ? "Carregando..." : "Entrada de origem"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEPOSIT_EXIT_ENTRY_AUTO_VALUE}>AutomÃ¡tico</SelectItem>
                      {entries.map((entry) => {
                        const remaining = resolveRemaining(entry);
                        const expiry = entry.expiryDate ? formatDateOnlyPtBR(entry.expiryDate) : "â€”";
                        return (
                          <SelectItem key={entry.id} value={entry.id}>
                            {`Data limite ${expiry} â€¢ ${entry.sector || DEPOSIT_DEFAULT_SECTOR} â€¢ ${Number(remaining).toLocaleString("pt-BR")} ${entry.unit}`}
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
                          {selectedEntry.expiryDate ? formatDateOnlyPtBR(selectedEntry.expiryDate) : "â€”"}
                        </span>
                        {" â€¢ "}
                        <span className="font-medium text-foreground">
                          {selectedEntry.sector || DEPOSIT_DEFAULT_SECTOR}
                        </span>
                        {" â€¢ restante "}
                        <span className="font-mono font-medium text-foreground">
                          {Number(resolveRemaining(selectedEntry)).toLocaleString("pt-BR")} {selectedEntry.unit}
                        </span>
                      </>
                    ) : (
                      "AutomÃ¡tico: usa a validade mais prÃ³xima disponÃ­vel."
                    )}
                  </div>
                </div>

                <Input
                  type="date"
                  value={draft.exitDate}
                  onChange={(e) => setDraft((prev) => ({ ...prev, exitDate: e.target.value }))}
                  onBlur={() => maybeCommitField("exitDate")}
                  className={inputLineClassName}
                  readOnly={saving || readOnly}
                  title="Data da saÃ­da"
                />

                <Select
                  value={draft.type}
                  onValueChange={(value) => {
                    setDraft((prev) => ({ ...prev, type: value as ExitDraft["type"] }));
                    void applyPatch({ type: value as ExitDraft["type"] });
                  }}
                  disabled={saving || readOnly}
                >
                  <SelectTrigger className={inputLineClassName}>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPOSIT_EXIT_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {DEPOSIT_EXIT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {draft.type === "TRANSFER" ? (
                <div className="mt-3">
                  <Input
                    value={draft.destinationName}
                    onChange={(e) => setDraft((prev) => ({ ...prev, destinationName: e.target.value }))}
                    onBlur={() => maybeCommitField("destinationName")}
                    className={inputLineClassName}
                    placeholder="Nome do destino"
                    readOnly={saving || readOnly}
                  />
                </div>
              ) : null}

              <div className="mt-3">
                <Input
                  value={draft.notes}
                  onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
                  onBlur={() => maybeCommitField("notes")}
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
                {exit ? (
                  <div className="space-y-2 text-sm">
                    <div className="text-xs text-muted-foreground">Auditoria (resumo)</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Criado em</span>
                      <span className="font-medium text-foreground">{formatDateOnlyPtBR(exit.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Atualizado em</span>
                      <span className="font-medium text-foreground">{formatDateOnlyPtBR(exit.updatedAt)}</span>
                    </div>
                    {exit.removedBy ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Criado por</span>
                        <span className="font-medium text-foreground">{exit.removedBy}</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">â€”</div>
                )}
              </TabsContent>
              <TabsContent value="notes" className="p-4">
                <div className="text-sm text-muted-foreground">
                  Notas internas estarÃ£o disponÃ­veis na prÃ³xima versÃ£o.
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

