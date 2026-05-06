"use client";

import * as React from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { publicApiRequest } from "@/lib/api";
import {
  buildAddressQuery,
  buildGoogleMapsSearchUrl,
} from "@/modules/people/shared/domain/address";
import { useFamilyRelationsContext } from "@/modules/people/features/family-members/context/family-relations-context";
import type { HouseholdProfile } from "@/modules/people/shared/domain/types";

type AddressDraft = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
  notes: string;
};

type CepLookupResult = {
  cep: string;
  formattedCep: string;
  street?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

const lineInputClassName =
  "h-10 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0";
const lineTextareaClassName =
  "min-h-[100px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 py-3 shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const fieldLabelClassName =
  "text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";

function SectionField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className={fieldLabelClassName}>{label}</div>
      {children}
    </div>
  );
}

function buildDraft(profile?: HouseholdProfile | null): AddressDraft {
  return {
    cep: profile?.cep ?? "",
    street: profile?.street ?? "",
    number: profile?.number ?? "",
    complement: profile?.complement ?? "",
    neighborhood: profile?.neighborhood ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    reference: profile?.reference ?? "",
    notes: profile?.notes ?? "",
  };
}

function toApiPayload(draft: AddressDraft): Partial<HouseholdProfile> {
  return {
    cep: draft.cep.trim() || null,
    street: draft.street.trim() || null,
    number: draft.number.trim() || null,
    complement: draft.complement.trim() || null,
    neighborhood: draft.neighborhood.trim() || null,
    city: draft.city.trim() || null,
    state: draft.state.trim() || null,
    reference: draft.reference.trim() || null,
    notes: draft.notes.trim() || null,
  };
}

export function HouseholdAddressPanel() {
  const {
    householdProfile,
    summaryLoading,
    summaryError,
    loadSummary,
    upsertHouseholdProfile,
  } = useFamilyRelationsContext();
  const { toast } = useToast();
  const [draft, setDraft] = React.useState<AddressDraft>(buildDraft(householdProfile));
  const [saving, setSaving] = React.useState(false);
  const [isCepLoading, setIsCepLoading] = React.useState(false);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  React.useEffect(() => {
    setDraft(buildDraft(householdProfile));
  }, [householdProfile]);

  const mapsQuery = React.useMemo(
    () =>
      buildAddressQuery({
        cep: draft.cep || null,
        street: draft.street || null,
        number: draft.number || null,
        neighborhood: draft.neighborhood || null,
        city: draft.city || null,
        state: draft.state || null,
      }),
    [draft],
  );

  const mapsUrl = React.useMemo(
    () =>
      buildGoogleMapsSearchUrl({
        cep: draft.cep || null,
        street: draft.street || null,
        number: draft.number || null,
        neighborhood: draft.neighborhood || null,
        city: draft.city || null,
        state: draft.state || null,
      }),
    [draft],
  );

  const handleSave = React.useCallback(async () => {
    setSaving(true);
    try {
      await upsertHouseholdProfile(toApiPayload(draft));
      toast({
        title: "Endereço atualizado",
        description: "Dados do núcleo familiar salvos com sucesso.",
      });
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar endereço.";
      toast({
        title: "Erro ao salvar endereço",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [draft, toast, upsertHouseholdProfile]);

  const fetchCep = React.useCallback(
    async (cepInput: string) => {
      const digits = cepInput.replace(/\D/g, "");
      if (digits.length !== 8) {
        if (cepInput.trim()) {
          toast({
            variant: "destructive",
            title: "CEP",
            description: "Informe um CEP válido (8 dígitos).",
          });
        }
        return;
      }

      setIsCepLoading(true);
      try {
        const data = await publicApiRequest<CepLookupResult>(`/cep/${digits}`, {
          cache: "no-store",
        });
        setDraft((previous) => ({
          ...previous,
          cep: data.formattedCep,
          street: data.street ?? "",
          neighborhood: data.neighborhood ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
        }));
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao validar CEP.";
        toast({ variant: "destructive", title: "CEP", description: message });
      } finally {
        setIsCepLoading(false);
      }
    },
    [toast],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
        O endereço pertence ao núcleo familiar. Ao atualizar aqui, os dados ficam disponíveis para toda a família vinculada.
      </div>

      {summaryError ? <div className="text-sm text-destructive">{summaryError}</div> : null}
      {summaryLoading ? <div className="text-sm text-muted-foreground">Carregando endereço...</div> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionField label="CEP">
          <div className="flex items-end gap-2">
            <Input
              value={draft.cep}
              onChange={(event) => setDraft((previous) => ({ ...previous, cep: event.target.value }))}
              placeholder="Somente dígitos"
              className={lineInputClassName}
            />
            <Button
              type="button"
              variant="outline"
              className="h-9"
              disabled={isCepLoading}
              onClick={() => void fetchCep(draft.cep)}
            >
              {isCepLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </SectionField>

        <SectionField label="Número">
          <Input
            value={draft.number}
            onChange={(event) => setDraft((previous) => ({ ...previous, number: event.target.value }))}
            placeholder="Ex.: 123"
            className={lineInputClassName}
          />
        </SectionField>

        <SectionField label="Logradouro">
          <Input value={draft.street} readOnly className={lineInputClassName} />
        </SectionField>

        <SectionField label="Bairro">
          <Input value={draft.neighborhood} readOnly className={lineInputClassName} />
        </SectionField>

        <SectionField label="Cidade">
          <Input value={draft.city} readOnly className={lineInputClassName} />
        </SectionField>

        <SectionField label="UF">
          <Input value={draft.state} readOnly className={lineInputClassName} />
        </SectionField>

        <SectionField label="Complemento">
          <Input
            value={draft.complement}
            onChange={(event) => setDraft((previous) => ({ ...previous, complement: event.target.value }))}
            placeholder="Ex.: Casa dos fundos"
            className={lineInputClassName}
          />
        </SectionField>

        <SectionField label="Referência">
          <Input
            value={draft.reference}
            onChange={(event) => setDraft((previous) => ({ ...previous, reference: event.target.value }))}
            placeholder="Ex.: Próximo ao posto"
            className={lineInputClassName}
          />
        </SectionField>

        <div className="xl:col-span-2">
          <SectionField label="Observações do endereço">
            <Textarea
              value={draft.notes}
              onChange={(event) => setDraft((previous) => ({ ...previous, notes: event.target.value }))}
              className={lineTextareaClassName}
            />
          </SectionField>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {mapsQuery ? "Mapa disponível para este endereço." : "Preencha CEP e número para montar o mapa."}
        </div>
        <div className="flex items-center gap-2">
          {mapsUrl ? (
            <Button type="button" variant="outline" asChild>
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                <MapPin className="mr-2 h-4 w-4" />
                Ver mapa
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : null}
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            Salvar endereço
          </Button>
        </div>
      </div>
    </div>
  );
}
