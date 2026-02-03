import { useState } from "react";
import { LeftRail } from "@/components/LeftRail";
import { AuthGate } from "@/components/AuthGate";
import { EnvironmentsView } from "@/components/EnvironmentsView";
import { TooltipProvider } from "@/components/ui/tooltip";

const Environments = () => {
  const [activeItem, setActiveItem] = useState("environments");

  return (
    <TooltipProvider>
      <AuthGate>
        <div className="flex min-h-screen w-full">
          <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
          <main className="flex-1 canvas-bg">
            <EnvironmentsView />
          </main>
        </div>
      </AuthGate>
    </TooltipProvider>
  );
};

export default Environments;
