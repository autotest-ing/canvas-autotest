import { useState } from "react";
import { LeftRail } from "@/components/LeftRail";
import { NotificationsView } from "@/components/NotificationsView";
import { TooltipProvider } from "@/components/ui/tooltip";

const Notifications = () => {
  const [activeItem, setActiveItem] = useState("notifications");

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
        <main className="flex-1 canvas-bg">
          <NotificationsView />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Notifications;
