"use client";

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
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
  createPantrySector,
  deletePantryEntry,
  getPantryEntry,
  listPantryExits,
  listPantryDonors,
  listPantrySectors,
  updatePantryEntry,
  type ApiPantryExit,
  type ApiPantryDonor,
  type ApiPantryEntry,
} from "@/modules/pantry/api";
import { PantryHeaderNav } from "@/modules/pantry/shared/ui/pantry-header-nav";
import {
  PANTRY_DEFAULT_SECTOR,
  PANTRY_DEFAULT_UNIT,
  PANTRY_ENTRY_DONOR_NONE_VALUE,
  PANTRY_EXIT_TYPE_LABELS,
  PANTRY_ITEM_UNIT,
  PANTRY_ROUTES,
} from "@/modules/pantry/shared/domain/pantry.constants";
import { ListView } from "@/web-client/views/ListView";

type EntryDraft = {
  donorId: string | null;
  sector: string;
  quantity: number;
  unit: string;
  entryDate: string;
  expiryDate: string;
  notes: string;
};

type AllocatedExitRow = {
  exitId: string;
  exitDate: string;
  type: ApiPantryExit["type"];
  sector: string;
  quantity: number;
  unit: string;
  eventName: string | null;
  notes: string | null;
};

const inputLineClassName =
  "h-9 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:ring-0";

function resolveRemaining(entry: ApiPantryEntry) {
  if (typeof entry.remaining === "number") return entry.remaining;
  if (typeof entry.allocatedTotal === "number") return entry.quantity - entry.allocatedTotal;
  return entry.quantity;
}

