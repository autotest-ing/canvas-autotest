import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

type CallbackStatus = "loading" | "success" | "error";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeGoogleSSO } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("Signing you in with Google...");

  const code = useMemo(() => searchParams.get("code")?.trim() ?? "", [searchParams]);
  const state = useMemo(() => searchParams.get("state")?.trim() ?? "", [searchParams]);
  const error = useMemo(() => searchParams.get("error")?.trim() ?? "", [searchParams]);

  useEffect(() => {
    let timeoutId: number | undefined;
    let isMounted = true;

    const runCallback = async () => {
      if (error) {
        setStatus("error");
        setMessage("Google sign-in was cancelled or failed. Please try again.");
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setMessage("Missing authorization details. Please try again.");
        return;
      }

      setStatus("loading");
      setMessage("Signing you in with Google...");
      const result = await completeGoogleSSO(code, state);
      if (!isMounted) return;

      if (result.ok) {
        setStatus("success");
        setMessage("You're signed in! Redirecting you now...");
        timeoutId = window.setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
        return;
      }

      setStatus("error");
      setMessage(result.message || "Authentication failed. Please try again.");
    };

    runCallback();

    return () => {
      isMounted = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [code, completeGoogleSSO, error, navigate, state]);

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
      <div className="w-full max-w-lg rounded-2xl bg-background p-10 text-center shadow-xl">
        <div className="flex justify-center">
          {isLoading ? (
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          ) : null}
          {isSuccess ? <CheckCircle2 className="h-12 w-12 text-emerald-500" /> : null}
          {isError ? <XCircle className="h-12 w-12 text-destructive" /> : null}
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          {isLoading ? "Signing you in" : null}
          {isSuccess ? "You're signed in" : null}
          {isError ? "Unable to sign in" : null}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">{message}</p>

        {isError ? (
          <div className="mt-8 flex flex-col gap-3">
            <Button onClick={() => navigate("/", { replace: true })} className="w-full">
              Back to home
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AuthCallback;
