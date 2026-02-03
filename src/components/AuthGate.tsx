import { LoginScreen } from "@/components/LoginScreen";
import { useAuth } from "@/context/AuthContext";

type AuthGateProps = {
  children: React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {children}
      {!isAuthenticated && <LoginScreen />}
    </>
  );
}
