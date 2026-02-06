import { useParams, useSearchParams } from "react-router-dom";
import { LeftRail } from "@/components/LeftRail";
import { RunCanvasView } from "@/components/RunCanvasView";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RunCanvas() {
  const { runId, suiteId } = useParams<{ runId: string; suiteId?: string }>();
  const [searchParams] = useSearchParams();
  const environmentId = searchParams.get("environmentId") ?? undefined;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem="runs" />
        <main className="flex-1 canvas-bg overflow-hidden">
          <RunCanvasView
            runId={runId}
            suiteId={suiteId}
            environmentId={environmentId}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}
