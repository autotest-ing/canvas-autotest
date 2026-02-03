import { useState } from "react";
import { LeftRail } from "@/components/LeftRail";
import { AuthGate } from "@/components/AuthGate";
import { IntegrationsView } from "@/components/IntegrationsView";
import { TooltipProvider } from "@/components/ui/tooltip";

const Integrations = () => {
  const [activeItem, setActiveItem] = useState("integrations");

  return (
    <TooltipProvider>
      <AuthGate>
        <div className="flex min-h-screen w-full">
          <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
          <main className="flex-1 canvas-bg">
            <IntegrationsView />
          </main>
        </div>
      </AuthGate>
    </TooltipProvider>
  );
};

export default Integrations;
