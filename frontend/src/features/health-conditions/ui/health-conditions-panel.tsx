"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HealthConditionForm } from "@/features/health-conditions/ui/health-condition-form";
import type { HealthConditionFormValues } from "@/features/health-conditions/config/health-condition-form-config";
import { useHealthConditions } from "@/features/health-conditions/data/use-health-conditions";
import type { HealthCondition } from "@/app/[tenant]/(modules)/people/types";
import { formatDate, toDateInputValue } from "@/app/[tenant]/(modules)/people/utils";
import { resolveMediaUrl } from "@/lib/api";
import { uploadHealthDocument } from "@/features/uploads/api";
import { useAuth } from "@/features/auth/auth-context";

const buildFormValues = (
  condition?: HealthCondition,
): HealthConditionFormValues => ({
  type: condition?.type ?? "",
  description: condition?.description ?? "",
  severity: condition?.severity ?? "",
  diagnosisDate: toDateInputValue(condition?.diagnosisDate ?? null),
  documentFile: null,
  notes: condition?.notes ?? "",
});

type HealthConditionsPanelProps = {
  personId: string;
};

export function HealthConditionsPanel({ personId }: HealthConditionsPanelProps) {
  const { token } = useAuth();
  const { conditions, isLoading, error, create, update, remove } =
    useHealthConditions(personId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HealthCondition | null>(null);

  const initialValues = useMemo(() => buildFormValues(editing ?? undefined), [
    editing,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setEditing(null);
    }
  };

  const handleSubmit = async (values: HealthConditionFormValues) => {
    if (!values.type.trim()) return;
    let documentUrl: string | null = null;
    if (values.documentFile && token) {
      const uploaded = await uploadHealthDocument(token, values.documentFile);
      documentUrl = uploaded.path;
    }
    const payload = {
      type: values.type.trim(),
      description: values.description?.trim() || null,
      severity: values.severity?.trim() || null,
      diagnosisDate: values.diagnosisDate || null,
      documentUrl,
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
      title="Saude"
      subtitle="Condicoes e necessidades de saude"
      actions={
        <SectionDialog
          open={open}
          onOpenChange={handleOpenChange}
          title={editing ? "Editar condicao" : "Adicionar condicao"}
          description="Registre informacoes relevantes de saude."
          trigger={
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
              <Plus className="size-3.5" />
              Nova condicao
            </Button>
          }
        >
          <HealthConditionForm
            initialValues={initialValues}
            submitLabel={editing ? "Atualizar" : "Salvar"}
            onSubmit={handleSubmit}
            onCancel={() => handleOpenChange(false)}
          />
        </SectionDialog>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {conditions.length ? (
        <SectionList>
          {conditions.map((condition) => (
            <SectionListItem
              key={condition.id}
              title={<span>{condition.type}</span>}
              subtitle={condition.description ? condition.description : undefined}
              meta={
                <>
                  {condition.severity ? (
                    <Badge variant="outline">{condition.severity}</Badge>
                  ) : null}
                  {condition.diagnosisDate ? (
                    <Badge variant="secondary">
                      {formatDate(condition.diagnosisDate)}
                    </Badge>
                  ) : null}
                  {condition.documentUrl ? (
                    <Badge variant="secondary" className="gap-1">
                      <FileText className="size-3" />
                      <a
                        href={resolveMediaUrl(condition.documentUrl)}
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
                      setEditing(condition);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(condition.id)}
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
          Nenhuma condicao cadastrada.
        </p>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}
    </SectionCard>
  );
}

