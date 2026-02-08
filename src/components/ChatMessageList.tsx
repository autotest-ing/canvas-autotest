import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/hooks/use-chat";
import type { HintButton } from "@/lib/api/chat";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  onHintAction: (button: HintButton) => void;
}

export function ChatMessageList({ messages, onHintAction }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or content updates
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Only auto-scroll if user is near the bottom
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 200;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4"
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onHintAction={onHintAction}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
