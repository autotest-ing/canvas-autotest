import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { StepTimeline, type Step } from "./StepTimeline";
import { StepCanvas } from "./StepCanvas";

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
  
  const selectedStep = mockSteps.find(s => s.id === selectedStepId) || null;

  const handleFixWithAI = () => {
    console.log("Fix with AI for step:", selectedStepId);
  };

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <StepTimeline
            steps={mockSteps}
            selectedId={selectedStepId}
            onSelect={setSelectedStepId}
          />
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border/50 hover:bg-primary/30 transition-colors" />
        <ResizablePanel defaultSize={75} minSize={50}>
          <StepCanvas
            step={selectedStep}
            onFixWithAI={handleFixWithAI}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
