"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
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
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  createPantrySector,
  type ApiPantryDonor,
  listPantryEntries,
  listPantryExits,
  listPantryHistory,
  listPantrySectors,
  type ApiPantryEntry,
  type ApiPantryExit,
  type ApiPantryHistoryMovement,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import { type PantryItemDetailLayoutContext } from "@/modules/pantry/config/pantry-detail-layout-contract";
import { pantryItemDetailModuleDefinition } from "@/modules/pantry/config/pantry-module-contract";
import type {
  ItemDraft,
  PantryItemDetailMode,
} from "@/modules/pantry/features/items/domain/pantry-item-detail.types";
import {
  buildPantryEntryAuditLabel,
  buildPantryExitAuditLabel,
  normalizeSector,
  normalizeStringOrNull,
} from "@/modules/pantry/features/items/domain/pantry-item-detail.helpers";
import {
  PANTRY_DEFAULT_SECTOR,
  PANTRY_DEFAULT_UNIT,
  PANTRY_ROUTES,
} from "@/modules/pantry/shared/domain/pantry.constants";
import { PantryHeaderNav } from "@/modules/pantry/shared/ui/pantry-header-nav";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

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

export function PantryItemDetailEngineClientPage({
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

  const canRead = hasModulePermission(
    pantryItemDetailModuleDefinition,
    "canRead",
    permissions,
  );
  const canCreate = canUseModuleAction(
    pantryItemDetailModuleDefinition,
    "create",
    permissions,
  );
  const canUpdate = canUseModuleAction(
    pantryItemDetailModuleDefinition,
    "edit",
    permissions,
  );

  const id = mode === "edit" ? (params?.id ? String(params.id) : "") : "";
  const canAccessPage = mode === "create" ? canCreate : canRead;
  const enabled = Boolean(token && canAccessPage && (mode === "create" || id));

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
  const [loading, setLoading] = React.useState(mode === "edit");
  const [busy, setBusy] = React.useState(false);
  const [sectorsLoading, setSectorsLoading] = React.useState(false);
  const [sectors, setSectors] = React.useState<string[]>([]);
  const [newSectorOpen, setNewSectorOpen] = React.useState(false);
  const [newSectorName, setNewSectorName] = React.useState("");
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
  const [movementsLoading, setMovementsLoading] = React.useState(false);
  const [entryRows, setEntryRows] = React.useState<ApiPantryEntry[]>([]);
  const [exitRows, setExitRows] = React.useState<ApiPantryExit[]>([]);
  const [donors, setDonors] = React.useState<ApiPantryDonor[]>([]);
  const [historyRows, setHistoryRows] = React.useState<ApiPantryHistoryMovement[]>(
    [],
  );

  const persistItemDraft = React.useCallback(
    async (nextDraft: ItemDraft) => {
      const normalizedDraft = normalizeDraft(nextDraft);
      const updated = await dataProvider.update<ApiPantryItem>(
        pantryItemDetailModuleDefinition.queryAdapters.detailDataProvider?.model ??
          "pantry.items",
        id,
        normalizedDraft,
      );
      const savedDraft = draftFromItem(updated);
      setItem(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [dataProvider, id],
  );

  const autoSave = useDetailAutoSaveController<ItemDraft>({
    draft,
    enabled: mode === "edit" && canUpdate,
    config: getModuleDetailEditingConfig(pantryItemDetailModuleDefinition),
    normalizeDraft,
    onSave: persistItemDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar.";

      toast({
        variant: "destructive",
        title: "Falha ao salvar",
        description: message,
      });
    },
  });
  const {
    saving: autoSaving,
    replaceSavedDraft,
    commitField,
  } = autoSave;
  const saving = busy || autoSaving;

  React.useEffect(() => {
    setAuditVisibleCount(24);
  }, [id, mode]);

  const backToList = React.useCallback(() => {
    router.push(withTenantPath(PANTRY_ROUTES.stock, tenantSlug));
  }, [router, tenantSlug]);

  const loadItem = React.useCallback(async () => {
    if (!enabled || mode !== "edit") return;
    setLoading(true);

    try {
      const loaded = await dataProvider.read<ApiPantryItem>(
        pantryItemDetailModuleDefinition.queryAdapters.detailDataProvider?.model ??
          "pantry.items",
        id,
      );
      const nextDraft = draftFromItem(loaded);
      setItem(loaded);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
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
  }, [dataProvider, enabled, id, mode, replaceSavedDraft, toast]);

  const loadSectors = React.useCallback(async () => {
    if (!token || !enabled) return;
    setSectorsLoading(true);

    try {
      const response = await listPantrySectors(token);
      const list = response.data.map((sector) => sector.name).filter(Boolean);
      setSectors(list.sort((left, right) => left.localeCompare(right)));
    } catch {
      setSectors([]);
    } finally {
      setSectorsLoading(false);
    }
  }, [enabled, token]);

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

  const loadDonors = React.useCallback(async () => {
    if (!enabled || mode !== "edit") {
      setDonors([]);
      return;
    }

    try {
      const response = await dataProvider.search<ApiPantryDonor>("pantry.donors", {
        all: true,
      });
      setDonors(response.data ?? []);
    } catch {
      setDonors([]);
    }
  }, [dataProvider, enabled, mode]);

  React.useEffect(() => {
    void loadItem();
  }, [loadItem]);

  React.useEffect(() => {
    void loadSectors();
  }, [loadSectors]);

  React.useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

  React.useEffect(() => {
    void loadDonors();
  }, [loadDonors]);

  const createItem = React.useCallback(async () => {
    if (!enabled) return;

    if (!canCreate) {
      toast({
        variant: "destructive",
        title: "Sem permissao",
        description: "Voce nao tem permissao para criar alimentos.",
      });
      return;
    }

    const normalized = normalizeDraft(draft);
    if (!normalized.name || !normalized.unit || !normalized.defaultSector) {
      toast({
        variant: "destructive",
        title: "Dados invalidos",
        description: "Preencha nome, setor e unidade.",
      });
      return;
    }

    setBusy(true);
    try {
      const created = await dataProvider.create<ApiPantryItem>(
        pantryItemDetailModuleDefinition.queryAdapters.detailDataProvider?.model ??
          "pantry.items",
        normalized,
      );

      toast({ variant: "success", title: "Alimento criado" });
      router.replace(withTenantPath(`${PANTRY_ROUTES.items}/${created.id}`, tenantSlug));
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar alimento.";

      toast({
        variant: "destructive",
        title: "Falha ao criar",
        description: message,
      });
    } finally {
      setBusy(false);
    }
  }, [canCreate, dataProvider, draft, enabled, router, tenantSlug, toast]);

  const readOnly = mode === "edit" ? !canUpdate : !canCreate;

  const sectorOptions = React.useMemo(() => {
    const currentSector = normalizeDraft(draft).defaultSector;
    const options = new Set<string>([PANTRY_DEFAULT_SECTOR, ...sectors]);
    if (currentSector) options.add(currentSector);

    return Array.from(options)
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));
  }, [draft, sectors]);

  const createSector = React.useCallback(async () => {
    if (!token) return;
    const name = newSectorName.trim();
    if (!name) return;

    setBusy(true);
    try {
      await createPantrySector(token, { name });
      setNewSectorOpen(false);
      setNewSectorName("");
      await loadSectors();
      setDraft((previous) => ({ ...previous, defaultSector: name }));

      if (mode !== "create") {
        void commitField("defaultSector", name);
      }
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar setor.";

      toast({
        variant: "destructive",
        title: "Falha ao criar",
        description: message,
      });
    } finally {
      setBusy(false);
    }
  }, [commitField, loadSectors, mode, newSectorName, toast, token]);

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

  const donorNameById = React.useMemo<Record<string, string>>(() => {
    const next: Record<string, string> = {};

    donors.forEach((donor) => {
      if (donor.id && donor.name) {
        next[donor.id] = donor.name;
      }
    });

    entryRows.forEach((entry) => {
      if (entry.donor?.id && entry.donor.name) {
        next[entry.donor.id] = entry.donor.name;
      }
    });

    return next;
  }, [donors, entryRows]);

  const entryLabelById = React.useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        entryRows.map((entry) => [entry.id, buildPantryEntryAuditLabel(entry)]),
      ),
    [entryRows],
  );

  const exitLabelById = React.useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        exitRows.map((exit) => [exit.id, buildPantryExitAuditLabel(exit)]),
      ),
    [exitRows],
  );

  const headerTitle =
    mode === "create" ? "Novo alimento" : item?.name ? item.name : "Alimento";

  const context = React.useMemo<PantryItemDetailLayoutContext>(
    () => ({
      mode,
      readOnly,
      draft,
      setDraft,
      item,
      onCommitField: (key) => {
        void commitField(key);
      },
      onUnitChange: (value) => {
        void commitField("unit", value);
      },
      onGroupChange: (value) => {
        void commitField("group", value);
      },
      sectorsLoading,
      sectorOptions,
      onDefaultSectorChange: (value) => {
        void commitField("defaultSector", value);
      },
      onOpenNewSector: () => setNewSectorOpen(true),
      entryRows,
      exitRows,
      donorNameById,
      entryLabelById,
      exitLabelById,
      historyRows,
      movementLoading: movementsLoading,
      onNewEntry: openNewEntry,
      onNewExit: openNewExit,
      onOpenEntry: openEntryDetail,
      onOpenExit: openExitDetail,
      auditVisibleCount,
      onAuditVisibleCountChange: setAuditVisibleCount,
      onNotesChange: (next) =>
        setDraft((previous) => ({ ...previous, notes: next })),
      onNotesBlur: () => {
        void commitField("notes");
      },
    }),
    [
      auditVisibleCount,
      commitField,
      donorNameById,
      draft,
      entryLabelById,
      entryRows,
      exitLabelById,
      exitRows,
      historyRows,
      item,
      mode,
      movementsLoading,
      openEntryDetail,
      openExitDetail,
      openNewEntry,
      openNewExit,
      readOnly,
      sectorOptions,
      sectorsLoading,
      setDraft,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissao.</div>;
  }

  return (
    <>
      <DetailShellEngine<PantryItemDetailLayoutContext>
        moduleDefinition={pantryItemDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        mode={mode}
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={readOnly}
        onSave={mode === "create" ? createItem : undefined}
        onClose={backToList}
        breadcrumbTitle={headerTitle}
        breadcrumbItems={[
          { label: "Despensa", href: PANTRY_ROUTES.stock },
          ...(mode === "edit" ? [{ label: headerTitle }] : []),
        ]}
        actionSlot={<PantryHeaderNav />}
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
              onChange={(event) => setNewSectorName(event.target.value)}
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

export function PantryItemNewEngineClientPage() {
  return <PantryItemDetailEngineClientPage mode="create" />;
}

export function PantryItemEditEngineClientPage() {
  return <PantryItemDetailEngineClientPage mode="edit" />;
}
