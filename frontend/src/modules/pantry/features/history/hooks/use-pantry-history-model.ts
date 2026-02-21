"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePantryDashboard } from "@/modules/pantry/features/overview/hooks/use-pantry-dashboard";
import type { PantryRecentMovement } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-movements-section";

export function usePantryHistoryModel() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const canRead = permissions.includes("pantry.read");
  const enabled = Boolean(token && isAuthenticated && canRead);

  const dashboard = usePantryDashboard({ token, enabled, authLoading });

  const [editEntryOpen, setEditEntryOpen] = React.useState(false);
  const [editingEntryId, setEditingEntryId] = React.useState<string | null>(null);
  const [editExitOpen, setEditExitOpen] = React.useState(false);
  const [editingExitId, setEditingExitId] = React.useState<string | null>(null);

  const openMovementEdit = React.useCallback((movement: PantryRecentMovement) => {
    if (movement.kind === "ENTRY") {
      const entryId = movement.id.startsWith("entry:")
        ? movement.id.slice("entry:".length)
        : movement.id;
      setEditingEntryId(entryId);
      setEditEntryOpen(true);
      return;
    }

    const exitId = movement.id.startsWith("exit:")
      ? movement.id.slice("exit:".length)
      : movement.id;
    setEditingExitId(exitId);
    setEditExitOpen(true);
  }, []);

  return {
    token,
    canRead,
    loading: dashboard.loading,
    error: dashboard.error,
    recentMovements: dashboard.recentMovements,
    reload: dashboard.loadDashboard,
    openMovementEdit,
    editEntryOpen,
    setEditEntryOpen,
    editingEntryId,
    setEditingEntryId,
    editExitOpen,
    setEditExitOpen,
    editingExitId,
    setEditingExitId,
  };
}

