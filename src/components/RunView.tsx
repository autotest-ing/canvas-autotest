import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { StepTimeline, type Step } from "./StepTimeline";
import { StepCanvas } from "./StepCanvas";
import { AIFixCard } from "./AIFixCard";
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

interface RunViewProps {
  runId?: string;
}

export function RunView({ runId }: RunViewProps) {
  // Default to first failed step, or first step
  const firstFailedStep = mockSteps.find(s => s.status === "failure");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    firstFailedStep?.id || mockSteps[0]?.id || null
  );
  const [showAIFix, setShowAIFix] = useState(false);
  
  const selectedStep = mockSteps.find(s => s.id === selectedStepId) || null;

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

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <StepTimeline
            steps={mockSteps}
            selectedId={selectedStepId}
            onSelect={(id) => {
              setSelectedStepId(id);
              setShowAIFix(false);
            }}
          />
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border/50 hover:bg-primary/30 transition-colors" />
        <ResizablePanel defaultSize={75} minSize={50}>
          <div className="h-full flex flex-col">
            {/* AI Fix Card - shown inline when triggered */}
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
  );
}
