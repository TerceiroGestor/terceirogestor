"use client";

import { Fragment } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ClipboardList,
  FileText,
  FolderOpen,
  HeartPulse,
  History,
  Pill,
  User,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

type PeopleDetailTabsProps = {
  value: string;
  onValueChange: (value: string) => void;
};

type TabItem = {
  value: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

type TabGroup = {
  label: string;
  items: TabItem[];
};

const tabGroups: TabGroup[] = [
  {
    label: "Perfil",
    items: [
      { value: "resumo", label: "Resumo", icon: FileText },
    ],
  },
  {
    label: "Vinculos",
    items: [
      {
        value: "familia",
        label: "Familiares",
        icon: Users,
        disabled: true,
      },
      {
        value: "responsaveis",
        label: "Responsaveis",
        icon: UserRound,
        disabled: true,
      },
    ],
  },
  {
    label: "Saude",
    items: [
      {
        value: "saude",
        label: "Condicoes",
        icon: HeartPulse,
        disabled: true,
      },
      {
        value: "medicacoes",
        label: "Medicacoes",
        icon: Pill,
        disabled: true,
      },
    ],
  },
  {
    label: "Registros",
    items: [
      {
        value: "atendimentos",
        label: "Atendimentos",
        icon: ClipboardList,
        disabled: true,
      },
      {
        value: "documentos",
        label: "Documentos",
        icon: FolderOpen,
        disabled: true,
      },
      {
        value: "historico",
        label: "Historico",
        icon: History,
        disabled: true,
      },
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
                    <DropdownMenuRadioItem
                      key={item.value}
                      value={item.value}
                      disabled={item.disabled}
                    >
                      <Icon className="size-4" />
                      {item.label}
                      {item.disabled ? (
                        <DropdownMenuShortcut className="text-[10px] tracking-wide">
                          Em breve
                        </DropdownMenuShortcut>
                      ) : null}
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
