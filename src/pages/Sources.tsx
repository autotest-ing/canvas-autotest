import { useState } from "react";
import { LeftRail } from "@/components/LeftRail";
import { SourcesView } from "@/components/SourcesView";
import { TooltipProvider } from "@/components/ui/tooltip";

const Sources = () => {
  const [activeItem, setActiveItem] = useState("sources");

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
        <main className="flex-1 canvas-bg">
          <SourcesView />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Sources;
