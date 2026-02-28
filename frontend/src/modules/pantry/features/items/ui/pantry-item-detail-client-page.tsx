"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import {
  createPantryEntry,
  createPantryExit,
  createPantrySector,
  listPantryDonors,
  listPantryEntries,
  listPantryExits,
  listPantryHistory,
  listPantryItemAuditLogs,
  listPantryItemSuggestions,
  listPantrySectors,
  type ApiPantryAuditLog,
  type ApiPantryDonor,
  type ApiPantryEntry,
  type ApiPantryExit,
  type ApiPantryHistoryMovement,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import { PantryDonorCreateDialog } from "@/modules/pantry/features/donors/ui/pantry-donor-create-dialog";
import type {
  EntryDraft,
  ExitDraft,
  ItemDraft,
  PantryItemDetailMode,
} from "@/modules/pantry/features/items/domain/pantry-item-detail.types";
import {
  localIsoDate,
  normalizeSector,
  normalizeStringOrNull,
} from "@/modules/pantry/features/items/domain/pantry-item-detail.helpers";
import { PantryItemActivityNotesPanel } from "@/modules/pantry/features/items/ui/detail/pantry-item-activity-notes-panel";
import { PantryItemDetailForm } from "@/modules/pantry/features/items/ui/detail/pantry-item-detail-form";
import { PantryItemMovementsTabs } from "@/modules/pantry/features/items/ui/detail/pantry-item-movements-tabs";
import {
  PANTRY_DEFAULT_SECTOR,
  PANTRY_DEFAULT_UNIT,
  PANTRY_ROUTES,
} from "@/modules/pantry/shared/domain/pantry.constants";
import { PantryHeaderNav } from "@/modules/pantry/shared/ui/pantry-header-nav";

const inputLineClassName =
  "h-9 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:ring-0";

function normalizeDraft(draft: ItemDraft): ItemDraft {
  return {
    name: draft.name.trim(),
    group: draft.group?.trim() ? draft.group.trim() : null,
    defaultSector: normalizeSector(draft.defaultSector),
    unit: draft.unit.trim(),
    minStock: Number.isFinite(draft.minStock) ? draft.minStock : 0,
    notes: normalizeStringOrNull(draft.notes),
  };
}

function draftFromItem(item: ApiPantryItem): ItemDraft {
  return {
    name: item.name ?? "",
    group: item.group ?? null,
    defaultSector: item.defaultSector ?? PANTRY_DEFAULT_SECTOR,
    unit: item.unit ?? PANTRY_DEFAULT_UNIT,
    minStock: Number(item.minStock ?? 0),
    notes: item.notes ?? null,
  };
}