function normalizeStringOrNull(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function draftFromEntry(entry: ApiPantryEntry): EntryDraft {
  return {
    donorId: entry.donorId ?? null,
    sector: entry.sector ?? PANTRY_DEFAULT_SECTOR,
    quantity: Number(entry.quantity ?? 0),
    unit: entry.unit ?? PANTRY_DEFAULT_UNIT,
    entryDate: String(entry.entryDate ?? "").slice(0, 10),
    expiryDate: entry.expiryDate ? String(entry.expiryDate).slice(0, 10) : "",
    notes: entry.notes ?? "",
  };
}

export function PantryEntryDetailClientPage() {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");
  const canUpdate = permissions.includes("pantry.update");

  const id = params?.id ? String(params.id) : "";
  const enabled = Boolean(token && canRead && id);
  const readOnly = !canUpdate;

  const returnTo = searchParams.get("returnTo");
  const donorIdFromQuery = searchParams.get("donorId");
  const searchParamsString = searchParams.toString();

  const [entry, setEntry] = React.useState<ApiPantryEntry | null>(null);
  const [draft, setDraft] = React.useState<EntryDraft>(() => ({
    donorId: null,
    sector: PANTRY_DEFAULT_SECTOR,
    quantity: 1,
    unit: PANTRY_DEFAULT_UNIT,
    entryDate: "",
    expiryDate: "",
    notes: "",
  }));
  const lastSavedRef = React.useRef<EntryDraft>(draft);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [donorsLoading, setDonorsLoading] = React.useState(false);
  const [donors, setDonors] = React.useState<ApiPantryDonor[]>([]);

  const [sectorsLoading, setSectorsLoading] = React.useState(false);
  const [sectors, setSectors] = React.useState<string[]>([]);

  const [allocatedExitsLoading, setAllocatedExitsLoading] = React.useState(false);
  const [allocatedExits, setAllocatedExits] = React.useState<AllocatedExitRow[]>([]);

  const [newSectorOpen, setNewSectorOpen] = React.useState(false);
  const [newSectorName, setNewSectorName] = React.useState("");

  React.useEffect(() => {
    if (!donorIdFromQuery) return;
    setDraft((prev) => ({ ...prev, donorId: donorIdFromQuery }));

    const nextParams = new URLSearchParams(searchParamsString);
    nextParams.delete("donorId");
    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl);
  }, [donorIdFromQuery, pathname, router, searchParamsString]);

  const close = React.useCallback(() => {
    if (returnTo && returnTo.startsWith("/")) {
      router.push(returnTo);
      return;
    }
    if (entry?.itemId) {
      router.push(withTenantPath(`${PANTRY_ROUTES.items}/${entry.itemId}`, tenantSlug));
      return;
    }
    router.push(withTenantPath(PANTRY_ROUTES.stock, tenantSlug));
  }, [entry?.itemId, returnTo, router, tenantSlug]);

  const openExitDetail = React.useCallback(
    (exitId: string) => {
      const href = withTenantPath(`${PANTRY_ROUTES.exits}/${exitId}`, tenantSlug);
      router.push(`${href}?returnTo=${encodeURIComponent(pathname)}`);
    },
    [pathname, router, tenantSlug],
  );

  const openCreateDonor = React.useCallback(() => {
    const href = withTenantPath(PANTRY_ROUTES.donorsNew, tenantSlug);
    const current = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
    router.push(`${href}?returnTo=${encodeURIComponent(current)}`);
  }, [pathname, router, searchParamsString, tenantSlug]);

  const openCreateExit = React.useCallback(() => {
    if (!entry?.itemId) return;
    const href = withTenantPath(PANTRY_ROUTES.exitsNew, tenantSlug);
    const current = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
    router.push(
      `${href}?itemId=${encodeURIComponent(entry.itemId)}&entryId=${encodeURIComponent(entry.id)}&returnTo=${encodeURIComponent(current)}`,
    );
  }, [entry?.id, entry?.itemId, pathname, router, searchParamsString, tenantSlug]);

  const loadEntry = React.useCallback(async () => {
    if (!enabled || !token) return;
    setLoading(true);
    try {
      const loaded = await getPantryEntry(token, id);
      setEntry(loaded);
      const next = draftFromEntry(loaded);
      setDraft(next);
      lastSavedRef.current = next;
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar entrada.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, id, toast, token]);

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
    void loadEntry();
  }, [loadEntry]);

  React.useEffect(() => {
    void loadDonors();
  }, [loadDonors]);

  React.useEffect(() => {
    void loadSectors();
  }, [loadSectors]);

  const loadAllocatedExits = React.useCallback(async () => {
    if (!token || !enabled || !entry?.itemId) return;
    setAllocatedExitsLoading(true);
    try {
      const res = await listPantryExits(token, { itemId: entry.itemId, all: true });
      const rows: AllocatedExitRow[] = [];
      (res.data ?? []).forEach((exitRow) => {
        const allocations = exitRow.allocations ?? [];
        const matchingAllocations = allocations.filter((a) => a.entryId === entry.id);
        const matchesByEntryIds =
          !matchingAllocations.length &&
          Boolean(exitRow.entryIds?.some((eid) => eid === entry.id));

        if (!matchingAllocations.length && !matchesByEntryIds) return;

        const quantity = matchingAllocations.length
          ? matchingAllocations.reduce((sum, a) => sum + Number(a.quantity || 0), 0)
          : Number(exitRow.quantity || 0);

        const sectors = new Set<string>();
        if (matchingAllocations.length) {
          matchingAllocations.forEach((a) => {
            if (a.sector?.trim()) sectors.add(a.sector.trim());
          });
        }
        const sectorLabel = sectors.size ? Array.from(sectors).join(", ") : exitRow.sector || PANTRY_DEFAULT_SECTOR;

        rows.push({
          exitId: exitRow.id,
          exitDate: exitRow.exitDate,
          type: exitRow.type,
          sector: sectorLabel,
          quantity,
          unit: exitRow.unit,
          eventName: exitRow.eventName ?? null,
          notes: exitRow.notes ?? null,
        });
      });

      rows.sort((a, b) => String(b.exitDate ?? "").localeCompare(String(a.exitDate ?? "")));
      setAllocatedExits(rows);
    } catch {
      setAllocatedExits([]);
    } finally {
      setAllocatedExitsLoading(false);
    }
  }, [enabled, entry?.id, entry?.itemId, token]);

  React.useEffect(() => {
    void loadAllocatedExits();
  }, [loadAllocatedExits]);

  const sectorOptions = React.useMemo(() => {
    const set = new Set<string>([PANTRY_DEFAULT_SECTOR, ...sectors]);
    if (draft.sector?.trim()) set.add(draft.sector.trim());
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [draft.sector, sectors]);

  const applyPatch = React.useCallback(
    async (patch: Partial<EntryDraft>) => {
      if (!token || !enabled || !entry) return;
      if (!canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar entradas.",
        });
        return;
      }

      setSaving(true);
      try {
        const updated = await updatePantryEntry(token, entry.id, {
          donorId: patch.donorId ?? undefined,
          sector: patch.sector ?? undefined,
          quantity: typeof patch.quantity === "number" ? patch.quantity : undefined,
          unit: patch.unit ?? undefined,
          entryDate: patch.entryDate?.trim() ? patch.entryDate.trim() : undefined,
          expiryDate:
            patch.expiryDate !== undefined
              ? patch.expiryDate.trim()
                ? patch.expiryDate.trim()
                : null
              : undefined,
          notes:
            patch.notes !== undefined ? normalizeStringOrNull(patch.notes) : undefined,
        });
        setEntry(updated);
        const next = draftFromEntry(updated);
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
    [canUpdate, enabled, entry, toast, token],
  );

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

  const maybeCommitField = (key: keyof EntryDraft) => {
    if (!entry) return;
    const current = draft;
    const last = lastSavedRef.current;
    if (current[key] === last[key]) return;
    void applyPatch({ [key]: current[key] } as Partial<EntryDraft>);
  };

  const canDelete = React.useMemo(() => {
    if (!entry) return false;
    if (typeof entry.allocatedTotal === "number") return entry.allocatedTotal === 0;
    if (typeof entry.remaining === "number") return entry.remaining === entry.quantity;
    return false;
  }, [entry]);

  const handleDelete = React.useCallback(async () => {
    if (!token || !entry) return;
    if (!canDelete) {
      toast({
        variant: "destructive",
        title: "Não é possível excluir",
        description: "Esta entrada já teve saídas registradas.",
      });
      return;
    }

    const ok = await confirm({
      title: "Excluir entrada?",
      description: "Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      confirmVariant: "destructive",
    });
    if (!ok) return;

    setSaving(true);
    try {
      await deletePantryEntry(token, entry.id);
      toast({ variant: "success", title: "Entrada excluída" });
      close();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao excluir entrada.";
      toast({ variant: "destructive", title: "Falha ao excluir", description: message });
    } finally {
      setSaving(false);
    }
  }, [canDelete, close, confirm, entry, toast, token]);

  const headerTitle = entry
    ? `Entrada • ${formatDateOnlyPtBR(entry.entryDate)}`
    : "Entrada";

  const allocatedExitColumns = React.useMemo<ColumnDef<AllocatedExitRow>[]>(
    () => [
      {
        id: "exitDate",
        header: "Data",
        accessorKey: "exitDate",
        cell: ({ row }) => <div className="text-sm">{formatDateOnlyPtBR(row.original.exitDate)}</div>,
      },
      {
        id: "type",
        header: "Tipo",
        accessorKey: "type",
        cell: ({ row }) => (
          <div className="text-sm">{PANTRY_EXIT_TYPE_LABELS[row.original.type]}</div>
        ),
      },
      {
        id: "sector",
        header: "Setor",
        accessorKey: "sector",
        cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.sector}</div>,
      },
      {
        id: "quantity",
        header: "Quantidade",
        accessorFn: (row) => Number(row.quantity),
        cell: ({ row }) => (
          <div className="font-mono text-sm tabular-nums">
            {Number(row.original.quantity).toLocaleString("pt-BR")}{" "}
            <span className="text-muted-foreground">{row.original.unit}</span>
          </div>
        ),
      },
      {
        id: "eventName",
        header: "Evento",
        accessorKey: "eventName",
        cell: ({ row }) => <div className="truncate text-sm">{row.original.eventName ?? "—"}</div>,
      },
      {
        id: "notes",
        header: "Notas",
        accessorKey: "notes",
        cell: ({ row }) => <div className="truncate text-sm text-muted-foreground">{row.original.notes ?? "—"}</div>,
      },
    ],
    [],
  );

  const headerInfoSlot = React.useMemo(() => {
    if (!entry) return null;
    const remaining = resolveRemaining(entry);
    return (
      <div className="rounded-md border border-border/60 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Quantidade</div>
            <div className="font-mono font-medium text-foreground tabular-nums">
              {Number(entry.quantity).toLocaleString("pt-BR")} {entry.unit}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Restante</div>
            <div className="font-mono font-medium text-foreground tabular-nums">
              {Number(remaining).toLocaleString("pt-BR")} {entry.unit}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Setor</div>
            <div className="font-medium text-foreground">
              {entry.sector || PANTRY_DEFAULT_SECTOR}
            </div>
          </div>
        </div>
      </div>
    );
  }, [entry]);

  return (
    <>
      <DetailShell
        breadcrumbTitle="Entrada"
        breadcrumbItems={[
          { label: "Despensa", href: PANTRY_ROUTES.stock },
          ...(entry?.itemId && entry?.item?.name
            ? [{ label: entry.item.name, href: `${PANTRY_ROUTES.items}/${entry.itemId}` }]
            : []),
        ]}
        actionSlot={<PantryHeaderNav />}
        mode="edit"
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={readOnly}
        onClose={close}
        headerActionsSlot={
          entry && canUpdate ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || !canDelete}
              title={
                canDelete
                  ? "Excluir entrada"
                  : "Esta entrada já teve saídas registradas"
              }
            >
              <Trash2 className="mr-1 size-4" />
              Excluir
            </Button>
          ) : null
        }
        headerInfoSlot={headerInfoSlot}
        mainSlot={
          !entry ? (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              Nenhuma entrada encontrada.
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

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr] md:items-end">
                <Select
                  value={draft.donorId ?? PANTRY_ENTRY_DONOR_NONE_VALUE}
                  onValueChange={(value) => {
                    const next = value === PANTRY_ENTRY_DONOR_NONE_VALUE ? null : value;
                    setDraft((prev) => ({ ...prev, donorId: next }));
                    void applyPatch({ donorId: next });
                  }}
                  disabled={saving || readOnly}
                >
                  <SelectTrigger className={inputLineClassName}>
                    <SelectValue placeholder={donorsLoading ? "Carregando..." : "Doador"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PANTRY_ENTRY_DONOR_NONE_VALUE}>Sem doador</SelectItem>
                    {donors.map((donor) => (
                      <SelectItem key={donor.id} value={donor.id}>
                        {donor.name}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 w-full"
                        onClick={openCreateDonor}
                        disabled={saving || readOnly}
                      >
                        <Plus className="mr-1 size-4" />
                        Novo doador
                      </Button>
                    </div>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={draft.entryDate}
                  onChange={(e) => setDraft((prev) => ({ ...prev, entryDate: e.target.value }))}
                  onBlur={() => maybeCommitField("entryDate")}
                  className={inputLineClassName}
                  readOnly={saving || readOnly}
                  title="Data da entrada"
                />

                <Input
                  type="date"
                  value={draft.expiryDate}
                  onChange={(e) => setDraft((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  onBlur={() => maybeCommitField("expiryDate")}
                  className={inputLineClassName}
                  readOnly={saving || readOnly}
                  title="Validade (opcional)"
                />
              </div>

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
        bottomSlot={
          entry ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-foreground">Saídas alocadas</div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={openCreateExit}
                    disabled={saving || !canCreate}
                    title="Registrar saída vinculada a esta entrada"
                    aria-label="Adicionar saída"
                  >
                    <Plus className="size-4" />
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    {allocatedExits.length ? `${allocatedExits.length} registro(s)` : "—"}
                  </div>
                </div>
              </div>

              {allocatedExitsLoading ? (
                <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                  Carregando...
                </div>
              ) : allocatedExits.length ? (
                <ListView<AllocatedExitRow>
                  data={allocatedExits}
                  columns={allocatedExitColumns}
                  groupByFields={[]}
                  getRowId={(row) => row.exitId}
                  onRowClick={(row) => openExitDetail(row.exitId)}
                />
              ) : (
                <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                  Nenhuma saída alocada para esta entrada.
                </div>
              )}
            </div>
          ) : null
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
                {entry ? (
                  <div className="space-y-2 text-sm">
                    <div className="text-xs text-muted-foreground">Auditoria (resumo)</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Criado em</span>
                      <span className="font-medium text-foreground">{formatDateOnlyPtBR(entry.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Atualizado em</span>
                      <span className="font-medium text-foreground">{formatDateOnlyPtBR(entry.updatedAt)}</span>
                    </div>
                    {entry.createdBy ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Criado por</span>
                        <span className="font-medium text-foreground">{entry.createdBy}</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">—</div>
                )}
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
