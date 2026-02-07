import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RequestPayload, StepResultHttpResponse } from "@/lib/api/suites";

interface HttpCodePanelProps {
  request?: RequestPayload | null;
  response?: StepResultHttpResponse | null;
  onClose: () => void;
}

function formatHeaders(headers: Record<string, unknown> | null | undefined): string {
  if (!headers || Object.keys(headers).length === 0) return "";
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n");
}

function formatBody(body: unknown): string {
  if (body === null || body === undefined) return "";
  if (typeof body === "string") {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return JSON.stringify(body, null, 2);
}

function RequestBlock({ request }: { request: RequestPayload }) {
  const method = (request.method ?? "GET").toUpperCase();
  const url = request.full_url || request.url || "/";
  const headers = formatHeaders(request.headers);
  const body = formatBody(request.payload);

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Request
      </h4>
      <div className="rounded-md border border-border/60 bg-muted/30 overflow-hidden">
        <div className="px-3 py-2 border-b border-border/40 bg-muted/50">
          <code className="text-xs font-mono">
            <span className="font-semibold text-primary">{method}</span>{" "}
            <span className="text-foreground/80">{url}</span>
          </code>
        </div>
        <div className="max-h-[200px] overflow-auto">
          <pre className="px-3 py-2 text-xs font-mono text-foreground/70 whitespace-pre">
            {headers && (
              <>
                {headers}
                {body && "\n"}
              </>
            )}
            {body && (
              <>
                {headers && "\n"}
                {body}
              </>
            )}
            {!headers && !body && <span className="text-muted-foreground italic">No headers or body</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ResponseBlock({ response }: { response: StepResultHttpResponse }) {
  const statusCode = response.status_code;
  const headers = formatHeaders(response.headers);
  const body = formatBody(response.body ?? response.raw_body);
  const duration = response.duration_ms;

  const statusColor =
    statusCode && statusCode >= 200 && statusCode < 300
      ? "text-emerald-600"
      : statusCode && statusCode >= 400
        ? "text-red-500"
        : "text-amber-500";

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Response
      </h4>
      <div className="rounded-md border border-border/60 bg-muted/30 overflow-hidden">
        <div className="px-3 py-2 border-b border-border/40 bg-muted/50 flex items-center justify-between">
          <code className="text-xs font-mono">
            <span className={`font-semibold ${statusColor}`}>{statusCode ?? "—"}</span>
          </code>
          {duration != null && (
            <span className="text-[10px] text-muted-foreground">{duration}ms</span>
          )}
        </div>
        <div className="max-h-[200px] overflow-auto">
          <pre className="px-3 py-2 text-xs font-mono text-foreground/70 whitespace-pre">
            {headers && (
              <>
                {headers}
                {body && "\n"}
              </>
            )}
            {body && (
              <>
                {headers && "\n"}
                {body}
              </>
            )}
            {!headers && !body && <span className="text-muted-foreground italic">No response body</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function HttpCodePanel({ request, response, onClose }: HttpCodePanelProps) {
  const hasRequest = request && (request.method || request.url || request.full_url || request.headers || request.payload);
  const hasResponse = response != null;

  return (
    <div className="flex flex-col h-full border-l border-border/60 pl-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">HTTP Details</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 pr-1">
        <div className="space-y-4">
          {hasRequest && <RequestBlock request={request} />}
          {hasResponse && <ResponseBlock response={response} />}
          {!hasRequest && !hasResponse && (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              No request or response data available.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