export function PantryItemDetailClientPage({ mode }: { mode: PantryItemDetailMode }) {
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
    defaultSector: PANTRY_DEFAULT_SECTOR,
    unit: PANTRY_DEFAULT_UNIT,
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
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

  const [unitSuggestions, setUnitSuggestions] = React.useState<string[]>([]);
  const [groupSuggestions, setGroupSuggestions] = React.useState<string[]>([]);

  const [movementsLoading, setMovementsLoading] = React.useState(false);
  const [entryRows, setEntryRows] = React.useState<ApiPantryEntry[]>([]);
  const [exitRows, setExitRows] = React.useState<ApiPantryExit[]>([]);
  const [historyRows, setHistoryRows] = React.useState<ApiPantryHistoryMovement[]>([]);

  const [donorsLoading, setDonorsLoading] = React.useState(false);
  const [donors, setDonors] = React.useState<ApiPantryDonor[]>([]);
  const [newDonorOpen, setNewDonorOpen] = React.useState(false);

  const [entryDraft, setEntryDraft] = React.useState<EntryDraft>(() => ({
    donorId: null,
    quantity: 1,
    unit: PANTRY_DEFAULT_UNIT,
    sector: PANTRY_DEFAULT_SECTOR,
    entryDate: localIsoDate(),
    expiryDate: "",
    notes: "",
  }));
  const [exitDraft, setExitDraft] = React.useState<ExitDraft>(() => ({
    entryId: "",
    quantity: 1,
    unit: PANTRY_DEFAULT_UNIT,
    sector: PANTRY_DEFAULT_SECTOR,
    exitDate: localIsoDate(),
    type: "ATTENDED",
    eventName: "",
    notes: "",
  }));

  const backToList = React.useCallback(() => {
    router.push(withTenantPath(PANTRY_ROUTES.stock, tenantSlug));
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
      setEntryDraft((prev) => ({
        ...prev,
        unit: nextDraft.unit || prev.unit,
        sector: nextDraft.defaultSector || prev.sector,
      }));
      setExitDraft((prev) => ({
        ...prev,
        unit: nextDraft.unit || prev.unit,
        sector: nextDraft.defaultSector || prev.sector,
      }));
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

  const loadDonors = React.useCallback(async () => {
    if (!token || !enabled) return;
    setDonorsLoading(true);
    try {
      const limit = 200;
      let page = 1;
      const all: ApiPantryDonor[] = [];

      for (;;) {
        const res = await listPantryDonors(token, { page, limit });
        all.push(...(res.data ?? []));
        if (page >= (res.pagination?.pages ?? 1)) break;
        page += 1;
      }

      all.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      setDonors(all);
    } catch {
      setDonors([]);
    } finally {
      setDonorsLoading(false);
    }
  }, [enabled, token]);

  const loadAudit = React.useCallback(async () => {
    if (!token || !enabled || mode !== "edit") return;
    setAuditLoading(true);
    try {
      const response = await listPantryItemAuditLogs(token, id, { limit: 120 });
      setAuditLogs(response.data);
      setAuditVisibleCount(24);
    } catch {
      setAuditLogs([]);
      setAuditVisibleCount(24);
    } finally {
      setAuditLoading(false);
    }
  }, [enabled, id, mode, token]);

  const loadMovements = React.useCallback(async () => {
    if (!token || !enabled || mode !== "edit" || !id) return;
    setMovementsLoading(true);
    try {
      const [entriesResponse, exitsResponse, historyResponse] = await Promise.all([
        listPantryEntries(token, { itemId: id, all: true }),
        listPantryExits(token, { itemId: id, all: true }),
        listPantryHistory(token, { itemId: id, all: true, kind: "ALL" }),
      ]);

      setEntryRows(entriesResponse.data ?? []);
      setExitRows(exitsResponse.data ?? []);
      setHistoryRows(historyResponse.data ?? []);
    } catch {
      setEntryRows([]);
      setExitRows([]);
      setHistoryRows([]);
    } finally {
      setMovementsLoading(false);
    }
  }, [enabled, id, mode, token]);

  const loadSuggestions = React.useCallback(async () => {
    if (!token || !enabled) return;
    try {
      const response = await listPantryItemSuggestions(token);
      setUnitSuggestions(Array.isArray(response.units) ? response.units : []);
      setGroupSuggestions(Array.isArray(response.groups) ? response.groups : []);
    } catch {
      setUnitSuggestions([]);
      setGroupSuggestions([]);
    }
  }, [enabled, token]);

  React.useEffect(() => {
    void loadItem();
  }, [loadItem]);

  React.useEffect(() => {
    void loadSectors();
  }, [loadSectors]);

  React.useEffect(() => {
    void loadDonors();
  }, [loadDonors]);

  React.useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  React.useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  React.useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

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
      router.replace(withTenantPath(`${PANTRY_ROUTES.items}/${created.id}`, tenantSlug));
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

  const headerTitle = mode === "create" ? "Novo alimento" : item?.name ? item.name : "Alimento";
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
    const set = new Set<string>([PANTRY_DEFAULT_SECTOR, ...sectors]);
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

  const submitEntry = React.useCallback(async () => {
    if (!token || !enabled || mode !== "edit" || !id) return;
    if (!canCreate) {
      toast({
        variant: "destructive",
        title: "Sem permissão",
        description: "Você não tem permissão para registrar entradas.",
      });
      return;
    }

    const quantity = Number(entryDraft.quantity);
    const unit = entryDraft.unit.trim();
    const sector = normalizeSector(entryDraft.sector);
    if (!Number.isFinite(quantity) || quantity <= 0 || !unit) {
      toast({
        variant: "destructive",
        title: "Dados inválidos",
        description: "Informe quantidade e unidade.",
      });
      return;
    }

    setSaving(true);
    try {
      await createPantryEntry(token, {
        itemId: id,
        donorId: entryDraft.donorId ?? null,
        sector,
        quantity,
        unit,
        entryDate: entryDraft.entryDate.trim() ? entryDraft.entryDate.trim() : undefined,
        expiryDate: entryDraft.expiryDate.trim() ? entryDraft.expiryDate.trim() : null,
        notes: entryDraft.notes.trim() ? entryDraft.notes.trim() : null,
      });
      toast({ variant: "success", title: "Entrada registrada" });
      setEntryDraft((prev) => ({
        ...prev,
        quantity: 1,
        entryDate: localIsoDate(),
        expiryDate: "",
        notes: "",
      }));
      await Promise.all([loadMovements(), loadItem()]);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao registrar entrada.";
      toast({ variant: "destructive", title: "Falha", description: message });
    } finally {
      setSaving(false);
    }
  }, [canCreate, enabled, entryDraft, id, loadItem, loadMovements, mode, toast, token]);

  const submitExit = React.useCallback(async () => {
    if (!token || !enabled || mode !== "edit" || !id) return;
    if (!canCreate) {
      toast({
        variant: "destructive",
        title: "Sem permissão",
        description: "Você não tem permissão para registrar saídas.",
      });
      return;
    }

    const quantity = Number(exitDraft.quantity);
    const unit = exitDraft.unit.trim();
    const sector = normalizeSector(exitDraft.sector);
    if (!Number.isFinite(quantity) || quantity <= 0 || !unit) {
      toast({
        variant: "destructive",
        title: "Dados inválidos",
        description: "Informe quantidade e unidade.",
      });
      return;
    }

    setSaving(true);
    try {
      await createPantryExit(token, {
        itemId: id,
        entryId: exitDraft.entryId.trim() ? exitDraft.entryId.trim() : undefined,
        sector,
        quantity,
        unit,
        exitDate: exitDraft.exitDate.trim() ? exitDraft.exitDate.trim() : undefined,
        type: exitDraft.type,
        eventName: exitDraft.eventName.trim() ? exitDraft.eventName.trim() : null,
        notes: exitDraft.notes.trim() ? exitDraft.notes.trim() : null,
      });
      toast({ variant: "success", title: "Saída registrada" });
      setExitDraft((prev) => ({
        ...prev,
        entryId: "",
        quantity: 1,
        exitDate: localIsoDate(),
        eventName: "",
        notes: "",
      }));
      await Promise.all([loadMovements(), loadItem()]);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao registrar saída.";
      toast({ variant: "destructive", title: "Falha", description: message });
    } finally {
      setSaving(false);
    }
  }, [canCreate, enabled, exitDraft, id, loadItem, loadMovements, mode, toast, token]);

  const exitEntryOptions = React.useMemo(() => {
    return entryRows
      .filter((row) => !row.isClosed)
      .sort((a, b) => {
        const aKey = String(a.expiryDate ?? a.entryDate ?? "");
        const bKey = String(b.expiryDate ?? b.entryDate ?? "");
        return aKey.localeCompare(bKey);
      });
  }, [entryRows]);

  const selectedExitEntry = React.useMemo(() => {
    if (!exitDraft.entryId) return null;
    return exitEntryOptions.find((row) => row.id === exitDraft.entryId) ?? null;
  }, [exitDraft.entryId, exitEntryOptions]);

  const exitEntryTriggerLabel = React.useMemo(() => {
    if (!selectedExitEntry) return "Automático (por validade/FEFO)";
    const remaining =
      typeof selectedExitEntry.remaining === "number"
        ? selectedExitEntry.remaining
        : selectedExitEntry.quantity;
    const expiry = selectedExitEntry.expiryDate
      ? formatDateOnlyPtBR(selectedExitEntry.expiryDate)
      : "—";
    const sector = normalizeSector(selectedExitEntry.sector);
    return `Validade ${expiry} • ${sector} • ${Number(remaining).toLocaleString("pt-BR")} ${selectedExitEntry.unit}`;
  }, [selectedExitEntry]);

  return (
    <>
      <PageBreadcrumb
        title={headerTitle}
        items={[{ label: "Despensa", href: PANTRY_ROUTES.stock }]}
        actionSlot={<PantryHeaderNav />}
      />

      <div className="w-full px-4 py-4">
        <div className="w-full">
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
            <PantryItemDetailForm
              mode={mode}
              readOnly={readOnly}
              draft={draft}
              setDraft={setDraft}
              onCommitField={maybeCommitField}
              item={item}
              sectorsLoading={sectorsLoading}
              sectorOptions={sectorOptions}
              onDefaultSectorChange={(value) => {
                if (mode !== "create") void applyPatch({ defaultSector: value });
              }}
              onOpenNewSector={() => setNewSectorOpen(true)}
              inputLineClassName={inputLineClassName}
              unitSuggestions={unitSuggestions}
              groupSuggestions={groupSuggestions}
              movements={
                <PantryItemMovementsTabs
                  mode={mode}
                  saving={saving}
                  readOnly={readOnly}
                  movementsLoading={movementsLoading}
                  entryRows={entryRows}
                  exitRows={exitRows}
                  historyRows={historyRows}
                  entryDraft={entryDraft}
                  setEntryDraft={setEntryDraft}
                  exitDraft={exitDraft}
                  setExitDraft={setExitDraft}
                  sectorOptions={sectorOptions}
                  sectorsLoading={sectorsLoading}
                  donors={donors}
                  donorsLoading={donorsLoading}
                  onOpenNewDonor={() => setNewDonorOpen(true)}
                  submitEntry={submitEntry}
                  submitExit={submitExit}
                  exitEntryOptions={exitEntryOptions}
                  exitEntryTriggerLabel={exitEntryTriggerLabel}
                  inputLineClassName={inputLineClassName}
                />
              }
            />

            <PantryItemActivityNotesPanel
              mode={mode}
              readOnly={readOnly}
              auditLoading={auditLoading}
              auditLogs={auditLogs}
              auditVisibleCount={auditVisibleCount}
              onAuditVisibleCountChange={setAuditVisibleCount}
              notes={draft.notes}
              onNotesChange={(next) => setDraft((prev) => ({ ...prev, notes: next }))}
              onNotesBlur={() => maybeCommitField("notes")}
            />
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

      <PantryDonorCreateDialog
        open={newDonorOpen}
        onOpenChange={setNewDonorOpen}
        onCreated={(created) => {
          void loadDonors();
          setEntryDraft((prev) => ({ ...prev, donorId: created.id }));
        }}
      />
    </>
  );
}

export function PantryItemNewClientPage() {
  return <PantryItemDetailClientPage mode="create" />;
}

export function PantryItemEditClientPage() {
  return <PantryItemDetailClientPage mode="edit" />;
}
