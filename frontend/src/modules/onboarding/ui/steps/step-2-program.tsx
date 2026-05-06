"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProgramData = {
  name: string;
  startsAt: string;
  endsAt: string;
};

type Step2ProgramProps = {
  value: ProgramData;
  onChange: (value: ProgramData) => void;
};

export function Step2Program({ value, onChange }: Step2ProgramProps) {
  const set =
    (key: keyof ProgramData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [key]: e.target.value });
    };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <BookOpen className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Crie seu primeiro Programa</h2>
          <p className="text-sm text-slate-500">
            O Programa SCFV é o guarda-chuva que agrupa todas as suas turmas. Se preferir, pule esta etapa por enquanto.
          </p>
        </div>
      </div>

      <div className="w-full space-y-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="programName">Nome do programa <span className="text-slate-400 font-normal">(opcional)</span></Label>
          <Input
            id="programName"
            placeholder="Ex.: SCFV Crianças e Adolescentes 2025"
            value={value.name}
            onChange={set("name")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startsAt">Início da vigência</Label>
            <Input
              id="startsAt"
              type="date"
              value={value.startsAt}
              onChange={set("startsAt")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endsAt">Fim da vigência</Label>
            <Input
              id="endsAt"
              type="date"
              value={value.endsAt}
              onChange={set("endsAt")}
            />
          </div>
        </div>

        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          O tipo <strong>SCFV</strong> (Serviço de Convivência e Fortalecimento de Vínculos) será aplicado automaticamente.
        </div>
      </div>
    </div>
  );
}
