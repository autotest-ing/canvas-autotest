import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const { loginWithMagicLink, isLoading } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-muted/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-background p-10 text-center shadow-2xl">
        <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Sign in with your magic link to continue.
        </p>

        <div className="mt-10">
          <Button
            type="button"
            onClick={loginWithMagicLink}
            className={cn(
              "h-14 w-full rounded-full bg-[hsl(175,35%,50%)] text-base font-medium text-white hover:bg-[hsl(175,35%,45%)]",
              isLoading && "pointer-events-none"
            )}
          >
            {isLoading ? (
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            ) : (
              <Mail className="mr-3 h-5 w-5" />
            )}
            {isLoading ? "Sending magic link..." : "Login with magic link"}
          </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          By proceeding, you agree to the Terms and CSA.
        </p>
      </div>
    </div>
  );
}
