import { useParams } from "react-router-dom";
import { LeftRail } from "@/components/LeftRail";
import { RunCanvasView } from "@/components/RunCanvasView";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RunCanvas() {
  const { runId, suiteId } = useParams<{ runId: string; suiteId?: string }>();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem="runs" />
        <main className="flex-1 canvas-bg overflow-hidden">
          <RunCanvasView runId={runId} suiteId={suiteId} />
        </main>
      </div>
    </TooltipProvider>
  );
}
