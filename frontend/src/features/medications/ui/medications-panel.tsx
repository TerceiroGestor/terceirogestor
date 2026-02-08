"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MedicationForm } from "@/features/medications/ui/medication-form";
import type { MedicationFormValues } from "@/features/medications/config/medication-form-config";
import { useMedications } from "@/features/medications/data/use-medications";
import type { Medication } from "@/app/(modules)/people/types";
import { formatDate, toDateInputValue } from "@/app/(modules)/people/utils";
import { resolveMediaUrl } from "@/lib/api";

const buildFormValues = (medication?: Medication): MedicationFormValues => ({
  reason: medication?.reason ?? "",
  medication: medication?.medication ?? "",
  dosage: medication?.dosage ?? "",
  schedule: medication?.schedule ?? "",
  startDate: toDateInputValue(medication?.startDate ?? null),
  endDate: toDateInputValue(medication?.endDate ?? null),
  prescribingDoctor: medication?.prescribingDoctor ?? "",
  permissionDocumentUrl: medication?.permissionDocumentUrl ?? "",
  documentUrl: medication?.documentUrl ?? "",
  notes: medication?.notes ?? "",
});

type MedicationsPanelProps = {
  personId: string;
};

export function MedicationsPanel({ personId }: MedicationsPanelProps) {
  const { medications, isLoading, error, create, update, remove } =
    useMedications(personId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);

  const initialValues = useMemo(() => buildFormValues(editing ?? undefined), [
    editing,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setEditing(null);
    }
  };

  const handleSubmit = async (values: MedicationFormValues) => {
    if (!values.medication.trim()) return;
    const payload = {
      reason: values.reason?.trim() || null,
      medication: values.medication.trim(),
      dosage: values.dosage?.trim() || null,
      schedule: values.schedule?.trim() || null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      prescribingDoctor: values.prescribingDoctor?.trim() || null,
      permissionDocumentUrl: values.permissionDocumentUrl?.trim() || null,
      documentUrl: values.documentUrl?.trim() || null,
      notes: values.notes?.trim() || null,
    };
    if (editing) {
      await update(editing.id, payload);
    } else {
      await create(payload);
    }
    setOpen(false);
  };

  return (
    <SectionCard
      title="Medicacoes"
      subtitle="Registro de medicamentos e cuidados"
      actions={
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
              <Plus className="size-3.5" />
              Novo medicamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar medicacao" : "Adicionar medicacao"}
              </DialogTitle>
              <DialogDescription>
                Registre tratamentos e orientacoes medicas.
              </DialogDescription>
            </DialogHeader>
            <MedicationForm
              initialValues={initialValues}
              submitLabel={editing ? "Atualizar" : "Salvar"}
              onSubmit={handleSubmit}
              onCancel={() => handleOpenChange(false)}
            />
          </DialogContent>
        </Dialog>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {medications.length ? (
        <SectionList>
          {medications.map((medication) => (
            <SectionListItem
              key={medication.id}
              title={<span>{medication.medication}</span>}
              subtitle={
                medication.reason
                  ? `Motivo: ${medication.reason}`
                  : undefined
              }
              meta={
                <>
                  {medication.dosage ? (
                    <Badge variant="outline">{medication.dosage}</Badge>
                  ) : null}
                  {medication.schedule ? (
                    <Badge variant="outline">{medication.schedule}</Badge>
                  ) : null}
                  {medication.startDate ? (
                    <Badge variant="secondary">
                      Inicio: {formatDate(medication.startDate)}
                    </Badge>
                  ) : null}
                  {medication.endDate ? (
                    <Badge variant="secondary">
                      Fim: {formatDate(medication.endDate)}
                    </Badge>
                  ) : null}
                  {medication.documentUrl ? (
                    <Badge variant="secondary" className="gap-1">
                      <FileText className="size-3" />
                      <a
                        href={resolveMediaUrl(medication.documentUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px]"
                      >
                        Documento
                      </a>
                    </Badge>
                  ) : null}
                </>
              }
              actions={
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(medication);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(medication.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              }
            />
          ))}
        </SectionList>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhuma medicacao cadastrada.
        </p>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}
    </SectionCard>
  );
}
