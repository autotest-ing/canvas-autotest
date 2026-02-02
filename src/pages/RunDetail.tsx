import { useParams } from "react-router-dom";
import { LeftRail } from "@/components/LeftRail";
import { RunView } from "@/components/RunView";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RunDetail() {
  const { runId, suiteId } = useParams<{ runId: string; suiteId?: string }>();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem="runs" />
        <main className="flex-1 canvas-bg">
          <RunView runId={runId} suiteId={suiteId} />
        </main>
      </div>
    </TooltipProvider>
  );
}
