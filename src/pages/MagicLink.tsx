import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

type MagicLinkStatus = "loading" | "success" | "error";

const MagicLink = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmMagicLink } = useAuth();
  const [status, setStatus] = useState<MagicLinkStatus>("loading");
  const [message, setMessage] = useState("Confirming your magic link...");

  const email = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  useEffect(() => {
    let timeoutId: number | undefined;
    let isMounted = true;

    const runConfirmation = async () => {
      if (!email || !token) {
        setStatus("error");
        setMessage("Invalid or expired link. Please request a new one.");
        return;
      }

      setStatus("loading");
      setMessage("Confirming your magic link...");
      const result = await confirmMagicLink(email, token);
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
      setMessage(result.message || "Invalid or expired link. Please request a new one.");
    };

    runConfirmation();

    return () => {
      isMounted = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [confirmMagicLink, email, navigate, token]);

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
          {isLoading ? "Confirming sign in" : null}
          {isSuccess ? "You're signed in" : null}
          {isError ? "Unable to sign in" : null}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">{message}</p>

        {isError ? (
          <div className="mt-8 flex flex-col gap-3">
            <Button onClick={() => navigate("/")} className="w-full">
              Back to home
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MagicLink;
