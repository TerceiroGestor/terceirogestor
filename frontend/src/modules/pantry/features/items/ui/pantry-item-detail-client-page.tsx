"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
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
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import {
  createPantrySector,
  listPantryEntries,
  listPantryExits,
  listPantryHistory,
  listPantryItemAuditLogs,
  listPantrySectors,
  type ApiPantryAuditLog,
  type ApiPantryEntry,
  type ApiPantryExit,
  type ApiPantryHistoryMovement,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import type {
  ItemDraft,
  PantryItemDetailMode,
} from "@/modules/pantry/features/items/domain/pantry-item-detail.types";
import {
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
import { DetailShell } from "@/components/layout/DetailShell";
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

export function PantryItemDetailClientPage({
  mode,
}: {
  mode: PantryItemDetailMode;
}) {
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

  const dataProvider = React.useMemo(
    () => createRestDataProvider({ token }),
    [token],
  );

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

  const [movementsLoading, setMovementsLoading] = React.useState(false);
  const [entryRows, setEntryRows] = React.useState<ApiPantryEntry[]>([]);
  const [exitRows, setExitRows] = React.useState<ApiPantryExit[]>([]);
  const [historyRows, setHistoryRows] = React.useState<
    ApiPantryHistoryMovement[]
  >([]);

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
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar alimento.";
      toast({
        variant: "destructive",
        title: "Falha ao carregar",
        description: message,
      });
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
      const [entriesResponse, exitsResponse, historyResponse] =
        await Promise.all([
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

  React.useEffect(() => {
    void loadItem();
  }, [loadItem]);

  React.useEffect(() => {
    void loadSectors();
  }, [loadSectors]);

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
        const updated = await dataProvider.update<ApiPantryItem>(
          "pantry.items",
          id,
          patch,
        );
        setItem(updated);
        const nextDraft = draftFromItem(updated);
        setDraft(nextDraft);
        lastSavedRef.current = nextDraft;
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar.";
        toast({
          variant: "destructive",
          title: "Falha ao salvar",
          description: message,
        });
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
      const created = await dataProvider.create<ApiPantryItem>(
        "pantry.items",
        normalized,
      );
      toast({ variant: "success", title: "Alimento criado" });
      router.replace(
        withTenantPath(`${PANTRY_ROUTES.items}/${created.id}`, tenantSlug),
      );
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao criar alimento.";
      toast({
        variant: "destructive",
        title: "Falha ao criar",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }, [canCreate, dataProvider, draft, enabled, router, tenantSlug, toast]);

  const headerTitle =
    mode === "create" ? "Novo alimento" : item?.name ? item.name : "Alimento";
  const readOnly = mode === "edit" ? !canUpdate : !canCreate;

  const headerInfoSlot = React.useMemo(() => {
    if (mode !== "edit" || !item) return null;

    return (
      <div className="rounded-md border border-border/60 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Saldo</div>
            <div className="font-mono font-medium tabular-nums text-foreground">
              {Number(item.stock).toLocaleString("pt-BR")}
            </div>
            {item.isBelowMin ? (
              <Badge variant="destructive" className="h-5 px-2 text-[10px]">
                Abaixo do mínimo
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                OK
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Próx. validade</div>
            <div className="font-medium text-foreground">
              {item.nextExpiryDate ? formatDateOnlyPtBR(item.nextExpiryDate) : "—"}
            </div>
            {item.daysToExpire !== null ? (
              <div className="font-mono tabular-nums text-muted-foreground">
                {item.daysToExpire}d
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Último movimento</div>
            <div className="font-medium text-foreground">
              {item.lastMovementDate ? formatDateOnlyPtBR(item.lastMovementDate) : "—"}
            </div>
          </div>
        </div>
      </div>
    );
  }, [item, mode]);

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
    return Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
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
      toast({
        variant: "destructive",
        title: "Falha ao criar",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }, [applyPatch, loadSectors, mode, newSectorName, toast, token]);

  const openNewEntry = React.useCallback(() => {
    const href = withTenantPath(PANTRY_ROUTES.entriesNew, tenantSlug);
    router.push(
      `${href}?itemId=${encodeURIComponent(id)}&returnTo=${encodeURIComponent(pathname)}`,
    );
  }, [id, pathname, router, tenantSlug]);

  const openNewExit = React.useCallback(() => {
    const href = withTenantPath(PANTRY_ROUTES.exitsNew, tenantSlug);
    router.push(
      `${href}?itemId=${encodeURIComponent(id)}&returnTo=${encodeURIComponent(pathname)}`,
    );
  }, [id, pathname, router, tenantSlug]);

  const openEntryDetail = React.useCallback(
    (entryId: string) => {
      const href = withTenantPath(`${PANTRY_ROUTES.entries}/${entryId}`, tenantSlug);
      router.push(`${href}?returnTo=${encodeURIComponent(pathname)}`);
    },
    [pathname, router, tenantSlug],
  );

  const openExitDetail = React.useCallback(
    (exitId: string) => {
      const href = withTenantPath(`${PANTRY_ROUTES.exits}/${exitId}`, tenantSlug);
      router.push(`${href}?returnTo=${encodeURIComponent(pathname)}`);
    },
    [pathname, router, tenantSlug],
  );

  return (
    <>
      <DetailShell
        breadcrumbTitle={headerTitle}
        breadcrumbItems={[
          { label: "Despensa", href: PANTRY_ROUTES.stock },
          ...(mode === "edit" ? [{ label: headerTitle }] : []),
        ]}
        actionSlot={<PantryHeaderNav />}
        mode={mode}
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={readOnly}
        onSave={mode === "create" ? createItem : undefined}
        onClose={backToList}
        headerInfoSlot={headerInfoSlot}
        mainSlot={
          <PantryItemDetailForm
            mode={mode}
            readOnly={readOnly}
            draft={draft}
            setDraft={setDraft}
            onCommitField={maybeCommitField}
            onUnitChange={(value) => {
              if (mode !== "create") void applyPatch({ unit: value });
            }}
            onGroupChange={(value) => {
              if (mode !== "create") void applyPatch({ group: value });
            }}
            sectorsLoading={sectorsLoading}
            sectorOptions={sectorOptions}
            onDefaultSectorChange={(value) => {
              if (mode !== "create") void applyPatch({ defaultSector: value });
            }}
            onOpenNewSector={() => setNewSectorOpen(true)}
            inputLineClassName={inputLineClassName}
          />
        }
        bottomSlot={
          <PantryItemMovementsTabs
            mode={mode}
            readOnly={readOnly}
            movementsLoading={movementsLoading}
            entryRows={entryRows}
            exitRows={exitRows}
            historyRows={historyRows}
            onNewEntry={openNewEntry}
            onNewExit={openNewExit}
            onOpenEntry={openEntryDetail}
            onOpenExit={openExitDetail}
          />
        }
        sideSlot={
          <PantryItemActivityNotesPanel
            mode={mode}
            readOnly={readOnly}
            auditLoading={auditLoading}
            auditLogs={auditLogs}
            auditVisibleCount={auditVisibleCount}
            onAuditVisibleCountChange={setAuditVisibleCount}
            notes={draft.notes}
            onNotesChange={(next) =>
              setDraft((prev) => ({ ...prev, notes: next }))
            }
            onNotesBlur={() => maybeCommitField("notes")}
          />
        }
      />

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
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewSectorOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={createSector}
              disabled={!newSectorName.trim() || saving}
            >
              {saving ? "Salvando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}

export function PantryItemNewClientPage() {
  return <PantryItemDetailClientPage mode="create" />;
}

export function PantryItemEditClientPage() {
  return <PantryItemDetailClientPage mode="edit" />;
}
