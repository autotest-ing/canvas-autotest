import { useState } from "react";
import { LeftRail } from "@/components/LeftRail";
import { HomeCanvas } from "@/components/HomeCanvas";
import { TooltipProvider } from "@/components/ui/tooltip";

const Index = () => {
  const [activeItem, setActiveItem] = useState("home");

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
        <main className="flex-1 canvas-bg">
          <HomeCanvas />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Index;
