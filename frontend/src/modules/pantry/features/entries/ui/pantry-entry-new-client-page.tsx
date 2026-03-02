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
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import {
  createPantryEntry,
  createPantrySector,
  listPantryDonors,
  listPantrySectors,
  type ApiPantryDonor,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import { PantryHeaderNav } from "@/modules/pantry/shared/ui/pantry-header-nav";
import {
  PANTRY_DEFAULT_SECTOR,
  PANTRY_DEFAULT_UNIT,
  PANTRY_ENTRY_DONOR_NONE_VALUE,
  PANTRY_ITEM_UNIT,
  PANTRY_ROUTES,
} from "@/modules/pantry/shared/domain/pantry.constants";

type EntryDraft = {
  itemId: string;
  donorId: string | null;
  sector: string;
  quantity: number;
  unit: string;
  entryDate: string;
  expiryDate: string;
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

export function PantryEntryNewClientPage() {
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
  const returnTo = searchParams.get("returnTo");
  const donorIdFromQuery = searchParams.get("donorId");
  const searchParamsString = searchParams.toString();

  const enabled = Boolean(token && canRead && itemId);
  const readOnly = !canCreate;

  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [item, setItem] = React.useState<ApiPantryItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [donorsLoading, setDonorsLoading] = React.useState(false);
  const [donors, setDonors] = React.useState<ApiPantryDonor[]>([]);

  const [sectorsLoading, setSectorsLoading] = React.useState(false);
  const [sectors, setSectors] = React.useState<string[]>([]);

  const [newSectorOpen, setNewSectorOpen] = React.useState(false);
  const [newSectorName, setNewSectorName] = React.useState("");

  const [draft, setDraft] = React.useState<EntryDraft>(() => ({
    itemId,
    donorId: null,
    sector: PANTRY_DEFAULT_SECTOR,
    quantity: 1,
    unit: PANTRY_DEFAULT_UNIT,
    entryDate: todayIsoDate(),
    expiryDate: "",
    notes: "",
  }));

  React.useEffect(() => {
    setDraft((prev) => ({ ...prev, itemId }));
  }, [itemId]);

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
    router.push(withTenantPath(PANTRY_ROUTES.stock, tenantSlug));
  }, [returnTo, router, tenantSlug]);

  const openCreateDonor = React.useCallback(() => {
    const href = withTenantPath(PANTRY_ROUTES.donorsNew, tenantSlug);
    const current = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
    router.push(`${href}?returnTo=${encodeURIComponent(current)}`);
  }, [pathname, router, searchParamsString, tenantSlug]);

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
    void loadItem();
  }, [loadItem]);

  React.useEffect(() => {
    void loadDonors();
  }, [loadDonors]);

  React.useEffect(() => {
    void loadSectors();
  }, [loadSectors]);

  const sectorOptions = React.useMemo(() => {
    const set = new Set<string>([PANTRY_DEFAULT_SECTOR, ...sectors]);
    if (draft.sector?.trim()) set.add(draft.sector.trim());
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [draft.sector, sectors]);

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
        description: "Você não tem permissão para registrar entradas.",
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
      await createPantryEntry(token, {
        itemId,
        donorId: draft.donorId ?? null,
        sector,
        quantity,
        unit,
        entryDate: draft.entryDate.trim() ? draft.entryDate.trim() : undefined,
        expiryDate: draft.expiryDate.trim() ? draft.expiryDate.trim() : null,
        notes: draft.notes.trim() ? draft.notes.trim() : null,
      });
      toast({ variant: "success", title: "Entrada registrada" });
      close();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao registrar entrada.";
      toast({ variant: "destructive", title: "Falha", description: message });
    } finally {
      setSaving(false);
    }
  }, [canCreate, close, draft, enabled, itemId, toast, token]);

  const headerTitle = item?.name ? `Nova entrada de ${item.name}` : "Nova entrada";

  return (
    <>
      <DetailShell
        breadcrumbTitle="Nova entrada"
        breadcrumbItems={[
          { label: "Despensa", href: PANTRY_ROUTES.stock },
          ...(item?.name ? [{ label: item.name, href: `${PANTRY_ROUTES.items}/${itemId}` }] : []),
        ]}
        actionSlot={<PantryHeaderNav />}
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
              Informe um item para registrar entrada.
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
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      donorId: value === PANTRY_ENTRY_DONOR_NONE_VALUE ? null : value,
                    }))
                  }
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
                  className={inputLineClassName}
                  readOnly={saving || readOnly}
                  title="Data da entrada"
                />

                <Input
                  type="date"
                  value={draft.expiryDate}
                  onChange={(e) => setDraft((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className={inputLineClassName}
                  readOnly={saving || readOnly}
                  title="Validade (opcional)"
                />
              </div>

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
