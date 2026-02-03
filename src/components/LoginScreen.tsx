import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const { loginWithMagicLink, isLoading } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-muted/80 bg-background/95 p-8 text-center shadow-xl ring-1 ring-muted/60">
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your magic link to continue.
        </p>

        <div className="mt-8">
          <Button
            type="button"
            onClick={loginWithMagicLink}
            className={cn(
              "w-full rounded-full text-base",
              isLoading && "pointer-events-none"
            )}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Sending magic link..." : "Login with magic link"}
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          By proceeding, you agree to the Terms and CSA.
        </p>
      </div>
    </div>
  );
}
