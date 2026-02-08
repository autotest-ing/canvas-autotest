const BASE_API_URL = "https://internal-api.autotest.ing";

export type ChatSSEEvent =
  | { type: "text"; content: string }
  | { type: "tool_call"; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; tool: string; result: { success: boolean; data?: unknown; error?: string } }
  | { type: "hint_buttons"; buttons: HintButton[] }
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
  attachedFile?: string | null;
  attachedFileName?: string | null;
  onEvent: (event: ChatSSEEvent) => void;
  signal?: AbortSignal;
};

export async function sendChatMessage({
  message,
  history,
  accountId,
  token,
  attachedFile,
  attachedFileName,
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
      attached_file: attachedFile ?? null,
      attached_file_name: attachedFileName ?? null,
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
