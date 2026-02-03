import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AUTH_STORAGE_KEY = "autotest.auth";
const DEFAULT_ACCOUNT_STORAGE_KEY = "autotest.default_account_id";
const BASE_API_URL = "https://internal-api.autotest.ing";

type AuthState = {
  token: string | null;
  expiresAt: string | null;
};

type CurrentUser = {
  email: string;
  first_name: string;
  last_name: string;
  default_account_id: string;
};

export type MagicLinkRequestResult = {
  ok: boolean;
  message: string;
  status: "sent" | "error";
};

type AuthContextValue = {
  token: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: CurrentUser | null;
  isCurrentUserLoading: boolean;
  currentUserError: string | null;
  loginWithMagicLink: (email: string) => Promise<MagicLinkRequestResult>;
  confirmMagicLink: (email: string, token: string) => Promise<MagicLinkRequestResult>;
  setAuthFromToken: (token: string, expiresAt?: string | null) => void;
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

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(`${normalized}${padding}`);
};

const getExpiresAtFromToken = (token: string) => {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const decoded = decodeBase64Url(payload);
    const parsed = JSON.parse(decoded) as { exp?: number };
    if (typeof parsed.exp !== "number") return null;
    return new Date(parsed.exp * 1000).toISOString();
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(getInitialAuthState);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isCurrentUserLoading, setIsCurrentUserLoading] = useState(false);
  const [currentUserError, setCurrentUserError] = useState<string | null>(null);

  const persistState = useCallback((state: AuthState) => {
    setAuthState(state);
    if (typeof window === "undefined") return;
    if (!state.token) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  }, []);

  const logout = useCallback(() => {
    persistState({ token: null, expiresAt: null });
    setCurrentUser(null);
    setCurrentUserError(null);
    setIsCurrentUserLoading(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DEFAULT_ACCOUNT_STORAGE_KEY);
    }
  }, [persistState]);

  const fetchCurrentUser = useCallback(
    async (token: string) => {
      if (!token) return;
      setIsCurrentUserLoading(true);
      setCurrentUserError(null);
      try {
        const response = await fetch(`${BASE_API_URL}/v1.0/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load user profile.");
        }

        const data = (await response.json()) as CurrentUser;
        setCurrentUser(data);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(DEFAULT_ACCOUNT_STORAGE_KEY, data.default_account_id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load user profile.";
        setCurrentUserError(message);
      } finally {
        setIsCurrentUserLoading(false);
      }
    },
    [logout]
  );

  const setAuthFromToken = useCallback(
    (token: string, expiresAt?: string | null) => {
      const derivedExpiresAt = expiresAt ?? getExpiresAtFromToken(token);
      persistState({
        token,
        expiresAt: derivedExpiresAt ?? null,
      });
      void fetchCurrentUser(token);
    },
    [fetchCurrentUser, persistState]
  );

  const loginWithMagicLink = useCallback(async (email: string): Promise<MagicLinkRequestResult> => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { ok: false, status: "error", message: "Email is required." };
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
        status: "sent",
        message: "Please check your email, and follow link to signin.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      return { ok: false, status: "error", message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmMagicLink = useCallback(
    async (email: string, token: string): Promise<MagicLinkRequestResult> => {
      const trimmedEmail = email.trim();
      const trimmedToken = token.trim();
      if (!trimmedEmail || !trimmedToken) {
        return { ok: false, status: "error", message: "Invalid or expired link." };
      }
      setIsLoading(true);
      try {
        const response = await fetch(`${BASE_API_URL}/v1.0/signin/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: trimmedEmail, token: trimmedToken }),
        });

        if (!response.ok) {
          throw new Error("Magic link confirmation failed.");
        }

        const data = (await response.json()) as {
          access_token?: string;
          expiresAt?: string | null;
          expires_at?: string | null;
        };
        if (!data?.access_token) {
          throw new Error("Missing access token.");
        }
        const expiresAt = data.expiresAt ?? data.expires_at ?? null;
        setAuthFromToken(data.access_token, expiresAt);
        return { ok: true, status: "sent", message: "Signed in successfully." };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Login failed.";
        return { ok: false, status: "error", message };
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthFromToken]
  );

  useEffect(() => {
    if (authState.token && isTokenValid(authState.expiresAt)) {
      void fetchCurrentUser(authState.token);
      return;
    }
    setCurrentUser(null);
  }, [authState.expiresAt, authState.token, fetchCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: authState.token,
      expiresAt: authState.expiresAt,
      isAuthenticated: Boolean(authState.token && isTokenValid(authState.expiresAt)),
      isLoading,
      currentUser,
      isCurrentUserLoading,
      currentUserError,
      loginWithMagicLink,
      confirmMagicLink,
      setAuthFromToken,
      logout,
    }),
    [
      authState,
      isLoading,
      currentUser,
      isCurrentUserLoading,
      currentUserError,
      loginWithMagicLink,
      confirmMagicLink,
      setAuthFromToken,
      logout,
    ]
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
