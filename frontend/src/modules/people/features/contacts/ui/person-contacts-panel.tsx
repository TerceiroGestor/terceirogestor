"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createPersonContact,
  deletePersonContact,
  listPersonContacts,
  updatePersonContact,
  type ApiPersonContact,
  type ApiPersonContactRole,
  type ApiPersonContactType,
} from "@/modules/people/api";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Trash2 } from "lucide-react";
import { DetailRelationTablePanel } from "@/web-client/detail/DetailRelationTablePanel";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";

const ROLE_OPTIONS: { value: ApiPersonContactRole; label: string }[] = [
  { value: "SELF", label: "Pessoal" },
  { value: "RESPONSIBLE", label: "Responsável" },
  { value: "EMERGENCY", label: "Emergência" },
];

const TYPE_OPTIONS: { value: ApiPersonContactType; label: string }[] = [
  { value: "PHONE", label: "Telefone" },
  { value: "EMAIL", label: "E-mail" },
];

function roleLabel(role: ApiPersonContactRole) {
  return ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role;
}

function typeLabel(type: ApiPersonContactType) {
  return TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type;
}

function safeErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: string }).message);
  }
  return fallback;
}

type FormState = {
  role: ApiPersonContactRole;
  type: ApiPersonContactType;
  value: string;
  label: string;
  name: string;
  relationship: string;
  isPrimary: boolean;
  isWhatsapp: boolean;
  notes: string;
};

const emptyForm = (seed?: Partial<FormState>): FormState => ({
  role: seed?.role ?? "SELF",
  type: seed?.type ?? "PHONE",
  value: seed?.value ?? "",
  label: seed?.label ?? "",
  name: seed?.name ?? "",
  relationship: seed?.relationship ?? "",
  isPrimary: seed?.isPrimary ?? false,
  isWhatsapp: seed?.isWhatsapp ?? false,
  notes: seed?.notes ?? "",
});

