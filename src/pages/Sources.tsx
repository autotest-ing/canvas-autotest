import { useState } from "react";
import { LeftRail } from "@/components/LeftRail";
import { AuthGate } from "@/components/AuthGate";
import { SourcesView } from "@/components/SourcesView";
import { TooltipProvider } from "@/components/ui/tooltip";

const Sources = () => {
  const [activeItem, setActiveItem] = useState("sources");

  return (
    <TooltipProvider>
      <AuthGate>
        <div className="flex min-h-screen w-full">
          <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
          <main className="flex-1 canvas-bg">
            <SourcesView />
          </main>
        </div>
      </AuthGate>
    </TooltipProvider>
  );
};

export default Sources;
