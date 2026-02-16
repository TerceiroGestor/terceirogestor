"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { resetPassword } from "@/features/auth/api";
import { withTenantPath } from "@/lib/tenant-path";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const slug = typeof params?.tenant === "string" ? params.tenant : "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token.trim()) {
      toast({
        variant: "destructive",
        title: "Token",
        description: "Link inválido ou expirado.",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Senha",
        description: "Use uma senha com no mínimo 8 caracteres.",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        variant: "destructive",
        title: "Senha",
        description: "As senhas não conferem.",
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, password });
      toast({
        title: "Senha atualizada",
        description: "Faça login com a nova senha.",
      });
      router.replace(withTenantPath("/login", slug));
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao redefinir senha.";
      toast({ variant: "destructive", title: "Erro", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-foreground">
          Redefinir senha
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina uma nova senha para sua conta.
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Nova senha
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Confirmar senha
            </label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push(withTenantPath("/login", slug))}
            disabled={loading}
          >
            Voltar
          </Button>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

