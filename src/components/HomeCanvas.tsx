import { useCallback } from "react";
import { PromptInput } from "./PromptInput";
import { ChatView } from "./ChatView";
import { ChatHistorySidebar } from "./ChatHistorySidebar";
import { MobileBottomSpacer } from "./LeftRail";
import { Sparkles } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useConversations } from "@/hooks/use-conversations";
import { useIsMobile } from "@/hooks/use-mobile";

export function HomeCanvas() {
  const convState = useConversations();
  const isMobile = useIsMobile();

  const onConversationCreated = useCallback(
    (id: string, title: string) => {
      convState.addOrUpdate({
        id,
        title,
        updated_at: new Date().toISOString(),
      } as any);
    },
    [convState],
  );

  const chat = useChat({ onConversationCreated });

  const handleSelectConversation = useCallback(
    (id: string) => {
      void chat.loadConversation(id);
    },
    [chat],
  );

  const handleNewChat = useCallback(() => {
    chat.clearMessages();
  }, [chat]);

  const handleRename = useCallback(
    async (id: string, title: string) => {
      await convState.renameConversation(id, title);
    },
    [convState],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await convState.deleteConversation(id);
      if (chat.conversationId === id) {
        chat.clearMessages();
      }
    },
    [convState, chat],
  );

  const sidebar = !isMobile && (
    <div className="w-64 border-r border-border flex-shrink-0 h-screen">
      <ChatHistorySidebar
        conversations={convState.conversations}
        activeConversationId={chat.conversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    </div>
  );

  // Show hero prompt when no messages exist
  if (chat.messages.length === 0) {
    return (
      <div className="flex h-screen">
        {sidebar}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
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
      </div>
    );
  }

  // Show chat view when messages exist
  return (
    <div className="flex h-screen">
      {sidebar}
      <div className="flex-1 min-w-0">
        <ChatView chat={chat} />
      </div>
    </div>
  );
}
