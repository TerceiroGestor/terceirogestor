"use client";

import * as React from "react";
import { Landmark, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useAuth } from "@/features/auth/auth-context";
import {
  createProjectFundingSource,
  deleteProjectFundingSource,
  listProjectFundingSources,
  type ApiProjectFundingSource,
  type FundingSourceType,
} from "@/modules/projects/api";

const FUNDING_SOURCE_LABELS: Record<FundingSourceType, string> = {
  MUNICIPAL: "Municipal",
  ESTADUAL: "Estadual",
  FEDERAL: "Federal",
  TERCEIRO: "Terceiro",
};

const FUNDING_SOURCE_OPTIONS = Object.entries(FUNDING_SOURCE_LABELS).map(
  ([value, label]) => ({ value: value as FundingSourceType, label }),
);

type ProjectFundingSourcesSectionProps = {
  projectId: string;
  readOnly?: boolean;
};

export function ProjectFundingSourcesSection({
  projectId,
  readOnly = false,
}: ProjectFundingSourcesSectionProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [rows, setRows] = React.useState<ApiProjectFundingSource[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [source, setSource] = React.useState<FundingSourceType>("MUNICIPAL");
  const [name, setName] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await listProjectFundingSources(token, projectId);
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await createProjectFundingSource(token, projectId, {
        source,
        name: name.trim() || null,
        notes: notes.trim() || null,
      });
      toast({ title: "Fonte de financiamento adicionada" });
      setDialogOpen(false);
      setSource("MUNICIPAL");
      setName("");
      setNotes("");
      await load();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Nao foi possivel adicionar a fonte de financiamento.";
      toast({ title: "Falha ao adicionar", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: ApiProjectFundingSource) => {
    if (!token) return;
    const confirmed = await confirm({
      title: "Remover fonte de financiamento",
      description: `Remover "${row.name ?? FUNDING_SOURCE_LABELS[row.source]}"? Essa acao nao pode ser desfeita.`,
      confirmLabel: "Remover",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteProjectFundingSource(token, projectId, row.id);
      toast({ title: "Fonte de financiamento removida" });
      await load();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Nao foi possivel remover.";
      toast({ title: "Falha ao remover", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Fontes de financiamento deste projeto. Um projeto pode ter
          financiamento misto (municipal, estadual, federal e/ou de
          terceiros) ao mesmo tempo.
        </p>
        {!readOnly ? (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova fonte
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma fonte de financiamento cadastrada.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-md border border-border/60">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3 p-3">
              <div className="flex items-start gap-2">
                <Landmark className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{FUNDING_SOURCE_LABELS[row.source]}</Badge>
                    {row.name ? <p className="text-sm font-medium">{row.name}</p> : null}
                  </div>
                  {row.notes ? (
                    <p className="text-sm text-muted-foreground">{row.notes}</p>
                  ) : null}
                </div>
              </div>
              {!readOnly ? (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => void handleDelete(row)}
                  aria-label="Remover fonte de financiamento"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova fonte de financiamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fonte</label>
              <Select
                value={source}
                onValueChange={(next) => setSource(next as FundingSourceType)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nome do convenio/edital (opcional)
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Convenio SMADS 2026"
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Observacoes (opcional)
              </label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreate()} disabled={saving}>
              {saving ? "Salvando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
