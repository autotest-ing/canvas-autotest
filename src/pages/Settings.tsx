import { useState } from "react";
import { LeftRail } from "@/components/LeftRail";
import { AuthGate } from "@/components/AuthGate";
import { SettingsView } from "@/components/SettingsView";
import { TooltipProvider } from "@/components/ui/tooltip";

const Settings = () => {
  const [activeItem, setActiveItem] = useState("settings");

  return (
    <TooltipProvider>
      <AuthGate>
        <div className="flex min-h-screen w-full">
          <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
          <main className="flex-1 canvas-bg">
            <SettingsView />
          </main>
        </div>
      </AuthGate>
    </TooltipProvider>
  );
};

export default Settings;
