import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { PromptInput } from "./PromptInput";
import { ChatView } from "./ChatView";
import { ChatHistorySidebar } from "./ChatHistorySidebar";
import { MobileBottomSpacer } from "./LeftRail";
import { Sparkles } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useConversations } from "@/hooks/use-conversations";
import { useIsMobile } from "@/hooks/use-mobile";

interface HomeCanvasProps {
  initialConversationId?: string;
}

export function HomeCanvas({ initialConversationId }: HomeCanvasProps) {
  const convState = useConversations();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialLoadDone = useRef(false);
  const autoRunTriggered = useRef(false);

  // Push URL immediately when the backend assigns a conversation_id
  const onConversationStarted = useCallback(
    (id: string) => {
      navigate(`/chat/${id}`, { replace: true });
    },
    [navigate],
  );

  // Add/update the sidebar entry once the title is derived
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

  const chat = useChat({ onConversationStarted, onConversationCreated });

  // Auto-load conversation from URL param on mount
  useEffect(() => {
    if (initialConversationId && !initialLoadDone.current) {
      initialLoadDone.current = true;
      if (location.state?.isNew) {
        chat.setConversationId(initialConversationId);
      } else {
        // If we already have this conversation loaded (e.g. from just creating it), don't reload
        if (chat.conversationId === initialConversationId && chat.messages.length > 0) {
          return;
        }
        void chat.loadConversation(initialConversationId);
      }
    }
  }, [initialConversationId, chat, location.state]);

  // Handle auto-run prompt
  useEffect(() => {
    const autorun = searchParams.get("autorun");
    if (autorun && !autoRunTriggered.current && chat.messages.length === 0) {
      autoRunTriggered.current = true;

      const suiteName = searchParams.get("suiteName");
      const suiteId = searchParams.get("suiteId");
      const envName = searchParams.get("environmentName");

      if (suiteName && suiteId) {
        let message = `Run test suite "${suiteName}" (ID: ${suiteId})`;
        if (envName) {
          message += ` in environment "${envName}"`;
        }
        void chat.sendMessage(message);
      }
    }
  }, [searchParams, chat]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      navigate(`/chat/${id}`);
      void chat.loadConversation(id);
    },
    [chat, navigate],
  );

  const handleNewChat = useCallback(() => {
    chat.clearMessages();
    navigate("/");
  }, [chat, navigate]);

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
        navigate("/");
      }
    },
    [convState, chat, navigate],
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
