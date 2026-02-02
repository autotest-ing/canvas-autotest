import { LeftRail, MobileBottomSpacer } from "@/components/LeftRail";
import { DeploymentsView } from "@/components/DeploymentsView";

export default function Deployments() {
  return (
    <div className="flex min-h-screen bg-background">
      <LeftRail activeItem="deployments" />
      <DeploymentsView />
      <MobileBottomSpacer />
    </div>
  );
}
