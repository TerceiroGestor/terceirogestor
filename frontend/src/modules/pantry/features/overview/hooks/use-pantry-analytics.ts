"use client";

import * as React from "react";
import type {
  PantryConsumptionResponse,
  PantryFlowResponse,
  PantryUsageResponse,
} from "@/modules/pantry/api";
import { getPantryConsumption, getPantryFlow, getPantryUsage } from "@/modules/pantry/api";
import {
  monthEndIso,
  monthStartIso,
  startMonthValue,
} from "@/modules/pantry/features/overview/domain/overview.helpers";

type ConsumptionExitType = "all" | "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";

type UsePantryAnalyticsArgs = {
  token: string | null;
  enabled: boolean;
  authLoading: boolean;
};

export function usePantryAnalytics({ token, enabled, authLoading }: UsePantryAnalyticsArgs) {
  const now = React.useMemo(() => new Date(), []);
  const defaultFromMonth = React.useMemo(
    () => startMonthValue(new Date(now.getFullYear(), now.getMonth() - 11, 1)),
    [now],
  );
  const defaultToMonth = React.useMemo(
    () => startMonthValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    [now],
  );

  const [consumptionView, setConsumptionView] = React.useState<"item" | "group">(
    "item",
  );
  const [consumptionFromMonth, setConsumptionFromMonth] =
    React.useState(defaultFromMonth);
  const [consumptionToMonth, setConsumptionToMonth] =
    React.useState(defaultToMonth);
  const [selectedItemId, setSelectedItemId] = React.useState<string>("all");
  const [selectedGroup, setSelectedGroup] = React.useState<string>("all");

  const [consumption, setConsumption] =
    React.useState<PantryConsumptionResponse | null>(null);
  const [consumptionLoading, setConsumptionLoading] = React.useState(false);
  const [consumptionError, setConsumptionError] = React.useState<string | null>(
    null,
  );

  const [flow, setFlow] = React.useState<PantryFlowResponse | null>(null);
  const [flowError, setFlowError] = React.useState<string | null>(null);

  const [usage, setUsage] = React.useState<PantryUsageResponse | null>(null);
  const [usageError, setUsageError] = React.useState<string | null>(null);

  const [consumptionExitType, setConsumptionExitType] =
    React.useState<ConsumptionExitType>("all");
  const [consumptionEventName, setConsumptionEventName] = React.useState("");

  const loadConsumption = React.useCallback(async () => {
    if (!token || !enabled) return;
    setConsumptionLoading(true);
    setConsumptionError(null);
    setFlowError(null);
    setUsageError(null);

    const from = monthStartIso(consumptionFromMonth);
    const to = monthEndIso(consumptionToMonth) ?? undefined;
    const params = {
      view: consumptionView,
      from,
      to,
      itemId:
        consumptionView === "item" && selectedItemId !== "all"
          ? selectedItemId
          : undefined,
      group:
        consumptionView === "group" && selectedGroup !== "all"
          ? selectedGroup
          : undefined,
      type: consumptionExitType === "all" ? undefined : consumptionExitType,
      eventName: consumptionEventName.trim() ? consumptionEventName.trim() : undefined,
    } as const;

    const [consumptionResult, flowResult, usageResult] = await Promise.allSettled([
      getPantryConsumption(token, params),
      getPantryFlow(token, params),
      getPantryUsage(token, params),
    ]);

    if (consumptionResult.status === "fulfilled") {
      setConsumption(consumptionResult.value);
    } else {
      const err = consumptionResult.reason as { message?: string } | undefined;
      setConsumptionError(err?.message ?? "Falha ao carregar consumo.");
      setConsumption(null);
    }

    if (flowResult.status === "fulfilled") {
      setFlow(flowResult.value);
    } else {
      const err = flowResult.reason as { message?: string } | undefined;
      setFlowError(err?.message ?? "Falha ao carregar fluxo.");
      setFlow(null);
    }

    if (usageResult.status === "fulfilled") {
      setUsage(usageResult.value);
    } else {
      const err = usageResult.reason as { message?: string } | undefined;
      setUsageError(err?.message ?? "Falha ao carregar consumo por tipo.");
      setUsage(null);
    }

    setConsumptionLoading(false);
  }, [
    token,
    enabled,
    consumptionFromMonth,
    consumptionToMonth,
    consumptionView,
    selectedItemId,
    selectedGroup,
    consumptionExitType,
    consumptionEventName,
  ]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !enabled) return;
    loadConsumption();
  }, [authLoading, token, enabled, loadConsumption]);

  return {
    consumption,
    consumptionLoading,
    consumptionError,
    flow,
    flowError,
    usage,
    usageError,

    consumptionView,
    setConsumptionView,
    consumptionFromMonth,
    setConsumptionFromMonth,
    consumptionToMonth,
    setConsumptionToMonth,
    selectedItemId,
    setSelectedItemId,
    selectedGroup,
    setSelectedGroup,
    consumptionExitType,
    setConsumptionExitType,
    consumptionEventName,
    setConsumptionEventName,
    loadConsumption,
  };
}

