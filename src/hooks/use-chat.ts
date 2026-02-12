import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  sendChatMessage,
  fetchConversationMessages,
  type ChatSSEEvent,
  type ChatHistoryMessage,
  type HintButton,
  type ConversationMessage,
} from "@/lib/api/chat";

export type ToolCallEvent = {
  tool: string;
  args: Record<string, unknown>;
};

export type ToolResultEvent = {
  tool: string;
  result: { success: boolean; data?: unknown; error?: string };
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls: ToolCallEvent[];
  toolResults: ToolResultEvent[];
  hintButtons: HintButton[];
  isStreaming: boolean;
};

export type UseChat = {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  conversationTitle: string | null;
  agentMode: boolean;
  setAgentMode: (enabled: boolean) => void;
  sendMessage: (text: string, attachedFile?: File | null) => Promise<void>;
  handleHintAction: (button: HintButton) => void;
  clearMessages: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  onConversationCreated?: (id: string, title: string) => void;
  setConversationId: (id: string | null) => void;
};

let msgCounter = 0;
function nextId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

export function useChat(options?: {
  onConversationStarted?: (id: string) => void;
  onConversationCreated?: (id: string, title: string) => void;
}): UseChat {
  const { token, currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [agentMode, setAgentMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const buildHistory = useCallback((msgs: ChatMessage[]): ChatHistoryMessage[] => {
    return msgs.map((m) => {
      const histMsg: ChatHistoryMessage = {
        role: m.role,
        content: m.content,
      };

      if (m.role === "assistant" && m.toolCalls.length > 0) {
        histMsg.tool_calls = m.toolCalls.map((tc, i) => ({
          id: `tc_${i}`,
          name: tc.tool,
          args: tc.args,
        }));
        histMsg.tool_results = m.toolResults.map((tr, i) => ({
          tool: tr.tool,
          tool_call_id: `tc_${i}`,
          result: tr.result,
        }));
      }

      return histMsg;
    });
  }, []);

  const loadConversation = useCallback(
    async (convId: string) => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      setConversationId(convId);

      try {
        const { items } = await fetchConversationMessages(token, convId);
        const loaded: ChatMessage[] = items.map((msg: ConversationMessage) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          toolCalls: msg.tool_calls ?? [],
          toolResults: msg.tool_results ?? [],
          hintButtons: msg.hint_buttons ?? [],
          isStreaming: false,
        }));
        setMessages(loaded);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversation");
      } finally {
        setIsLoading(false);
      }
    },
    [token],
  );

  const sendMessage = useCallback(
    async (text: string, attachedFile?: File | null) => {
      if (!token || !currentUser?.default_account_id) return;
      if (!text.trim() && !attachedFile) return;

      setError(null);
      setIsLoading(true);

      // Read file content if provided
      let fileContent: string | null = null;
      let fileName: string | null = null;
      if (attachedFile) {
        try {
          fileContent = await attachedFile.text();
          fileName = attachedFile.name;
        } catch {
          setError("Failed to read attached file");
          setIsLoading(false);
          return;
        }
      }

      // Add user message
      const userMsg: ChatMessage = {
        id: nextId(),
        role: "user",
        content: text.trim(),
        toolCalls: [],
        toolResults: [],
        hintButtons: [],
        isStreaming: false,
      };

      const assistantId = nextId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        toolCalls: [],
        toolResults: [],
        hintButtons: [],
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      // Build history from previous messages (not including the new ones)
      const previousMessages = messages;
      const history = buildHistory(previousMessages);

      const abortController = new AbortController();
      abortRef.current = abortController;

      // Track conversation_id received from SSE
      let receivedConversationId = conversationId;

      const handleEvent = (event: ChatSSEEvent) => {
        if (event.type === "conversation_id") {
          receivedConversationId = event.conversation_id;
          setConversationId(event.conversation_id);
          return;
        }

        if (event.type === "title_update") {
          const title = (event as { type: "title_update"; title: string }).title;
          setConversationTitle(title);
          if (receivedConversationId) {
            options?.onConversationCreated?.(receivedConversationId, title);
          }
          return;
        }

        setMessages((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((m) => m.id === assistantId);
          if (idx === -1) return prev;

          const current = { ...updated[idx] };

          switch (event.type) {
            case "text":
              current.content += event.content;
              break;

            case "tool_call":
              current.toolCalls = [
                ...current.toolCalls,
                { tool: event.tool, args: event.args },
              ];
              break;

            case "tool_result":
              current.toolResults = [
                ...current.toolResults,
                { tool: event.tool, result: event.result },
              ];
              break;

            case "hint_buttons":
              current.hintButtons = event.buttons;
              break;

            case "error":
              current.content += `\n\n**Error:** ${event.content}`;
              break;

            case "done":
              current.isStreaming = false;
              if (receivedConversationId) {
                options?.onConversationStarted?.(receivedConversationId);
              }
              break;
          }

          updated[idx] = current;
          return updated;
        });
      };

      try {
        await sendChatMessage({
          message: text.trim(),
          history,
          accountId: currentUser.default_account_id,
          token,
          conversationId,
          attachedFile: fileContent,
          attachedFileName: fileName,
          agentMode,
          onEvent: handleEvent,
          signal: abortController.signal,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const msg = err instanceof Error ? err.message : "Chat request failed";
          setError(msg);
          // Mark assistant message as done with error
          setMessages((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((m) => m.id === assistantId);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                content: updated[idx].content + `\n\n**Error:** ${msg}`,
                isStreaming: false,
              };
            }
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [token, currentUser, messages, buildHistory, conversationId, agentMode, options],
  );

  const handleHintAction = useCallback(
    (button: HintButton) => {
      if (button.action === "prompt" && button.text) {
        void sendMessage(button.text);
      } else if (button.action === "navigate" && button.href) {
        window.location.href = button.href;
      }
    },
    [sendMessage],
  );

  const clearMessages = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setMessages([]);
    setConversationId(null);
    setConversationTitle(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    conversationTitle,
    agentMode,
    setAgentMode,
    sendMessage,
    handleHintAction,
    clearMessages,
    loadConversation,
    setConversationId,
  };
}
