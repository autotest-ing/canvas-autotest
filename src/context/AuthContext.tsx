import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AUTH_STORAGE_KEY = "autotest.auth";
const BASE_API_URL = "https://internal-api.autotest.ing";

type AuthState = {
  token: string | null;
  expiresAt: string | null;
};

type AuthContextValue = {
  token: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithMagicLink: (email: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getInitialAuthState = (): AuthState => {
  if (typeof window === "undefined") {
    return { token: null, expiresAt: null };
  }

  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return { token: null, expiresAt: null };
  }

  try {
    const parsed = JSON.parse(stored) as AuthState;
    return {
      token: parsed.token ?? null,
      expiresAt: parsed.expiresAt ?? null,
    };
  } catch {
    return { token: null, expiresAt: null };
  }
};

const isTokenValid = (expiresAt: string | null) => {
  if (!expiresAt) return false;
  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) return false;
  return Date.now() < expiresAtMs;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(getInitialAuthState);
  const [isLoading, setIsLoading] = useState(false);

  const persistState = useCallback((state: AuthState) => {
    setAuthState(state);
    if (typeof window === "undefined") return;
    if (!state.token) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  }, []);

  const loginWithMagicLink = useCallback(async (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { ok: false, message: "Email is required." };
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/v1.0/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      await response.json();
      return {
        ok: true,
        message: "Please check your email, and follow link to signin.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    persistState({ token: null, expiresAt: null });
  }, [persistState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: authState.token,
      expiresAt: authState.expiresAt,
      isAuthenticated: Boolean(authState.token && isTokenValid(authState.expiresAt)),
      isLoading,
      loginWithMagicLink,
      logout,
    }),
    [authState, isLoading, loginWithMagicLink, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
