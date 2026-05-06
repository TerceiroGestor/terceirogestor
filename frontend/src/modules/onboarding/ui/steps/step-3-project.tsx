"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProjectData = {
  name: string;
  startsAt: string;
  endsAt: string;
};

type Step3ProjectProps = {
  value: ProjectData;
  onChange: (value: ProjectData) => void;
};

export function Step3Project({ value, onChange }: Step3ProjectProps) {
  const set =
    (key: keyof ProjectData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [key]: e.target.value });
    };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
          <Users className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Crie sua primeira Turma</h2>
          <p className="text-sm text-slate-500">
            A turma agrupa os beneficiários para acompanhamento das atividades. Esta etapa tambem pode ficar para depois.
          </p>
        </div>
      </div>

      <div className="w-full space-y-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="projectName">Nome da turma <span className="text-slate-400 font-normal">(opcional)</span></Label>
          <Input
            id="projectName"
            placeholder="Ex.: Turma Infância 6-11 anos"
            value={value.name}
            onChange={set("name")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="projectStartsAt">Data de início</Label>
            <Input
              id="projectStartsAt"
              type="date"
              value={value.startsAt}
              onChange={set("startsAt")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="projectEndsAt">Data de encerramento</Label>
            <Input
              id="projectEndsAt"
              type="date"
              value={value.endsAt}
              onChange={set("endsAt")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
