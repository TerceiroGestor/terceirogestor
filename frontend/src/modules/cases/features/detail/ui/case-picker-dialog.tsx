"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { createCase, listCases, type ApiCase } from "@/modules/cases/api";

type CasePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (caseItem: ApiCase) => void | Promise<void>;
};

export function CasePickerDialog({ open, onOpenChange, onPick }: CasePickerDialogProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = React.useState<ApiCase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchText, setSearchText] = React.useState("");
  const [pickingId, setPickingId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");

  const load = React.useCallback(async () => {
    if (!token || !open) return;
    setLoading(true);
    try {
      const response = await listCases(token, { all: true });
      setRows(response.data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, open]);

  React.useEffect(() => {
    if (!open) return;
    setSearchText("");
    setShowCreateForm(false);
    setNewTitle("");
    void load();
  }, [open, load]);

  const filteredRows = React.useMemo(() => {
    const search = searchText.trim().toLocaleLowerCase();
    if (!search) return rows;
    return rows.filter((row) => row.title.toLocaleLowerCase().includes(search));
  }, [rows, searchText]);

  const handlePick = React.useCallback(
    async (caseItem: ApiCase) => {
      setPickingId(caseItem.id);
      try {
        await onPick(caseItem);
        onOpenChange(false);
      } finally {
        setPickingId(null);
      }
    },
    [onOpenChange, onPick],
  );

  const handleCreate = React.useCallback(async () => {
    if (!token) return;
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      const created = await createCase(token, { title });
      toast({ variant: "success", title: "Caso criado" });
      await handlePick(created);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar caso.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setCreating(false);
    }
  }, [handlePick, newTitle, toast, token]);

  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Vincular a um caso"
      description="Escolha um caso existente ou cadastre um novo."
      contentClassName="max-w-[600px]"
    >
      <div className="flex max-h-[72vh] flex-col gap-4 overflow-hidden">
        {!showCreateForm ? (
          <>
            <div className="flex items-center gap-2">
              <Input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Pesquisar caso"
                className="h-9"
              />
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4" />
                Novo caso
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-auto">
              {loading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}
              {!loading && !filteredRows.length ? (
                <p className="text-xs text-muted-foreground">Nenhum caso encontrado.</p>
              ) : null}
              {filteredRows.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 border-b border-border/50 px-1 py-2">
                  <p className="text-sm font-medium text-foreground">{row.title}</p>
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
              <label className="text-xs font-medium text-muted-foreground">Título do caso</label>
              <Input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Ex.: Situação de vulnerabilidade da família Silva"
                disabled={creating}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)} disabled={creating}>
                Voltar
              </Button>
              <Button type="button" onClick={() => void handleCreate()} disabled={creating || !newTitle.trim()}>
                {creating ? "Criando..." : "Criar e selecionar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </SectionDialog>
  );
}
