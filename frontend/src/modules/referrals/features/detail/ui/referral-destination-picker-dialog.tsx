"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import {
  createReferralDestination,
  listReferralDestinations,
  type ApiReferralDestination,
} from "@/modules/referrals/api";

type ReferralDestinationPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (destination: ApiReferralDestination) => void | Promise<void>;
};

type NewDestinationDraft = {
  name: string;
  contactInfo: string;
  responsibleName: string;
  address: string;
};

const EMPTY_DRAFT: NewDestinationDraft = {
  name: "",
  contactInfo: "",
  responsibleName: "",
  address: "",
};

export function ReferralDestinationPickerDialog({
  open,
  onOpenChange,
  onPick,
}: ReferralDestinationPickerDialogProps) {
  const { token } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = React.useState<ApiReferralDestination[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchText, setSearchText] = React.useState("");
  const [pickingId, setPickingId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [draft, setDraft] = React.useState<NewDestinationDraft>(EMPTY_DRAFT);

  const load = React.useCallback(async () => {
    if (!token || !open) return;
    setLoading(true);
    try {
      const response = await listReferralDestinations(token, { all: true });
      setRows(response.data);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao carregar redes de destino.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, open, toast]);

  React.useEffect(() => {
    if (!open) return;
    setSearchText("");
    setShowCreateForm(false);
    setDraft(EMPTY_DRAFT);
    void load();
  }, [open, load]);

  const filteredRows = React.useMemo(() => {
    const search = searchText.trim().toLocaleLowerCase();
    if (!search) return rows;
    return rows.filter((row) => row.name.toLocaleLowerCase().includes(search));
  }, [rows, searchText]);

  const handlePick = React.useCallback(
    async (destination: ApiReferralDestination) => {
      setPickingId(destination.id);
      try {
        await onPick(destination);
        onOpenChange(false);
      } finally {
        setPickingId(null);
      }
    },
    [onOpenChange, onPick],
  );

  const handleCreate = React.useCallback(async () => {
    if (!token) return;
    const name = draft.name.trim();
    if (!name) return;

    setCreating(true);
    try {
      const created = await createReferralDestination(token, {
        name,
        contactInfo: draft.contactInfo.trim() || null,
        responsibleName: draft.responsibleName.trim() || null,
        address: draft.address.trim() || null,
      });
      toast({ variant: "success", title: "Rede de destino criada" });
      await handlePick(created);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar rede de destino.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setCreating(false);
    }
  }, [draft, handlePick, toast, token]);

  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Selecionar rede de destino"
      description="Escolha a rede/instituição para onde este encaminhamento vai, ou cadastre uma nova."
      contentClassName="max-w-[640px]"
    >
      <div className="flex max-h-[72vh] flex-col gap-4 overflow-hidden">
        {!showCreateForm ? (
          <>
            <div className="flex items-center gap-2">
              <Input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Pesquisar rede de destino"
                className="h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-4 w-4" />
                Nova rede
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-auto">
              {loading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}
              {!loading && !filteredRows.length ? (
                <p className="text-xs text-muted-foreground">Nenhuma rede de destino encontrada.</p>
              ) : null}
              {filteredRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 border-b border-border/50 px-1 py-2"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{row.name}</p>
                    {row.responsibleName ? (
                      <p className="text-xs text-muted-foreground">{row.responsibleName}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pickingId === row.id}
                    onClick={() => void handlePick(row)}
                  >
                    Selecionar
                  </Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              <Input
                value={draft.name}
                onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))}
                placeholder="Ex.: CRAS Vila Nova"
                disabled={creating}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Responsável (opcional)</label>
              <Input
                value={draft.responsibleName}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, responsibleName: event.target.value }))
                }
                disabled={creating}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Contatos (opcional)</label>
              <Input
                value={draft.contactInfo}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, contactInfo: event.target.value }))
                }
                placeholder="Telefone, e-mail..."
                disabled={creating}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Endereço (opcional)</label>
              <Textarea
                value={draft.address}
                onChange={(event) => setDraft((previous) => ({ ...previous, address: event.target.value }))}
                disabled={creating}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                Voltar
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating || !draft.name.trim()}
              >
                {creating ? "Criando..." : "Criar e selecionar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </SectionDialog>
  );
}
