"use client";

import * as React from "react";
import { apiRequest } from "@/lib/api";

type LoginInput = {
  tenantId: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "terceirogestor:token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setToken(stored);
    setIsLoading(false);
  }, []);

  const login = React.useCallback(async (input: LoginInput) => {
    const payload = await apiRequest<{ accessToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    setToken(payload.accessToken);
    window.localStorage.setItem(STORAGE_KEY, payload.accessToken);
  }, []);

  const logout = React.useCallback(() => {
    setToken(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
    }),
    [token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
