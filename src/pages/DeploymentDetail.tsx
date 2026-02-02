import { LeftRail, MobileBottomSpacer } from "@/components/LeftRail";
import { DeploymentDetailView } from "@/components/DeploymentDetailView";

export default function DeploymentDetail() {
  return (
    <div className="flex min-h-screen bg-background">
      <LeftRail activeItem="deployments" />
      <DeploymentDetailView />
      <MobileBottomSpacer />
    </div>
  );
}
