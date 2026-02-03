import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AUTH_STORAGE_KEY = "autotest.auth";
const DEFAULT_ACCOUNT_STORAGE_KEY = "autotest.default_account_id";
const GOOGLE_OAUTH_STATE_KEY = "autotest.google_oauth_state";
const GOOGLE_REDIRECT_PATH = "/auth/callback";
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

export type GoogleSSOResult = {
  ok: boolean;
  message: string;
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
  initiateGoogleSSO: () => Promise<GoogleSSOResult>;
  completeGoogleSSO: (code: string, state: string) => Promise<GoogleSSOResult>;
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

const getGoogleRedirectUri = () => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${GOOGLE_REDIRECT_PATH}`;
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

  const initiateGoogleSSO = useCallback(async (): Promise<GoogleSSOResult> => {
    if (typeof window === "undefined") {
      return { ok: false, message: "Google SSO is not available." };
    }
    const state = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    window.sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
    try {
      const params = new URLSearchParams({
        redirect_uri: getGoogleRedirectUri(),
        state,
      });
      const response = await fetch(`${BASE_API_URL}/v1.0/auth/google?${params}`);

      if (!response.ok) {
        let errorDetail = "Failed to initiate Google SSO.";
        try {
          const error = (await response.json()) as { detail?: string };
          errorDetail = error.detail ?? errorDetail;
        } catch {
          // Ignore JSON parse errors, fall back to default message.
        }
        return { ok: false, message: errorDetail };
      }

      const data = (await response.json()) as { auth_url?: string };
      if (!data?.auth_url) {
        return { ok: false, message: "Missing Google authorization URL." };
      }

      window.location.href = data.auth_url;
      return { ok: true, message: "Redirecting to Google..." };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initiate Google SSO.";
      return { ok: false, message };
    }
  }, []);

  const completeGoogleSSO = useCallback(
    async (code: string, state: string): Promise<GoogleSSOResult> => {
      if (typeof window === "undefined") {
        return { ok: false, message: "Google SSO is not available." };
      }

      const savedState = window.sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
      if (!savedState || savedState !== state) {
        window.sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
        return { ok: false, message: "Invalid state parameter." };
      }
      window.sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);

      try {
        const response = await fetch(`${BASE_API_URL}/v1.0/auth/google/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: getGoogleRedirectUri(),
            state,
          }),
        });

        if (!response.ok) {
          let errorDetail = "Authentication failed.";
          try {
            const error = (await response.json()) as { detail?: string };
            errorDetail = error.detail ?? errorDetail;
          } catch {
            // Ignore JSON parse errors, fall back to default message.
          }
          return { ok: false, message: errorDetail };
        }

        const data = (await response.json()) as {
          access_token?: string;
          expiresAt?: string | null;
          expires_at?: string | null;
          user?: { team_member_status?: string | null };
        };

        if (!data?.access_token) {
          return { ok: false, message: "Missing access token." };
        }

        if (data.user?.team_member_status === "rejected") {
          return {
            ok: false,
            message: "Your invitation was rejected. Please contact support.",
          };
        }

        const expiresAt = data.expiresAt ?? data.expires_at ?? null;
        setAuthFromToken(data.access_token, expiresAt);
        return { ok: true, message: "Signed in successfully." };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Authentication failed.";
        return { ok: false, message };
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
      initiateGoogleSSO,
      completeGoogleSSO,
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
      initiateGoogleSSO,
      completeGoogleSSO,
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
