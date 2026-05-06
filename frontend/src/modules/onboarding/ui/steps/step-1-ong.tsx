"use client";

import * as React from "react";
import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveMediaUrl } from "@/lib/api";

export type OngData = {
  cnpj: string;
  logoUrl: string;
  startYear: string;
  description: string;
};

type Step1OngProps = {
  tenantName: string;
  value: OngData;
  onChange: (value: OngData) => void;
  onLogoFileChange: (file: File | null) => void;
  logoUploading?: boolean;
};

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function Step1Ong({
  tenantName,
  value,
  onChange,
  onLogoFileChange,
  logoUploading = false,
}: Step1OngProps) {
  const set = (key: keyof OngData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = e.target.value;
    onChange({
      ...value,
      [key]: key === "cnpj" ? formatCnpj(raw) : raw,
    });
  };

  const logoPreview = React.useMemo(
    () => resolveMediaUrl(value.logoUrl) || value.logoUrl,
    [value.logoUrl],
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Configure sua ONG</h2>
          <p className="text-sm text-slate-500">
            Informações institucionais de <span className="font-medium">{tenantName}</span>
          </p>
        </div>
      </div>

      <div className="w-full space-y-4 text-left">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="logoFile">Logo da ONG</Label>
              <p className="mt-1 text-xs text-slate-500">Opcional. Envie uma imagem ou cole a URL abaixo.</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt={`Logo de ${tenantName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-7 w-7 text-slate-300" />
              )}
            </div>
          </div>

          <Input
            id="logoFile"
            type="file"
            accept="image/*"
            onChange={(event) => onLogoFileChange(event.target.files?.[0] ?? null)}
            disabled={logoUploading}
          />

          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">URL da logo</Label>
            <Input
              id="logoUrl"
              placeholder="https://exemplo.org/logo.png"
              value={value.logoUrl}
              onChange={set("logoUrl")}
              disabled={logoUploading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            placeholder="00.000.000/0000-00"
            value={value.cnpj}
            onChange={set("cnpj")}
            inputMode="numeric"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="startYear">Ano de fundação</Label>
          <Input
            id="startYear"
            placeholder="Ex.: 2010"
            value={value.startYear}
            onChange={set("startYear")}
            inputMode="numeric"
            maxLength={4}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição da ONG <span className="text-slate-400 font-normal">(opcional)</span></Label>
          <Textarea
            id="description"
            placeholder="Missão, área de atuação, público atendido..."
            value={value.description}
            onChange={set("description")}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
