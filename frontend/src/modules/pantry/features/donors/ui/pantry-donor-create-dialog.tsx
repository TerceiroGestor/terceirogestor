"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { createPantryDonor, type ApiPantryDonor } from "@/modules/pantry/api";

type PantryDonorCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onCreated?: (donor: ApiPantryDonor) => void;
};

export function PantryDonorCreateDialog({
  open,
  onOpenChange,
  initialName,
  onCreated,
}: PantryDonorCreateDialogProps) {
  const { token } = useAuth();
  const { toast } = useToast();

  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState(initialName ?? "");
  const [type, setType] = React.useState<"PERSON" | "COMPANY">("PERSON");
  const [contact, setContact] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setSaving(false);
    setName(initialName ?? "");
    setType("PERSON");
    setContact("");
  }, [initialName, open]);

  const submit = React.useCallback(async () => {
    if (!token) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ variant: "destructive", title: "Nome obrigatório" });
      return;
    }

    setSaving(true);
    try {
      const created = await createPantryDonor(token, {
        name: trimmed,
        type,
        contact: contact.trim() ? contact.trim() : null,
      });
      toast({ title: "Doador criado" });
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao criar doador.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setSaving(false);
    }
  }, [contact, name, onCreated, onOpenChange, toast, token, type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Novo doador</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="donor-name">Nome</Label>
            <Input
              id="donor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mercado Central"
              autoFocus
              disabled={saving}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as "PERSON" | "COMPANY")} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSON">Pessoa</SelectItem>
                <SelectItem value="COMPANY">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="donor-contact">Contato (opcional)</Label>
            <Input
              id="donor-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Telefone, e-mail..."
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={saving || !token}>
            {saving ? "..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

