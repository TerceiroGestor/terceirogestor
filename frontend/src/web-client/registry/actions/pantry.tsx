"use client";

import {
  PantryDonorsClientPage,
  PantryEntriesClientPage,
  PantryExitsClientPage,
  PantryItemsClientPage,
  PantryOverviewClientPage,
  PantryStockClientPage,
} from "@/modules/pantry";
import { PantryEntryCreateClientPage } from "@/modules/pantry/features/entries/ui/pantry-entry-create-client-page";
import { PantryExitSheetPage } from "@/modules/pantry/features/exits/ui/pantry-exit-sheet-page";
import { PantryHistoryClientPage } from "@/modules/pantry/features/history/ui/pantry-history-client-page";
import {
  PantryItemEditClientPage,
  PantryItemNewClientPage,
} from "@/modules/pantry/features/items/ui/pantry-item-detail-client-page";
import { PantryHeaderNav } from "@/modules/pantry/shared/ui/pantry-header-nav";
import type { WindowAction } from "@/web-client/registry/types";

export const pantryOverviewAction: WindowAction = {
  id: "pantry.overview",
  title: "Painel",
  breadcrumbs: [{ label: "Despensa", href: "/pantry" }],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryOverviewClientPage />,
};

export const pantryItemsAction: WindowAction = {
  id: "pantry.items",
  title: "Itens",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "Itens", href: "/pantry/items" },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryItemsClientPage />,
};

export const pantryStockAction: WindowAction = {
  id: "pantry.stock",
  title: "Estoque",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "Estoque", href: "/pantry/stock" },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryStockClientPage />,
};

export const pantryItemsCreateAction: WindowAction = {
  id: "pantry.items.new",
  title: "Novo alimento",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "Itens", href: "/pantry/items" },
  ],
  permissions: ["pantry.create"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryItemNewClientPage />,
};

export const pantryItemsDetailAction: WindowAction = {
  id: "pantry.items.detail",
  title: "Alimento",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "Itens", href: "/pantry/items" },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryItemEditClientPage />,
};

export const pantryEntriesAction: WindowAction = {
  id: "pantry.entries",
  title: "Entradas",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "Entradas", href: "/pantry/entries" },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryEntriesClientPage />,
};

export const pantryEntriesCreateAction: WindowAction = {
  id: "pantry.entries.new",
  title: "Nova entrada",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "Entradas", href: "/pantry/entries" },
  ],
  permissions: ["pantry.create"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryEntryCreateClientPage />,
};

export const pantryExitsAction: WindowAction = {
  id: "pantry.exits",
  title: "Saídas",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "Saídas", href: "/pantry/exits" },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryExitsClientPage />,
};

export const pantryExitSheetAction: WindowAction = {
  id: "pantry.exit",
  title: "Registrar saída",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "Registrar saída", href: "/pantry/exit" },
  ],
  permissions: ["pantry.create"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryExitSheetPage />,
};

export const pantryDonorsAction: WindowAction = {
  id: "pantry.donors",
  title: "Doadores",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "Doadores", href: "/pantry/donors" },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryDonorsClientPage />,
};

export const pantryHistoryAction: WindowAction = {
  id: "pantry.history",
  title: "Histórico",
  breadcrumbs: [
    { label: "Despensa", href: "/pantry" },
    { label: "Histórico", href: "/pantry/history" },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryHistoryClientPage />,
};

