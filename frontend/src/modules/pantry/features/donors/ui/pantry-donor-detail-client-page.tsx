"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import { ListView } from "@/web-client/views/ListView";
import { listPantryEntries, type ApiPantryDonor, type ApiPantryEntry } from "@/modules/pantry/api";
import { DetailShell } from "@/components/layout/DetailShell";
import { PantryHeaderNav } from "@/modules/pantry/shared/ui/pantry-header-nav";
import {
  PANTRY_DONOR_TYPE_LABELS,
  PANTRY_ROUTES,
} from "@/modules/pantry/shared/domain/pantry.constants";

type Mode = "create" | "edit";

type DonorDraft = {
  name: string;
  type: ApiPantryDonor["type"];
  contact: string | null;
};

const inputLineClassName =
  "h-9 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:ring-0";

function normalizeStringOrNull(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function normalizeDraft(draft: DonorDraft): DonorDraft {
  return {
    name: draft.name.trim(),
    type: draft.type,
    contact: normalizeStringOrNull(draft.contact),
  };
}

function draftFromDonor(donor: ApiPantryDonor): DonorDraft {
  return {
    name: donor.name ?? "",
    type: donor.type ?? "PERSON",
    contact: donor.contact ?? null,
  };
}

function buildReturnUrl(returnTo: string, donorId: string) {
  try {
    const url = new URL(returnTo, window.location.origin);
    url.searchParams.set("donorId", donorId);
    return `${url.pathname}${url.search ? url.search : ""}${url.hash ? url.hash : ""}`;
  } catch {
    return null;
  }
}

export function PantryDonorDetailClientPage({ mode }: { mode: Mode }) {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");
  const canUpdate = permissions.includes("pantry.update");

  const id = mode === "edit" ? (params?.id ? String(params.id) : "") : "";
  const enabled = Boolean(token && canRead && (mode === "create" || id));

  const returnTo = searchParams.get("returnTo");

  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [donor, setDonor] = React.useState<ApiPantryDonor | null>(null);
  const [draft, setDraft] = React.useState<DonorDraft>(() => ({
    name: "",
    type: "PERSON",
    contact: null,
  }));
  const lastSavedRef = React.useRef<DonorDraft>(draft);

  const [loading, setLoading] = React.useState(mode === "edit");
  const [saving, setSaving] = React.useState(false);

  const [entriesLoading, setEntriesLoading] = React.useState(false);
  const [entries, setEntries] = React.useState<ApiPantryEntry[]>([]);

  const readOnly = mode === "edit" ? !canUpdate : !canCreate;

  const close = React.useCallback(() => {
    if (returnTo && returnTo.startsWith("/")) {
      router.push(returnTo);
      return;
    }
    router.push(withTenantPath(PANTRY_ROUTES.donors, tenantSlug));
  }, [returnTo, router, tenantSlug]);

  const loadDonor = React.useCallback(async () => {
    if (!enabled || mode !== "edit") return;
    setLoading(true);
    try {
      const loaded = await dataProvider.read<ApiPantryDonor>("pantry.donors", id);
      setDonor(loaded);
      const next = draftFromDonor(loaded);
      setDraft(next);
      lastSavedRef.current = next;
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar doador.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setDonor(null);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, enabled, id, mode, toast]);

  const loadEntries = React.useCallback(async () => {
    if (!token || !enabled || mode !== "edit" || !id) return;
    setEntriesLoading(true);
    try {
      const res = await listPantryEntries(token, { donorId: id, limit: 200 });
      const next = res.data ?? [];
      next.sort((a, b) =>
        String(b.entryDate ?? "").localeCompare(String(a.entryDate ?? "")),
      );
      setEntries(next);
    } catch {
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }, [enabled, id, mode, token]);

  React.useEffect(() => {
    void loadDonor();
  }, [loadDonor]);

  React.useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const applyPatch = React.useCallback(
    async (patch: Partial<DonorDraft>) => {
      if (!enabled || mode !== "edit") return;
      if (!canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar doadores.",
        });
        return;
      }

      setSaving(true);
      try {
        const updated = await dataProvider.update<ApiPantryDonor>("pantry.donors", id, patch);
        setDonor(updated);
        const next = draftFromDonor(updated);
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
    [canUpdate, dataProvider, enabled, id, mode, toast],
  );

  const maybeCommitField = (key: keyof DonorDraft) => {
    if (mode === "create") return;
    const current = normalizeDraft(draft);
    const last = lastSavedRef.current;
    if (current[key] === last[key]) return;
    void applyPatch({ [key]: current[key] } as Partial<DonorDraft>);
  };

  const createDonor = React.useCallback(async () => {
    if (!enabled) return;
    if (!canCreate) {
      toast({
        variant: "destructive",
        title: "Sem permissão",
        description: "Você não tem permissão para criar doadores.",
      });
      return;
    }

    const normalized = normalizeDraft(draft);
    if (!normalized.name) {
      toast({ variant: "destructive", title: "Dados inválidos", description: "Informe o nome." });
      return;
    }

    setSaving(true);
    try {
      const created = await dataProvider.create<ApiPantryDonor>("pantry.donors", {
        name: normalized.name,
        type: normalized.type,
        contact: normalized.contact,
      });
      toast({ variant: "success", title: "Doador criado" });

      if (returnTo && returnTo.startsWith("/")) {
        const next = buildReturnUrl(returnTo, created.id);
        if (next) {
          router.push(next);
          return;
        }
      }

      router.replace(withTenantPath(`${PANTRY_ROUTES.donors}/${created.id}`, tenantSlug));
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao criar doador.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setSaving(false);
    }
  }, [canCreate, dataProvider, draft, enabled, returnTo, router, tenantSlug, toast]);

  const headerTitle =
    mode === "create" ? "Novo doador" : donor?.name ? donor.name : "Doador";

  const donationCount = entries.length;
  const lastDonation = entries[0]?.entryDate ? formatDateOnlyPtBR(entries[0].entryDate) : null;

  const headerInfoSlot = React.useMemo(() => {
    if (mode !== "edit" && mode !== "create") return null;

    return (
      <div className="rounded-md border border-border/60 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Tipo</div>
            <div className="font-medium text-foreground">
              {PANTRY_DONOR_TYPE_LABELS[draft.type]}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Doações</div>
            <div className="font-mono font-medium tabular-nums text-foreground">
              {donationCount.toLocaleString("pt-BR")}
            </div>
            {lastDonation ? (
              <div className="text-muted-foreground">• Última {lastDonation}</div>
            ) : null}
          </div>

          {mode === "edit" && donor?.updatedAt ? (
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">Atualizado</div>
              <div className="font-medium text-foreground">
                {formatDateOnlyPtBR(donor.updatedAt)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }, [donationCount, donor?.updatedAt, draft.type, lastDonation, mode]);

  const openEntryDetail = React.useCallback(
    (entryId: string) => {
      const href = withTenantPath(`${PANTRY_ROUTES.entries}/${entryId}`, tenantSlug);
      router.push(`${href}?returnTo=${encodeURIComponent(pathname)}`);
    },
    [pathname, router, tenantSlug],
  );

  const donationColumns = React.useMemo<ColumnDef<ApiPantryEntry>[]>(
    () => [
      {
        id: "item",
        header: "Alimento",
        accessorFn: (row) => row.item?.name ?? "",
        cell: ({ row }) => (
          <div className="min-w-0 truncate font-medium text-foreground">
            {row.original.item?.name ?? "Alimento"}
          </div>
        ),
      },
      {
        id: "sector",
        header: "Setor",
        accessorKey: "sector",
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.sector}
          </div>
        ),
      },
      {
        id: "quantity",
        header: "Quantidade",
        accessorKey: "quantity",
        cell: ({ row }) => (
          <div className="font-mono tabular-nums text-foreground">
            {Number(row.original.quantity).toLocaleString("pt-BR")}
          </div>
        ),
      },
      {
        id: "unit",
        header: "Un.",
        accessorKey: "unit",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">{row.original.unit}</div>
        ),
      },
      {
        id: "entryDate",
        header: "Data",
        accessorKey: "entryDate",
        cell: ({ row }) => formatDateOnlyPtBR(row.original.entryDate),
      },
      {
        id: "expiryDate",
        header: "Validade",
        accessorKey: "expiryDate",
        cell: ({ row }) =>
          row.original.expiryDate ? formatDateOnlyPtBR(row.original.expiryDate) : "—",
      },
      {
        id: "notes",
        header: "Notas",
        accessorKey: "notes",
        cell: ({ row }) => (
          <div className="max-w-[340px] truncate text-xs text-muted-foreground">
            {row.original.notes ?? ""}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <DetailShell
      breadcrumbTitle={headerTitle}
      breadcrumbItems={[
        { label: "Despensa", href: PANTRY_ROUTES.stock },
        { label: "Doadores", href: PANTRY_ROUTES.donors },
        ...(mode === "edit" ? [{ label: headerTitle }] : []),
      ]}
      actionSlot={<PantryHeaderNav />}
      mode={mode}
      headerTitle={headerTitle}
      saving={saving}
      loading={loading}
      readOnly={readOnly}
      onSave={mode === "create" ? createDonor : undefined}
      onClose={close}
      headerInfoSlot={headerInfoSlot}
      mainSlot={
        <div className="rounded-md border border-border/60 bg-background px-3 py-2">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">Nome</div>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => maybeCommitField("name")}
                placeholder="Ex: Mercado Central"
                className={inputLineClassName}
                readOnly={readOnly}
              />
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">Tipo</div>
              <Select
                value={draft.type}
                onValueChange={(value) => {
                  setDraft((prev) => ({ ...prev, type: value as ApiPantryDonor["type"] }));
                  if (mode !== "create") void applyPatch({ type: value as ApiPantryDonor["type"] });
                }}
                disabled={readOnly}
              >
                <SelectTrigger className={inputLineClassName}>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSON">{PANTRY_DONOR_TYPE_LABELS.PERSON}</SelectItem>
                  <SelectItem value="COMPANY">{PANTRY_DONOR_TYPE_LABELS.COMPANY}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 lg:col-span-2">
              <div className="text-[11px] font-medium text-muted-foreground">Contato</div>
              <Input
                value={draft.contact ?? ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, contact: e.target.value || null }))}
                onBlur={() => maybeCommitField("contact")}
                placeholder="Telefone, e-mail..."
                className={inputLineClassName}
                readOnly={readOnly}
              />
            </div>
          </div>

          {readOnly ? (
            <div className="mt-3 rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
              {mode === "create"
                ? "Você não tem permissão para criar."
                : "Você não tem permissão para editar."}
            </div>
          ) : null}
        </div>
      }
      bottomSlot={
        <div className="rounded-md border border-border/60 bg-background">
          <Tabs defaultValue="donations">
            <TabsList className="h-9 w-full justify-start gap-4 rounded-none border-0 border-b border-border/60 bg-transparent px-3">
              <TabsTrigger
                value="donations"
                className="rounded-none border-b-2 border-transparent bg-transparent px-0 text-xs text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground"
              >
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="donations" className="p-3">
              {mode !== "edit" ? (
                <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                  Salve o doador para ver as doações.
                </div>
              ) : entriesLoading ? (
                <div className="text-sm text-muted-foreground">Carregando...</div>
              ) : entries.length ? (
                <ListView<ApiPantryEntry>
                  data={entries}
                  columns={donationColumns}
                  groupByFields={[]}
                  getRowId={(row) => row.id}
                  onRowClick={(row) => openEntryDetail(row.id)}
                />
              ) : (
                <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                  Sem doações.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
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
              {mode === "edit" && donor ? (
                <div className="space-y-2 text-sm">
                  <div className="text-xs text-muted-foreground">Auditoria (resumo)</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Criado em</span>
                    <span className="font-medium text-foreground">{formatDateOnlyPtBR(donor.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Atualizado em</span>
                    <span className="font-medium text-foreground">{formatDateOnlyPtBR(donor.updatedAt)}</span>
                  </div>
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
  );
}

export function PantryDonorNewClientPage() {
  return <PantryDonorDetailClientPage mode="create" />;
}

export function PantryDonorEditClientPage() {
  return <PantryDonorDetailClientPage mode="edit" />;
}
