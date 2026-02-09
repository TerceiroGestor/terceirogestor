"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  getCurrentUser,
  getTenantProfile,
  type CurrentUserProfile,
  type TenantProfile,
} from "@/features/auth/api";

type CurrentUserContextValue = {
  user: CurrentUserProfile | null;
  tenant: TenantProfile | null;
  permissions: string[];
  roles: string[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const CurrentUserContext = React.createContext<CurrentUserContextValue | null>(
  null,
);

export function CurrentUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useAuth();
  const [user, setUser] = React.useState<CurrentUserProfile | null>(null);
  const [tenant, setTenant] = React.useState<TenantProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!token) {
      setUser(null);
      setTenant(null);
      return;
    }
    setIsLoading(true);
    try {
      const [userProfile, tenantProfile] = await Promise.all([
        getCurrentUser(token),
        getTenantProfile(token),
      ]);
      setUser(userProfile);
      setTenant(tenantProfile);
    } catch {
      setUser(null);
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const permissions = React.useMemo(
    () => user?.permissions ?? [],
    [user?.permissions],
  );
  const roles = React.useMemo(
    () => user?.roles.map((role) => role.name) ?? [],
    [user?.roles],
  );

  const value = React.useMemo<CurrentUserContextValue>(
    () => ({
      user,
      tenant,
      permissions,
      roles,
      isLoading,
      refresh,
    }),
    [user, tenant, permissions, roles, isLoading, refresh],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = React.useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return ctx;
}
