"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Mail, MessageCircle, Pencil, Phone, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { useContacts } from "@/modules/people/features/contacts/data/use-contacts";
import type { ApiPersonContact } from "@/modules/people/api";
import { DetailRelationTablePanel } from "@/web-client/detail/DetailRelationTablePanel";

const TYPE_LABELS: Record<ApiPersonContact["type"], string> = {
  EMAIL: "E-mail",
  PHONE: "Telefone",
};

const ROLE_LABELS: Record<ApiPersonContact["role"], string> = {
  SELF: "Pessoal",
  RESPONSIBLE: "Responsável",
  EMERGENCY: "Emergência",
};

function truncate(value: string | null | undefined, size = 46) {
  const text = (value ?? "").trim();
  if (!text) return "-";
  return text.length > size ? `${text.slice(0, size - 1)}...` : text;
}

export function ContactsPanel({ personId }: { personId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { contacts, isLoading, error, remove } = useContacts(personId);

  const columns = React.useMemo<ColumnDef<ApiPersonContact, unknown>[]>(
    () => [
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => <span className="block truncate whitespace-nowrap">{TYPE_LABELS[row.original.type]}</span>,
      },
      {
        accessorKey: "role",
        header: "Categoria",
        cell: ({ row }) => <span className="block truncate whitespace-nowrap">{ROLE_LABELS[row.original.role]}</span>,
      },
      {
        accessorKey: "value",
        header: "Valor",
        cell: ({ row }) => <span className="block truncate whitespace-nowrap">{row.original.value}</span>,
      },
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => <span className="block truncate whitespace-nowrap">{truncate(row.original.name)}</span>,
      },
      {
        accessorKey: "relationship",
        header: "Parentesco",
        cell: ({ row }) => <span className="block truncate whitespace-nowrap">{truncate(row.original.relationship)}</span>,
      },
      {
        id: "flags",
        header: "Marcadores",
        cell: ({ row }) => {
          const values = [
            row.original.isPrimary ? "Principal" : null,
            row.original.isWhatsapp ? "WhatsApp" : null,
          ].filter(Boolean);
          return <span className="block truncate whitespace-nowrap">{values.length ? values.join(" • ") : "-"}</span>;
        },
      },
      {
        id: "quick-actions",
        header: "Atalhos",
        size: 120,
        cell: ({ row }) => {
          const contact = row.original;
          const digits = contact.value.replace(/\D/g, "");
          const whatsappHref = digits ? `https://wa.me/${digits}` : null;
          const phoneHref = digits ? `tel:${digits}` : null;
          const emailHref = contact.type === "EMAIL" ? `mailto:${contact.value}` : null;

          return (
            <div className="flex items-center gap-1">
              {phoneHref ? (
                <Button type="button" size="icon" variant="ghost" asChild>
                  <a href={phoneHref} onClick={(event) => event.stopPropagation()}>
                    <Phone className="size-4" />
                  </a>
                </Button>
              ) : null}
              {emailHref ? (
                <Button type="button" size="icon" variant="ghost" asChild>
                  <a href={emailHref} onClick={(event) => event.stopPropagation()}>
                    <Mail className="size-4" />
                  </a>
                </Button>
              ) : null}
              {contact.isWhatsapp && whatsappHref ? (
                <Button type="button" size="icon" variant="ghost" asChild>
                  <a href={whatsappHref} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                    <MessageCircle className="size-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 60,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                router.push(withTenantPath(`/people/${personId}/contacts/${row.original.id}`, tenantSlug));
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                if (!window.confirm("Excluir este contato?")) return;
                void remove(row.original.id);
              }}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [personId, remove, router, tenantSlug],
  );

  const filterRow = React.useCallback((row: ApiPersonContact, query: string) => {
    const values = [
      row.value,
      row.name,
      row.relationship,
      row.label,
      TYPE_LABELS[row.type],
      ROLE_LABELS[row.role],
    ];
    return values.some((value) => String(value ?? "").toLowerCase().includes(query));
  }, []);

  return (
    <DetailRelationTablePanel
      data={contacts}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        router.push(
          withTenantPath(`/people/${personId}/contacts/${row.id}`, tenantSlug),
        )
      }
      searchPlaceholder="Pesquisar contatos"
      filterRow={filterRow}
      addHref={withTenantPath(`/people/${personId}/contacts/new`, tenantSlug)}
      addLabel="Novo contato"
      loading={isLoading}
      error={error}
      emptyMessage="Nenhum contato cadastrado."
      tableMinWidthClassName="min-w-[900px]"
      tableInitialColumnPinning={{ right: ["actions"] }}
      filterFields={[
        { name: "tipo", label: "Tipo", type: "text" },
        { name: "categoria", label: "Categoria", type: "text" },
        { name: "valor", label: "Valor", type: "text" },
        { name: "nome", label: "Nome", type: "text" },
      ]}
      buildSearchRecord={(row) => ({
        tipo: TYPE_LABELS[row.type],
        categoria: ROLE_LABELS[row.role],
        valor: row.value,
        nome: row.name,
      })}
      searchActionId="people.contacts"
    />
  );
}
