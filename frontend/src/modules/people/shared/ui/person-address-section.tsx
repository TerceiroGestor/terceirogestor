"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionDialog } from "@/components/section-dialog";
import { useToast } from "@/components/ui/use-toast";
import { publicApiRequest } from "@/lib/api";
import { useFamilyRelationsContext } from "@/modules/people/features/family-members/context/family-relations-context";
import {
  buildAddressLabel,
  buildAddressQuery,
  buildGoogleMapsSearchUrl,
  formatCep,
} from "@/modules/people/shared/domain/address";
import { Copy, ExternalLink, MapPin, Pencil, Plus } from "lucide-react";

type AddressForm = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  complement: string;
  reference: string;
};

type CepLookupResult = {
  cep: string;
  formattedCep: string;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
};

function getEmptyForm(): AddressForm {
  return {
    cep: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    number: "",
    complement: "",
    reference: "",
  };
}

export function PersonAddressSection() {
  const { householdProfile, summaryLoading, upsertHouseholdProfile } =
    useFamilyRelationsContext();
  const { toast } = useToast();

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<AddressForm>(getEmptyForm());
  const [isCepLoading, setIsCepLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const addressInput = {
    cep: householdProfile?.cep ?? null,
    street: householdProfile?.street ?? null,
    number: householdProfile?.number ?? null,
    neighborhood: householdProfile?.neighborhood ?? null,
    city: householdProfile?.city ?? null,
    state: householdProfile?.state ?? null,
  };
  const addressLabel = buildAddressLabel(addressInput);
  const mapsQuery = buildAddressQuery(addressInput);
  const mapsUrl = buildGoogleMapsSearchUrl(addressInput);
  const embedUrl = mapsQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`
    : null;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) {
        setForm({
          cep: formatCep(householdProfile?.cep ?? null),
          street: householdProfile?.street ?? "",
          neighborhood: householdProfile?.neighborhood ?? "",
          city: householdProfile?.city ?? "",
          state: householdProfile?.state ?? "",
          number: householdProfile?.number ?? "",
          complement: householdProfile?.complement ?? "",
          reference: householdProfile?.reference ?? "",
        });
      }
      setOpen(next);
    },
    [householdProfile],
  );

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
        setForm((previous) => ({
          ...previous,
          cep: data.formattedCep,
          street: data.street ?? "",
          neighborhood: data.neighborhood ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
        }));
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao validar CEP.";
        toast({ variant: "destructive", title: "CEP", description: message });
      } finally {
        setIsCepLoading(false);
      }
    },
    [toast],
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await upsertHouseholdProfile({
        cep: form.cep.trim() || null,
        number: form.number.trim() || null,
        complement: form.complement.trim() || null,
        reference: form.reference.trim() || null,
      });
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = React.useCallback((value: string) => {
    if (!value || !navigator?.clipboard?.writeText) return;
    void navigator.clipboard.writeText(value);
  }, []);

  const editDialog = (
    <SectionDialog
      title={addressLabel ? "Editar endereço" : "Adicionar endereço"}
      description="O endereço é compartilhado entre as pessoas do mesmo domicílio."
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        <Button type="button" variant="outline" size="sm">
          {addressLabel ? (
            <>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Editar
            </>
          ) : (
            <>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Adicionar endereço
            </>
          )}
        </Button>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>CEP</Label>
          <div className="flex gap-2">
            <Input
              value={form.cep}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  cep: event.target.value,
                  street: "",
                  neighborhood: "",
                  city: "",
                  state: "",
                }))
              }
              onBlur={() => fetchCep(form.cep)}
              placeholder="00000-000"
              inputMode="numeric"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isCepLoading}
              onClick={() => fetchCep(form.cep)}
            >
              {isCepLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Preencha o CEP para validar e completar o endereço.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Logradouro</Label>
          <Input value={form.street} readOnly placeholder="Rua/Avenida" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Número</Label>
            <Input
              value={form.number}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, number: event.target.value }))
              }
              placeholder="123"
            />
          </div>
          <div className="grid gap-2">
            <Label>Complemento</Label>
            <Input
              value={form.complement}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, complement: event.target.value }))
              }
              placeholder="Apto, casa, bloco..."
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Bairro</Label>
            <Input value={form.neighborhood} readOnly />
          </div>
          <div className="grid gap-2">
            <Label>Cidade</Label>
            <Input value={form.city} readOnly />
          </div>
          <div className="grid gap-2">
            <Label>UF</Label>
            <Input value={form.state} readOnly />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Ponto de referência</Label>
          <Input
            value={form.reference}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, reference: event.target.value }))
            }
            placeholder="Ponto de referência, observações do local..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </SectionDialog>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Endereço da família
        </div>
        <p className="text-xs text-muted-foreground">
          O endereço é compartilhado entre as pessoas do mesmo domicílio e é
          cadastrado no perfil da família.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/5 px-4 py-4">
        {summaryLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : addressLabel ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{addressLabel}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(addressLabel)}
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copiar
              </Button>
              <SectionDialog
                title="Mapa do endereço"
                description={addressLabel}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <MapPin className="mr-2 h-3.5 w-3.5" />
                    Ver no mapa
                  </Button>
                }
                headerSlot={
                  mapsUrl ? (
                    <Button size="sm" asChild>
                      <a href={mapsUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir no Google Maps
                      </a>
                    </Button>
                  ) : null
                }
                contentClassName="max-w-[min(96vw,52rem)]"
              >
                {embedUrl ? (
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/10">
                    <iframe
                      title="Mapa do endereço"
                      className="h-[420px] w-full"
                      src={embedUrl}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-4 text-sm text-muted-foreground">
                    Cadastre o endereço (CEP, rua, número, cidade/UF) para
                    habilitar a visualização no mapa.
                  </div>
                )}
              </SectionDialog>
              {editDialog}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Nenhum endereço cadastrado para a família desta pessoa.
            </p>
            {editDialog}
          </div>
        )}
      </div>
    </div>
  );
}
