"use client";

import * as React from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useAuth } from "@/features/auth/auth-context";
import {
  createProjectGoal,
  deleteProjectGoal,
  listProjectGoals,
  type ApiGoal,
} from "@/modules/projects/api";

type ProjectGoalsSectionProps = {
  projectId: string;
  readOnly?: boolean;
};

export function ProjectGoalsSection({
  projectId,
  readOnly = false,
}: ProjectGoalsSectionProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [goals, setGoals] = React.useState<ApiGoal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const rows = await listProjectGoals(token, projectId);
      setGoals(rows);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!token) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast({ title: "Informe o titulo da meta", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createProjectGoal(token, projectId, {
        title: trimmedTitle,
        description: description.trim() || null,
      });
      toast({ title: "Meta criada" });
      setDialogOpen(false);
      setTitle("");
      setDescription("");
      await load();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Nao foi possivel criar a meta.";
      toast({ title: "Falha ao criar meta", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (goal: ApiGoal) => {
    if (!token) return;
    const confirmed = await confirm({
      title: "Excluir meta",
      description: `Remover a meta "${goal.title}"? Essa acao nao pode ser desfeita.`,
      confirmLabel: "Excluir",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteProjectGoal(token, projectId, goal.id);
      toast({ title: "Meta removida" });
      await load();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Nao foi possivel remover a meta.";
      toast({ title: "Falha ao remover", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Metas do Plano de Trabalho deste projeto. Atividades podem ser
          vinculadas a uma meta para rastrear o cumprimento.
        </p>
        {!readOnly ? (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova meta
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-md border border-border/60">
          {goals.map((goal) => (
            <li key={goal.id} className="flex items-start justify-between gap-3 p-3">
              <div className="flex items-start gap-2">
                <Target className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{goal.title}</p>
                  {goal.description ? (
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  ) : null}
                </div>
              </div>
              {!readOnly ? (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => void handleDelete(goal)}
                  aria-label="Excluir meta"
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
            <DialogTitle>Nova meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Titulo</label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Aumentar a frequencia media do Coral"
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Descricao (opcional)
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
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
