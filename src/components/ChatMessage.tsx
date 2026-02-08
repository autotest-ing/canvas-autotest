import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatToolResult } from "./ChatToolResult";
import { ChatSuiteCard } from "./ChatSuiteCard";
import { ChatHintButtons } from "./ChatHintButtons";
import type { ChatMessage as ChatMessageType } from "@/hooks/use-chat";
import type { HintButton } from "@/lib/api/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  onHintAction?: (button: HintButton) => void;
}

export function ChatMessage({ message, onHintAction }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Extract suite cards from tool results
  const suiteResults = message.toolResults.filter(
    (tr) =>
      tr.result.success &&
      tr.result.data &&
      (tr.tool === "create_suite" || tr.tool === "get_suite_full") &&
      typeof tr.result.data === "object" &&
      tr.result.data !== null &&
      "id" in (tr.result.data as Record<string, unknown>)
  );

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] space-y-2",
          isUser && "flex flex-col items-end"
        )}
      >
        {/* Message bubble */}
        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-md"
                : "bg-card shadow-soft rounded-tl-md"
            )}
          >
            <MessageContent content={message.content} />
          </div>
        )}

        {/* Tool calls/results */}
        {message.toolCalls.length > 0 && (
          <div className="space-y-1.5 w-full">
            {message.toolCalls.map((tc, i) => (
              <ChatToolResult
                key={i}
                toolCall={tc}
                toolResult={message.toolResults[i]}
              />
            ))}
          </div>
        )}

        {/* Suite cards */}
        {suiteResults.map((sr, i) => {
          const data = sr.result.data as Record<string, unknown>;
          return (
            <ChatSuiteCard
              key={`suite-${i}`}
              suiteId={data.id as string}
              suiteName={data.name as string}
              testCaseCount={
                Array.isArray(data.test_cases)
                  ? (data.test_cases as unknown[]).length
                  : undefined
              }
            />
          );
        })}

        {/* Streaming indicator */}
        {message.isStreaming && !message.content && message.toolCalls.length === 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-card shadow-soft rounded-tl-md">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Hint buttons */}
        {!message.isStreaming && message.hintButtons.length > 0 && onHintAction && (
          <ChatHintButtons
            buttons={message.hintButtons}
            onAction={onHintAction}
          />
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering: bold, code, bullet points
  const lines = content.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        // Bullet points
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground mt-0.5">&#8226;</span>
              <span><InlineFormat text={line.trim().slice(2)} /></span>
            </div>
          );
        }

        // Headings
        if (line.trim().startsWith("### ")) {
          return <h4 key={i} className="font-semibold text-sm mt-2"><InlineFormat text={line.trim().slice(4)} /></h4>;
        }
        if (line.trim().startsWith("## ")) {
          return <h3 key={i} className="font-semibold mt-2"><InlineFormat text={line.trim().slice(3)} /></h3>;
        }

        return <p key={i}><InlineFormat text={line} /></p>;
      })}
    </div>
  );
}

function InlineFormat({ text }: { text: string }) {
  // Handle **bold** and `code` inline formatting
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
