import type { BreadcrumbItem } from "@/components/layout/BreadcrumbContext";
import type * as React from "react";
import type { LucideIcon } from "lucide-react";

export type ViewType =
  | "list"
  | "table"
  | "kanban"
  | "form"
  | "timeline"
  | "calendar"
  | "graph";

export type WindowActionView = {
  type: ViewType;
  label: string;
  icon?: LucideIcon;
};

export type WindowAction = {
  id: string;
  title: string;
  breadcrumbs: BreadcrumbItem[];
  permissions?: string[];
  defaultViewType?: ViewType;
  views?: WindowActionView[];
  render: () => React.ReactNode;
};
