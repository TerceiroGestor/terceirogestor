"use client";

import * as React from "react";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step4TeamProps = {
  tenantSlug: string;
};

export function Step4Team({ tenantSlug }: Step4TeamProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
          <UserPlus className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Convide sua equipe</h2>
          <p className="text-sm text-slate-500">
            Adicione coordenadores, técnicos e educadores à plataforma.
          </p>
        </div>
      </div>

      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-5 text-left space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-600">
            Você pode convidar membros da equipe a qualquer momento em{" "}
            <strong>Configurações → Usuários</strong>.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-600">
            Cada membro recebe um link de acesso por e-mail com seu perfil de permissões.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-600">
            Perfis disponíveis: <strong>Administrador</strong>, <strong>Coordenador</strong>, <strong>Técnico Social</strong> e <strong>Educador</strong>.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          const url = `/${tenantSlug}/admin/users`;
          window.open(url, "_blank");
        }}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Abrir gestão de usuários (nova aba)
      </Button>
    </div>
  );
}
