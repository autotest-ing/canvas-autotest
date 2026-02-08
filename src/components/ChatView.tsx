import { ChatMessageList } from "./ChatMessageList";
import { PromptInput } from "./PromptInput";
import { MobileBottomSpacer } from "./LeftRail";
import type { UseChat } from "@/hooks/use-chat";

interface ChatViewProps {
  chat: UseChat;
}

export function ChatView({ chat }: ChatViewProps) {
  return (
    <div className="flex flex-col h-screen">
      <ChatMessageList
        messages={chat.messages}
        onHintAction={chat.handleHintAction}
      />

      <div className="flex-shrink-0 px-4 md:px-8 pb-4 pt-2">
        <div className="max-w-2xl mx-auto">
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
