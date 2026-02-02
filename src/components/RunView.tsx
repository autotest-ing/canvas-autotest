import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { StepTimeline, type Step } from "./StepTimeline";
import { StepCanvas } from "./StepCanvas";
import { AIFixCard } from "./AIFixCard";
import { Breadcrumbs } from "./Breadcrumbs";
import { MobileBottomSpacer } from "./LeftRail";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import { toast } from "sonner";

const mockSteps: Step[] = [
  { id: "1", name: "Login", status: "success", duration: "245ms" },
  { id: "2", name: "Get user profile", status: "success", duration: "189ms" },
  { id: "3", name: "List products", status: "success", duration: "312ms" },
  { id: "4", name: "Add to cart", status: "success", duration: "156ms" },
  { id: "5", name: "Create order", status: "failure", duration: "1.2s" },
  { id: "6", name: "Get order status", status: "skipped" },
  { id: "7", name: "Process payment", status: "skipped" },
  { id: "8", name: "Confirm order", status: "skipped" },
];

// Mock data linking runs to suites
const mockRunData = {
  runId: "run-42",
  suiteName: "Auth Suite",
  suiteId: "auth-suite",
  startedAt: "2024-01-15T10:30:00Z",
  duration: "2.1s",
};

interface RunViewProps {
  runId?: string;
  suiteId?: string;
}

export function RunView({ runId, suiteId }: RunViewProps) {
  const navigate = useNavigate();
  const firstFailedStep = mockSteps.find(s => s.status === "failure");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    firstFailedStep?.id || mockSteps[0]?.id || null
  );
  const [showAIFix, setShowAIFix] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const selectedStep = mockSteps.find(s => s.id === selectedStepId) || null;
  
  // Build breadcrumbs based on context
  const breadcrumbItems = suiteId
    ? [
        { label: "Suites", href: "/suites" },
        { label: mockRunData.suiteName, href: `/suites/${suiteId}` },
        { label: "Runs", href: `/suites/${suiteId}/runs` },
        { label: runId || mockRunData.runId },
      ]
    : [
        { label: "Runs", href: "/runs" },
        { label: runId || mockRunData.runId },
      ];

  const handleFixWithAI = () => {
    setShowAIFix(true);
  };

  const handleApplyFix = () => {
    setShowAIFix(false);
    toast.success("Fix applied successfully", {
      description: "The proposed changes have been applied to your codebase.",
    });
  };

  const handleApplyAndRerun = () => {
    setShowAIFix(false);
    toast.success("Fix applied, rerunning tests...", {
      description: "The changes have been applied. Running test suite.",
    });
  };

  const handleDismissFix = () => {
    setShowAIFix(false);
  };

  const handleSelectStep = (id: string) => {
    setSelectedStepId(id);
    setShowAIFix(false);
    setMobileListOpen(false);
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col animate-fade-in">
        {/* Breadcrumb header */}
        <div className="px-4 pt-4 pb-2">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Mobile header with list toggle */}
        <div className="px-4 pb-4 border-b border-border/50 flex items-center gap-2">
          <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <List className="w-4 h-4" />
                Steps
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <StepTimeline
                steps={mockSteps}
                selectedId={selectedStepId}
                onSelect={handleSelectStep}
              />
            </SheetContent>
          </Sheet>
          <span className="text-sm text-muted-foreground">
            {selectedStep?.name || "Select a step"}
          </span>
        </div>

        {/* AI Fix Card */}
        {showAIFix && selectedStep && (
          <div className="p-4 border-b border-border/50">
            <AIFixCard
              stepName={selectedStep.name}
              onApply={handleApplyFix}
              onApplyAndRerun={handleApplyAndRerun}
              onDismiss={handleDismissFix}
            />
          </div>
        )}

        {/* Step Canvas */}
        <div className="flex-1">
          <StepCanvas
            step={selectedStep}
            onFixWithAI={handleFixWithAI}
          />
        </div>
        <MobileBottomSpacer />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen animate-fade-in flex flex-col">
      {/* Breadcrumb header */}
      <div className="px-6 py-3 border-b border-border/50">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <StepTimeline
              steps={mockSteps}
              selectedId={selectedStepId}
              onSelect={handleSelectStep}
            />
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/30 transition-colors" />
          <ResizablePanel defaultSize={75} minSize={50}>
            <div className="h-full flex flex-col">
              {showAIFix && selectedStep && (
                <div className="p-4 border-b border-border/50">
                  <AIFixCard
                    stepName={selectedStep.name}
                    onApply={handleApplyFix}
                    onApplyAndRerun={handleApplyAndRerun}
                    onDismiss={handleDismissFix}
                  />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <StepCanvas
                  step={selectedStep}
                  onFixWithAI={handleFixWithAI}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
