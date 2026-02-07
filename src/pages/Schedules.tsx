import { TooltipProvider } from "@/components/ui/tooltip";
import { LeftRail, MobileBottomSpacer } from "@/components/LeftRail";
import { AuthGate } from "@/components/AuthGate";
import { SchedulesListView } from "@/components/SchedulesListView";

export default function Schedules() {
  return (
    <TooltipProvider>
      <AuthGate>
        <div className="min-h-screen flex bg-background">
          <LeftRail activeItem="schedules" />
          <main className="flex-1 ml-16 md:ml-16">
            <SchedulesListView />
            <MobileBottomSpacer />
          </main>
        </div>
      </AuthGate>
    </TooltipProvider>
  );
}
