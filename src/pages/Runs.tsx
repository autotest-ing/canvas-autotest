import { useState } from "react";
import { useParams } from "react-router-dom";
import { LeftRail } from "@/components/LeftRail";
import { AuthGate } from "@/components/AuthGate";
import { RunsListView } from "@/components/RunsListView";
import { TooltipProvider } from "@/components/ui/tooltip";

const Runs = () => {
  const { suiteId } = useParams<{ suiteId?: string }>();
  const [activeItem, setActiveItem] = useState("runs");

  return (
    <TooltipProvider>
      <AuthGate>
        <div className="flex min-h-screen w-full">
          <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
          <main className="flex-1 canvas-bg">
            <RunsListView suiteId={suiteId} />
          </main>
        </div>
      </AuthGate>
    </TooltipProvider>
  );
};

export default Runs;
