import { LeftRail, MobileBottomSpacer } from "@/components/LeftRail";
import { AuthGate } from "@/components/AuthGate";
import { DeploymentsView } from "@/components/DeploymentsView";

export default function Deployments() {
  return (
    <AuthGate>
      <div className="flex min-h-screen bg-background">
        <LeftRail activeItem="deployments" />
        <DeploymentsView />
        <MobileBottomSpacer />
      </div>
    </AuthGate>
  );
}
