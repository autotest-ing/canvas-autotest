import { PromptInput } from "./PromptInput";
import { ChatView } from "./ChatView";
import { MobileBottomSpacer } from "./LeftRail";
import { Sparkles } from "lucide-react";
import { useChat } from "@/hooks/use-chat";

export function HomeCanvas() {
  const chat = useChat();

  // Show hero prompt when no messages exist
  if (chat.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 min-h-screen animate-fade-in">
        <div className="w-full max-w-2xl animate-fade-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI-powered API testing</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
              What do you want to test today?
            </h1>
            <p className="text-lg text-muted-foreground">
              Describe your testing goal and I'll create a plan
            </p>
          </div>
          <PromptInput
            onSubmit={chat.sendMessage}
            isLoading={chat.isLoading}
          />
        </div>
        <MobileBottomSpacer />
      </div>
    );
  }

  // Show chat view when messages exist
  return <ChatView chat={chat} />;
}
