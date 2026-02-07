import { LeftRail } from "@/components/LeftRail";
import { TestCasesListView } from "@/components/TestCasesListView";
import { AuthGate } from "@/components/AuthGate";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

export default function TestCases() {
  const isMobile = useIsMobile();

  return (
    <AuthGate>
      <TooltipProvider>
        <div className="flex min-h-screen bg-background">
          <LeftRail activeItem="testcases" />
          <main className={`flex-1 ${isMobile ? 'pb-16' : ''}`}>
            <TestCasesListView />
          </main>
        </div>
      </TooltipProvider>
    </AuthGate>
  );
}
