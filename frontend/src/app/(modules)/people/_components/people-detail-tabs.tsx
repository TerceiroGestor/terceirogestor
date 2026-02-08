"use client";

import { Fragment, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
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
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Person } from "../types";
import { useAuth } from "@/features/auth/auth-context";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";
import {
  downloadFamilyCsv,
  exportFamilyPdf,
} from "@/features/family-members/utils/family-export-actions";
import { usePeopleFinancial } from "@/features/people-financial/data/use-people-financial";
import {
  downloadPeopleFinancialCsv,
  exportPeopleFinancialPdf,
} from "@/features/people-financial/utils/people-financial-export-actions";
import type { FamilyReportType } from "@/features/family-members/utils/family-report";

type PeopleDetailTabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  person: Person;
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
        disabled: false,
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
    label: "Financeiro",
    items: [
      {
        value: "financeiro",
        label: "Renda e gastos",
        icon: Wallet,
        disabled: false,
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
  person,
}: PeopleDetailTabsProps) {
  const current = allItems.find((item) => item.value === value) ?? allItems[0];
  const { token } = useAuth();
  const {
    data,
    incomeSummary,
    householdProfile,
    householdAssets,
    personAssetsByMember,
  } = useFamilyRelationsContext();
  const { incomes, expenses, transfers } = usePeopleFinancial(person.id, {
    enabled: value === "financeiro",
  });

  const incomeContributorIds = incomeSummary?.contributors ?? [];

  const canExportFamily = Boolean(data && token);
  const canExportFinancial = Boolean(token);

  const reportItems = useMemo(() => {
    if (value === "familia") {
      const items: {
        label: string;
        onSelect: () => void;
        disabled?: boolean;
      }[] = [];
      const handleFamilyPdf = (reportType: FamilyReportType) => () => {
        if (!canExportFamily || !data) return;
        exportFamilyPdf({
          token,
          person,
          householdMembers: data.householdMembers ?? [],
          relations: data.relations ?? [],
          incomeSummary,
          householdProfile,
          householdAssets,
          personAssetsByMember,
          reportType,
        });
      };
      const handleFamilyCsv = () => {
        if (!data) return;
        downloadFamilyCsv({
          person,
          householdMembers: data.householdMembers ?? [],
          relations: data.relations ?? [],
          incomeContributorIds,
          incomeSummary,
          householdAssets,
          personAssetsByMember,
        });
      };
      items.push({
        label: "Relatorio de composicao familiar (PDF)",
        onSelect: handleFamilyPdf("composition"),
        disabled: !canExportFamily,
      });
      items.push({
        label: "Relatorio residencial (PDF)",
        onSelect: handleFamilyPdf("residential"),
        disabled: !canExportFamily,
      });
      items.push({
        label: "Exportar CSV (familia)",
        onSelect: handleFamilyCsv,
        disabled: !data,
      });
      return items;
    }

    if (value === "financeiro") {
      const handleFinancialPdf = () => {
        if (!canExportFinancial) return;
        exportPeopleFinancialPdf({
          token,
          person,
          incomes,
          expenses,
          transfers,
        });
      };
      const handleFinancialCsv = () => {
        downloadPeopleFinancialCsv({
          person,
          incomes,
          expenses,
          transfers,
        });
      };
      return [
        {
          label: "Relatorio financeiro (PDF)",
          onSelect: handleFinancialPdf,
          disabled: !canExportFinancial,
        },
        {
          label: "Exportar CSV (financeiro)",
          onSelect: handleFinancialCsv,
          disabled: false,
        },
      ];
    }

    return [
      {
        label: "Sem relatorios disponiveis",
        onSelect: () => {},
        disabled: true,
      },
    ];
  }, [
    value,
    canExportFamily,
    canExportFinancial,
    data,
    token,
    person,
    incomeSummary,
    householdProfile,
    householdAssets,
    personAssetsByMember,
    incomeContributorIds,
    incomes,
    expenses,
    transfers,
  ]);

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 px-3 text-xs"
          >
            <FileText className="size-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">Relatorios</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
            {value === "familia"
              ? "Familia"
              : value === "financeiro"
              ? "Financeiro"
              : "Relatorios"}
          </DropdownMenuLabel>
          {reportItems.map((item, index) => (
            <Fragment key={item.label}>
              <DropdownMenuItem
                onSelect={item.onSelect}
                disabled={item.disabled}
              >
                {item.label}
              </DropdownMenuItem>
              {index < reportItems.length - 1 ? (
                <DropdownMenuSeparator />
              ) : null}
            </Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
