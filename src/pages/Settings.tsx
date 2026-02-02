import { useState } from "react";
import { LeftRail } from "@/components/LeftRail";
import { SettingsView } from "@/components/SettingsView";
import { TooltipProvider } from "@/components/ui/tooltip";

const Settings = () => {
  const [activeItem, setActiveItem] = useState("settings");

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
        <main className="flex-1 canvas-bg">
          <SettingsView />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Settings;
