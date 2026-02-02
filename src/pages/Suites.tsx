import { useState } from "react";
import { useParams } from "react-router-dom";
import { LeftRail } from "@/components/LeftRail";
import { SuiteView } from "@/components/SuiteView";
import { TooltipProvider } from "@/components/ui/tooltip";

const Suites = () => {
  const { suiteId } = useParams<{ suiteId?: string }>();
  const [activeItem, setActiveItem] = useState("suites");

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
        <main className="flex-1 canvas-bg">
          <SuiteView suiteId={suiteId || "auth-suite"} />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Suites;
