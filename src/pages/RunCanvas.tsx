import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { LeftRail } from "@/components/LeftRail";
import { RunCanvasView } from "@/components/RunCanvasView";
import { TooltipProvider } from "@/components/ui/tooltip";

type RunCanvasLocationState = {
  variables?: Record<string, unknown>;
};

export default function RunCanvas() {
  const { runId, suiteId } = useParams<{ runId: string; suiteId?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const environmentId = searchParams.get("environmentId") ?? undefined;
  const variables = (location.state as RunCanvasLocationState | null)?.variables;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem="runs" />
        <main className="flex-1 canvas-bg overflow-hidden">
          <RunCanvasView
            runId={runId}
            suiteId={suiteId}
            environmentId={environmentId}
            variables={variables}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}
