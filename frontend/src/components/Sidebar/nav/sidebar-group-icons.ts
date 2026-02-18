"use client";

import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  FileBarChart,
  Globe,
  HandCoins,
  LayoutDashboard,
  Package,
  Settings,
  Workflow,
  Activity,
  Boxes,
  Target,
  Landmark,
} from "lucide-react";
import { NAV_GROUPS } from "@/modules/nav/groups";

const GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  [NAV_GROUPS.PAINEL]: LayoutDashboard,
  [NAV_GROUPS.GESTAO]: Building2,
  [NAV_GROUPS.OPERACOES]: Target,
  [NAV_GROUPS.INSTITUCIONAL]: Building2,
  [NAV_GROUPS.FINANCEIRO]: Landmark,
  [NAV_GROUPS.RECURSOS]: Boxes,
  [NAV_GROUPS.EDUCACAO]: BookOpen,
  [NAV_GROUPS.RELATORIOS]: FileBarChart,
  [NAV_GROUPS.ADMINISTRACAO]: Settings,
  [NAV_GROUPS.PORTAIS]: Globe,
  [NAV_GROUPS.ASSINATURA]: BadgeCheck,
};

export function resolveNavGroupIcon(label: string): LucideIcon {
  return GROUP_ICON_BY_LABEL[label] ?? Workflow;
}
