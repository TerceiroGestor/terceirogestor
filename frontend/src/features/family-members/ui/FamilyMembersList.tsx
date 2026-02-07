"use client";

import * as React from "react";
import type { FamilyMember } from "@/features/family-members/domain/types";
import { FamilyMemberForm } from "@/features/family-members/ui/FamilyMemberForm";
import {
  createFamilyMember,
  deleteFamilyMember,
  getFamilyMembersByPersonId,
  getFamilySummaryByPersonId,
  updateFamilyMember,
} from "@/features/family-members/data/family-members-service";
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
import { formatCurrency } from "@/app/(modules)/people/utils";

type FamilyMembersListProps = {
  peopleId: string;
};

export function FamilyMembersList({ peopleId }: FamilyMembersListProps) {
  const [items, setItems] = React.useState<FamilyMember[]>([]);
  const [summary, setSummary] = React.useState({
    householdMembers: 0,
    dependents: 0,
    dependentAgeRange: { min: "" as number | "", max: "" as number | "" },
  });
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FamilyMember | null>(null);

  const loadItems = React.useCallback(async () => {
    const [members, summaryData] = await Promise.all([
      getFamilyMembersByPersonId(peopleId),
      getFamilySummaryByPersonId(peopleId),
    ]);
    setItems(members);
    setSummary(summaryData);
  }, [peopleId]);

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSave = async (data: Omit<FamilyMember, "id">) => {
    if (editing) {
      await updateFamilyMember(peopleId, editing.id, data);
    } else {
      await createFamilyMember(peopleId, data);
    }
    await loadItems();
    setOpen(false);
    setEditing(null);
  };

  const handleEdit = (item: FamilyMember) => {
    setEditing(item);
    setOpen(true);
  };

  const handleRemove = async (item: FamilyMember) => {
    await deleteFamilyMember(peopleId, item.id);
    await loadItems();
  };

  const totalHouseholdIncome = React.useMemo(() => {
    return items
      .filter((member) => member.contributesIncome)
      .reduce((sum, member) => sum + (member.income ?? 0), 0);
  }, [items]);

  const householdSize =
    summary.householdMembers || items.filter((member) => member.livesTogether).length || 1;
  const perCapitaIncome =
    householdSize > 0 ? totalHouseholdIncome / householdSize : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Familia</CardTitle>
            <CardDescription>Composicao familiar.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Adicionar familiar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-md border border-border/40 bg-card/50 px-2.5 py-1.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Moradores
              </p>
              <p className="text-base font-semibold text-foreground">
                {summary.householdMembers}
              </p>
            </div>
            <div className="rounded-md border border-border/40 bg-card/50 px-2.5 py-1.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Dependentes
              </p>
              <p className="text-base font-semibold text-foreground">
                {summary.dependents}
              </p>
            </div>
            <div className="rounded-md border border-border/40 bg-card/50 px-2.5 py-1.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Faixa etaria
              </p>
              <p className="text-base font-semibold text-foreground">
                {summary.dependentAgeRange.min || "-"} -{" "}
                {summary.dependentAgeRange.max || "-"}
              </p>
            </div>
            <div className="rounded-md border border-border/40 bg-card/50 px-2.5 py-1.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Renda total
              </p>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(totalHouseholdIncome)}
              </p>
            </div>
            <div className="rounded-md border border-border/40 bg-card/50 px-2.5 py-1.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Renda per capita
              </p>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(perCapitaIncome)}
              </p>
            </div>
          </div>
          {items.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">Nome</th>
                    <th className="py-2 text-left font-medium">Parentesco</th>
                    <th className="py-2 text-left font-medium">Mora junto</th>
                    <th className="py-2 text-left font-medium">Comp??e renda</th>
                    <th className="py-2 text-left font-medium">Renda</th>
                    <th className="py-2 text-left font-medium">Observacoes</th>
                    <th className="py-2 text-right font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((member) => (
                    <tr key={member.id} className="border-b last:border-0">
                      <td className="py-2">{member.name}</td>
                      <td className="py-2">{member.relationship || "-"}</td>
                      <td className="py-2">{member.livesTogether ? "Sim" : "Nao"}</td>
                      <td className="py-2">{member.contributesIncome ? "Sim" : "Nao"}</td>
                      <td className="py-2">
                        {member.income ? formatCurrency(member.income) : "-"}
                      </td>
                      <td className="py-2">{member.notes || "-"}</td>
                      <td className="py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(member)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemove(member)}
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
              Nenhum familiar cadastrado.
            </p>
          )}
        </CardContent>
      </Card>

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
              {editing ? "Editar familiar" : "Adicionar familiar"}
            </DialogTitle>
            <DialogDescription>Registre informacoes do familiar.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto px-6 pb-6 pt-4">
            <FamilyMemberForm
              initialValues={editing ?? undefined}
              onSubmit={handleSave}
              onCancel={() => setOpen(false)}
              submitLabel={editing ? "Salvar" : "Adicionar"}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

