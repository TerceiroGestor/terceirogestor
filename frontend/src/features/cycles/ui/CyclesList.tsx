"use client";

import * as React from "react";
import type { Cycle } from "@/features/cycles/domain/types";
import { CycleForm } from "@/features/cycles/ui/CycleForm";
import {
  createCycle,
  deleteCycle,
  getCyclesByPersonId,
  updateCycle,
} from "@/features/cycles/data/cycles-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CyclesListProps = {
  peopleId: string;
};

export function CyclesList({ peopleId }: CyclesListProps) {
  const [items, setItems] = React.useState<Cycle[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Cycle | null>(null);

  const loadItems = React.useCallback(async () => {
    const data = await getCyclesByPersonId(peopleId);
    setItems(data);
  }, [peopleId]);

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSave = async (data: Omit<Cycle, "id">) => {
    if (editing) {
      await updateCycle(peopleId, editing.id, data);
    } else {
      await createCycle(peopleId, data);
    }
    await loadItems();
    setOpen(false);
    setEditing(null);
  };

  const handleEdit = (item: Cycle) => {
    setEditing(item);
    setOpen(true);
  };

  const handleRemove = async (item: Cycle) => {
    await deleteCycle(peopleId, item.id);
    await loadItems();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Ciclos</CardTitle>
          <CardDescription>Historico de ciclos e ciclo atual.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Adicionar ao ciclo
        </Button>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Ciclo</th>
                  <th className="py-2 text-left font-medium">Status</th>
                  <th className="py-2 text-left font-medium">Inicio</th>
                  <th className="py-2 text-left font-medium">Fim</th>
                  <th className="py-2 text-right font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((cycle) => (
                  <tr key={cycle.id} className="border-b last:border-0">
                    <td className="py-2">{cycle.title}</td>
                    <td className="py-2">
                      <Badge
                        variant={cycle.status === "Atual" ? "default" : "secondary"}
                        className="text-[11px]"
                      >
                        {cycle.status}
                      </Badge>
                    </td>
                    <td className="py-2">{cycle.startDate}</td>
                    <td className="py-2">{cycle.endDate || "Atual"}</td>
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(cycle)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemove(cycle)}
                        >
                          Remover
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhum ciclo registrado.
          </p>
        )}
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
      >
        <DialogContent className="w-[94vw] max-w-3xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>
              {editing ? "Editar ciclo" : "Adicionar ao ciclo"}
            </DialogTitle>
            <DialogDescription>
              Atualize o ciclo atual ou registre um novo.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto px-6 pb-6 pt-4">
            <CycleForm
              initialValues={editing ?? undefined}
              onSubmit={handleSave}
              onCancel={() => setOpen(false)}
              submitLabel={editing ? "Salvar" : "Adicionar"}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
