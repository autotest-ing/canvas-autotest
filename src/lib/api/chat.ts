const BASE_API_URL = "https://internal-api.autotest.ing";

export type ChatSSEEvent =
  | { type: "text"; content: string }
  | { type: "tool_call"; tool: string; args: Record<string, unknown>; call_id?: string }
  | { type: "tool_result"; tool: string; result: { success: boolean; data?: unknown; error?: string }; call_id?: string }
  | { type: "hint_buttons"; buttons: HintButton[] }
  | { type: "conversation_id"; conversation_id: string }
  | { type: "title_update"; title: string }
  | { type: "done" }
  | { type: "error"; content: string };

export type HintButton = {
  label: string;
  action: "prompt" | "run_suite" | "navigate";
  text?: string;
  args?: Record<string, unknown>;
  href?: string;
};

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
  tool_calls?: Array<{ id: string; name: string; args: Record<string, unknown> }>;
  tool_results?: Array<{ tool: string; tool_call_id: string; result: unknown }>;
};

export type SendChatParams = {
  message: string;
  history: ChatHistoryMessage[];
  accountId: string;
  token: string;
  conversationId?: string | null;
  attachedFile?: string | null;
  attachedFileName?: string | null;
  agentMode?: boolean;
  onEvent: (event: ChatSSEEvent) => void;
  signal?: AbortSignal;
};

export async function sendChatMessage({
  message,
  history,
  accountId,
  token,
  conversationId,
  attachedFile,
  attachedFileName,
  agentMode,
  onEvent,
  signal,
}: SendChatParams): Promise<void> {
  const response = await fetch(`${BASE_API_URL}/v1.0/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
      account_id: accountId,
      conversation_id: conversationId ?? null,
      attached_file: attachedFile ?? null,
      attached_file_name: attachedFileName ?? null,
      agent_mode: agentMode ?? false,
    }),
    signal,
  });

  if (!response.ok) {
    let errorMsg = "Chat request failed";
    try {
      const data = (await response.json()) as { detail?: string };
      if (data.detail) errorMsg = data.detail;
    } catch {
      // ignore
    }
    onEvent({ type: "error", content: errorMsg });
    onEvent({ type: "done" });
    return;
  }

  if (!response.body) {
    onEvent({ type: "error", content: "No response body" });
    onEvent({ type: "done" });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        try {
          const event = JSON.parse(trimmed.slice(6)) as ChatSSEEvent;
          onEvent(event);
        } catch {
          // skip malformed lines
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim().startsWith("data: ")) {
      try {
        const event = JSON.parse(buffer.trim().slice(6)) as ChatSSEEvent;
        onEvent(event);
      } catch {
        // skip
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// --- Conversations API ---

export type Conversation = {
  id: string;
  account_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  tool_calls: Array<{ tool: string; args: Record<string, unknown> }> | null;
  tool_results: Array<{ tool: string; result: { success: boolean; data?: unknown; error?: string } }> | null;
  hint_buttons: HintButton[] | null;
  attached_file_name: string | null;
  sort_order: number;
  created_at: string;
};

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let detail = "Request failed";
    try {
      const body = await res.json();
      if (body.detail) detail = body.detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function fetchConversations(
  token: string,
  accountId: string,
  limit = 50,
  offset = 0,
): Promise<{ items: Conversation[] }> {
  return apiFetch(
    `/v1.0/conversations?account_id=${accountId}&limit=${limit}&offset=${offset}`,
    token,
  );
}

export async function fetchConversationMessages(
  token: string,
  conversationId: string,
): Promise<{ items: ConversationMessage[] }> {
  return apiFetch(`/v1.0/conversations/${conversationId}/messages`, token);
}

export async function renameConversation(
  token: string,
  conversationId: string,
  title: string,
): Promise<Conversation> {
  return apiFetch(`/v1.0/conversations/${conversationId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteConversation(
  token: string,
  conversationId: string,
): Promise<{ deleted: boolean }> {
  return apiFetch(`/v1.0/conversations/${conversationId}`, token, {
    method: "DELETE",
  });
}
