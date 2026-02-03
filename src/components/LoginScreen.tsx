import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, type MagicLinkRequestResult } from "@/context/AuthContext";

export function LoginScreen() {
  const { loginWithMagicLink, initiateGoogleSSO, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [messageStatus, setMessageStatus] = useState<MagicLinkRequestResult["status"] | null>(
    null
  );
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const trimmedEmail = email.trim();
  const isEmailEmpty = trimmedEmail.length === 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const showEmailError = !isEmailEmpty && !isEmailValid;
  const isConfirmationVisible = Boolean(confirmationMessage);
  const isConfirmationError = messageStatus === "error";

  const handleMagicLinkLogin = async () => {
    const result = await loginWithMagicLink(email);
    setConfirmationMessage(result.message);
    setMessageStatus(result.status);
  };

  const handleGoogleLogin = async () => {
    setGoogleError(null);
    setIsGoogleLoading(true);
    const result = await initiateGoogleSSO();
    if (!result.ok) {
      setGoogleError(result.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-muted/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-background p-10 text-center shadow-2xl">
        <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>

        <div className="mt-10 space-y-4">
          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            className="h-14 w-full rounded-full border-border bg-background text-base font-medium text-foreground hover:bg-accent"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
          </Button>
          {googleError ? (
            <p className="text-left text-sm text-destructive">{googleError}</p>
          ) : null}

          {/* OR Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isConfirmationVisible}
            className="h-14 w-full rounded-full border-border bg-background px-5 text-base"
          />
          {showEmailError ? (
            <p className="text-left text-sm text-destructive">
              Please enter a valid email address.
            </p>
          ) : null}
          {isConfirmationVisible ? (
            <p
              className={`text-left text-sm ${
                isConfirmationError ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {confirmationMessage}
            </p>
          ) : null}

          {/* Email Button */}
          <Button
            type="button"
            onClick={handleMagicLinkLogin}
            className="h-14 w-full rounded-full bg-foreground text-base font-medium text-background hover:bg-foreground/90"
            disabled={isLoading || isGoogleLoading || !isEmailValid || isConfirmationVisible}
          >
            {isLoading ? (
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            ) : (
              <Mail className="mr-3 h-5 w-5" />
            )}
            {isLoading ? "Sending..." : "Continue with Email"}
          </Button>
        </div>

        {/* Terms */}
        <p className="mt-4 text-sm text-muted-foreground">
          By proceeding, you agree to the{" "}
          <a href="#" className="underline underline-offset-2 hover:text-foreground">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-2 hover:text-foreground">
            CSA
          </a>
          .
        </p>
      </div>
    </div>
  );
}
