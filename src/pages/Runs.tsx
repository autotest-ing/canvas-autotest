import { useState } from "react";
import { LeftRail } from "@/components/LeftRail";
import { RunView } from "@/components/RunView";
import { TooltipProvider } from "@/components/ui/tooltip";

const Runs = () => {
  const [activeItem, setActiveItem] = useState("runs");

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
        <main className="flex-1 canvas-bg">
          <RunView runId="run-42" />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Runs;
