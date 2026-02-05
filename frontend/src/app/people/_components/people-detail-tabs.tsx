"use client";

import { Fragment } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  MapPin,
  Phone,
  User,
  UsersRound,
  Wallet,
} from "lucide-react";

type PeopleDetailTabsProps = {
  value: string;
  onValueChange: (value: string) => void;
};

const tabGroups = [
  {
    label: "Pessoais",
    items: [
      { value: "geral", label: "Geral", icon: User },
      { value: "endereco", label: "Endereco", icon: MapPin },
      { value: "renda", label: "Renda", icon: Wallet },
      { value: "familia", label: "Familia", icon: UsersRound },
      { value: "contatos", label: "Contato", icon: Phone },
      { value: "educacao", label: "Educacional", icon: GraduationCap },
    ],
  },
  {
    label: "Sociais",
    items: [
      { value: "resumo", label: "Resumo", icon: FileText },
      { value: "atendimento", label: "Atendimentos", icon: ClipboardList },
      { value: "avaliacao", label: "Avaliacoes", icon: BookOpen },
      { value: "ocorrencias", label: "Ocorrencias", icon: AlertTriangle },
    ],
  },
  {
    label: "Atividades",
    items: [
      { value: "diario", label: "Diario", icon: FileText },
      { value: "grupo", label: "Grupos", icon: Layers },
      { value: "presencas", label: "Presencas", icon: CalendarCheck },
      { value: "atividades", label: "Atividades", icon: Activity },
    ],
  },
] as const;

const allItems = tabGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label })),
);

export function PeopleDetailTabs({
  value,
  onValueChange,
}: PeopleDetailTabsProps) {
  const current = allItems.find((item) => item.value === value) ?? allItems[0];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 px-3 text-xs"
          >
            <span className="text-muted-foreground">{current.group}</span>
            <span className="font-medium text-foreground">{current.label}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
            {tabGroups.map((group, groupIndex) => (
              <Fragment key={group.label}>
                <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </DropdownMenuLabel>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuRadioItem key={item.value} value={item.value}>
                      <Icon className="size-4" />
                      {item.label}
                    </DropdownMenuRadioItem>
                  );
                })}
                {groupIndex < tabGroups.length - 1 ? (
                  <DropdownMenuSeparator />
                ) : null}
              </Fragment>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
