"use client";

import { PantryHistoryClientPage } from "@/modules/pantry/features/history/ui/pantry-history-client-page";
import {
  PantryItemEditClientPage,
  PantryItemNewClientPage,
} from "@/modules/pantry/features/items/ui/pantry-item-detail-client-page";
import { PantryStockClientPage } from "@/modules/pantry/features/stock/ui/pantry-stock-client-page";
import { PantryDonorsClientPage } from "@/modules/pantry/features/donors/ui/pantry-donors-client-page";
import {
  PantryDonorEditClientPage,
  PantryDonorNewClientPage,
} from "@/modules/pantry/features/donors/ui/pantry-donor-detail-client-page";
import { PantryHeaderNav } from "@/modules/pantry/shared/ui/pantry-header-nav";
import {
  PANTRY_ACTION_IDS,
  PANTRY_ROUTES,
} from "@/modules/pantry/shared/domain/pantry.constants";
import type { WindowAction } from "@/web-client/registry/types";

export const pantryStockAction: WindowAction = {
  id: PANTRY_ACTION_IDS.stock,
  title: "Estoque",
  breadcrumbs: [
    { label: "Despensa", href: PANTRY_ROUTES.root },
    { label: "Estoque", href: PANTRY_ROUTES.stock },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryStockClientPage />,
};

export const pantryItemsCreateAction: WindowAction = {
  id: PANTRY_ACTION_IDS.itemsNew,
  title: "Novo alimento",
  breadcrumbs: [
    { label: "Despensa", href: PANTRY_ROUTES.root },
    { label: "Estoque", href: PANTRY_ROUTES.stock },
  ],
  permissions: ["pantry.create"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryItemNewClientPage />,
};

export const pantryItemsDetailAction: WindowAction = {
  id: PANTRY_ACTION_IDS.itemsDetail,
  title: "Alimento",
  breadcrumbs: [
    { label: "Despensa", href: PANTRY_ROUTES.root },
    { label: "Estoque", href: PANTRY_ROUTES.stock },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryItemEditClientPage />,
};

export const pantryDonorsAction: WindowAction = {
  id: PANTRY_ACTION_IDS.donors,
  title: "Doadores",
  breadcrumbs: [
    { label: "Despensa", href: PANTRY_ROUTES.root },
    { label: "Doadores", href: PANTRY_ROUTES.donors },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryDonorsClientPage />,
};

export const pantryDonorsCreateAction: WindowAction = {
  id: PANTRY_ACTION_IDS.donorsNew,
  title: "Novo doador",
  breadcrumbs: [
    { label: "Despensa", href: PANTRY_ROUTES.root },
    { label: "Doadores", href: PANTRY_ROUTES.donors },
  ],
  permissions: ["pantry.create"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryDonorNewClientPage />,
};

export const pantryDonorsDetailAction: WindowAction = {
  id: PANTRY_ACTION_IDS.donorsDetail,
  title: "Doador",
  breadcrumbs: [
    { label: "Despensa", href: PANTRY_ROUTES.root },
    { label: "Doadores", href: PANTRY_ROUTES.donors },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryDonorEditClientPage />,
};

export const pantryHistoryAction: WindowAction = {
  id: PANTRY_ACTION_IDS.history,
  title: "Histórico",
  breadcrumbs: [
    { label: "Despensa", href: PANTRY_ROUTES.root },
    { label: "Histórico", href: PANTRY_ROUTES.history },
  ],
  permissions: ["pantry.read"],
  actionSlot: <PantryHeaderNav />,
  render: () => <PantryHistoryClientPage />,
};