export function PersonContactsPanel({
  personId,
  seedEmail,
  seedPhone,
  onChanged,
  readOnly = false,
}: {
  personId: string;
  seedEmail?: string | null;
  seedPhone?: string | null;
  onChanged?: () => void;
  readOnly?: boolean;
}) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = React.useState<ApiPersonContact[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiPersonContact | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm());

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await listPersonContacts(token, personId);
      setContacts(data);
    } catch (err) {
      toast({
        title: "Falha ao carregar contatos",
        description: safeErrorMessage(err, "Tente novamente."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [personId, toast, token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openCreateDialog = React.useCallback(
    (seed?: Partial<FormState>) => {
      setEditing(null);
      setForm(emptyForm(seed));
      setDialogOpen(true);
    },
    [],
  );

  const openEditDialog = React.useCallback((contact: ApiPersonContact) => {
    setEditing(contact);
    setForm(
      emptyForm({
        role: contact.role,
        type: contact.type,
        value: contact.value,
        label: contact.label ?? "",
        name: contact.name ?? "",
        relationship: contact.relationship ?? "",
        isPrimary: contact.isPrimary,
        isWhatsapp: contact.isWhatsapp,
        notes: contact.notes ?? "",
      }),
    );
    setDialogOpen(true);
  }, []);

  const handleCopy = React.useCallback((value: string) => {
    if (!value) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(value);
    }
  }, []);

  const handleDelete = React.useCallback(
    async (contact: ApiPersonContact) => {
      if (!token) return;
      const ok = window.confirm("Remover este contato?");
      if (!ok) return;
      setSaving(true);
      try {
        await deletePersonContact(token, personId, contact.id);
        await load();
        onChanged?.();
      } catch (err) {
        toast({
          title: "Falha ao remover contato",
          description: safeErrorMessage(err, "Tente novamente."),
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [load, onChanged, personId, toast, token],
  );

  const handleSubmit = React.useCallback(async () => {
    if (!token) return;
    const value = form.value.trim();
    if (!value) {
      toast({
        title: "Preencha o valor",
        description: "Informe um e-mail ou telefone.",
        variant: "destructive",
      });
      return;
    }
    if (form.role !== "SELF" && !form.name.trim()) {
      toast({
        title: "Preencha o nome",
        description: "Informe o nome do contato.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        role: form.role,
        type: form.type,
        value,
        label: form.label.trim() || null,
        name: form.role === "SELF" ? null : form.name.trim() || null,
        relationship: form.relationship.trim() || null,
        isPrimary: form.isPrimary,
        isWhatsapp: form.type === "PHONE" ? form.isWhatsapp : false,
        notes: form.notes.trim() || null,
      };

      if (editing) {
        await updatePersonContact(token, personId, editing.id, payload);
      } else {
        await createPersonContact(token, personId, payload);
      }
      await load();
      setDialogOpen(false);
      onChanged?.();
      toast({
        title: "Contato salvo",
        description: "As informações foram atualizadas.",
      });
    } catch (err) {
      toast({
        title: "Falha ao salvar contato",
        description: safeErrorMessage(err, "Verifique os dados e tente novamente."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [editing, form, load, onChanged, personId, toast, token]);

  const showNameFields = form.role !== "SELF";
  const showWhatsapp = form.type === "PHONE";
  const canSeed =
    !readOnly && Boolean(seedEmail || seedPhone) && contacts.length === 0;

  const columns = React.useMemo<ColumnDef<ApiPersonContact, unknown>[]>(
    () => [
      {
        id: "contact",
        header: "Contato",
        cell: ({ row }) => {
          const contact = row.original;
          const who =
            contact.role === "SELF" ? null : contact.name ? contact.name : "Contato";
          return (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {[typeLabel(contact.type), roleLabel(contact.role), who]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
                {contact.isPrimary ? (
                  <Badge variant="secondary">Principal</Badge>
                ) : null}
                {contact.type === "PHONE" && contact.isWhatsapp ? (
                  <Badge variant="outline">WhatsApp</Badge>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "value",
        header: "Valor",
        cell: ({ row }) => (
          <TruncatedTextCell text={row.original.value} className="text-sm" />
        ),
      },
      {
        accessorKey: "label",
        header: "Rótulo",
        cell: ({ row }) => (
          <TruncatedTextCell text={row.original.label} className="text-sm text-muted-foreground" />
        ),
      },
      {
        accessorKey: "relationship",
        header: "Parentesco",
        cell: ({ row }) => (
          <TruncatedTextCell text={row.original.relationship} className="text-sm text-muted-foreground" />
        ),
      },
      {
        id: "actions",
        header: "",
        size: 80,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                handleCopy(row.original.value);
              }}
              title="Copiar"
            >
              <Copy className="size-4" />
            </Button>
            {!readOnly ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDelete(row.original);
                }}
                disabled={saving}
                title="Remover"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [handleCopy, handleDelete, readOnly, saving],
  );

  const filterRow = React.useCallback((row: ApiPersonContact, query: string) => {
    const values = [
      typeLabel(row.type),
      roleLabel(row.role),
      row.value,
      row.label,
      row.name,
      row.relationship,
    ];
    return values.some((value) => String(value ?? "").toLowerCase().includes(query));
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      {canSeed ? (
        <div className="mx-4 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/10 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Importar do cadastro:</span>
          {seedPhone ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() =>
                openCreateDialog({
                  role: "SELF",
                  type: "PHONE",
                  value: seedPhone,
                  isPrimary: true,
                  isWhatsapp: true,
                })
              }
            >
              Telefone
            </Button>
          ) : null}
          {seedEmail ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() =>
                openCreateDialog({
                  role: "SELF",
                  type: "EMAIL",
                  value: seedEmail,
                  isPrimary: true,
                })
              }
            >
              E-mail
            </Button>
          ) : null}
        </div>
      ) : null}

      <DetailRelationTablePanel
        data={contacts}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={readOnly ? undefined : (row) => openEditDialog(row)}
        searchPlaceholder="Pesquisar contatos"
        filterRow={filterRow}
        onAdd={readOnly ? undefined : () => openCreateDialog()}
        loading={loading}
        emptyMessage="Nenhum contato cadastrado."
        tableInitialColumnPinning={{ left: ["contact"], right: ["actions"] }}
        filterFields={[
          { name: "tipo", label: "Tipo", type: "select", options: TYPE_OPTIONS },
          { name: "categoria", label: "Categoria", type: "select", options: ROLE_OPTIONS },
        ]}
        buildSearchRecord={(row) => ({ tipo: row.type, categoria: row.role })}
        searchActionId="people.contacts"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar contato" : "Novo contato"}</DialogTitle>
            <DialogDescription>
              Telefones, e-mails e contatos de emergência/responsáveis.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    type: value as ApiPersonContactType,
                    isWhatsapp: value === "PHONE" ? prev.isWhatsapp : false,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    role: value as ApiPersonContactRole,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Valor</Label>
              <Input
                value={form.value}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, value: e.target.value }))
                }
                placeholder={form.type === "EMAIL" ? "email@exemplo.com" : "(11) 99999-9999"}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Rótulo (opcional)</Label>
              <Input
                value={form.label}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="Ex.: Trabalho, Recados..."
              />
            </div>

            {showNameFields ? (
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex.: Maria da Silva"
                />
              </div>
            ) : null}

            <div
              className={showNameFields ? "space-y-1.5" : "space-y-1.5 md:col-span-2"}
            >
              <Label>Parentesco (opcional)</Label>
              <Input
                value={form.relationship}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    relationship: e.target.value,
                  }))
                }
                placeholder="Ex.: Mãe, Pai..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 md:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isPrimary}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      isPrimary: Boolean(checked),
                    }))
                  }
                />
                Principal
              </label>
              {showWhatsapp ? (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.isWhatsapp}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        isWhatsapp: Boolean(checked),
                      }))
                    }
                  />
                  WhatsApp
                </label>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {editing ? "Salvar alterações" : "Adicionar contato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
