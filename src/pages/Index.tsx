import { useState } from "react";
import { useParams } from "react-router-dom";
import { LeftRail } from "@/components/LeftRail";
import { HomeCanvas } from "@/components/HomeCanvas";
import { TooltipProvider } from "@/components/ui/tooltip";

const Index = () => {
  const [activeItem, setActiveItem] = useState("home");
  const { conversationId } = useParams<{ conversationId: string }>();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <LeftRail activeItem={activeItem} onItemClick={setActiveItem} />
        <main className="flex-1 canvas-bg">
          <HomeCanvas initialConversationId={conversationId} />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Index;
