"use client";

import { PantryHistoryClientPage } from "@/modules/pantry/features/history/ui/pantry-history-client-page";
import type { WindowAction } from "@/web-client/registry/types";

export const pantryHistoryAction: WindowAction = {
  id: "pantry.history",
  title: "HistÃ³rico",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "HistÃ³rico", href: "/pantry/history" },
  ],
  permissions: ["pantry.read"],
  render: () => <PantryHistoryClientPage />,
};

