import { Wrench, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCallEvent, ToolResultEvent } from "@/hooks/use-chat";

interface ChatToolResultProps {
  toolCall: ToolCallEvent;
  toolResult?: ToolResultEvent;
  isStreamEnded?: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  create_suite: "Creating test suite",
  create_test_case: "Creating test case",
  create_test_step: "Creating test step",
  update_test_step: "Updating test step",
  delete_test_step: "Deleting test step",
  run_suite: "Running test suite",
  import_from_curl: "Importing from cURL",
  import_from_postman: "Importing Postman collection",
  create_assertion: "Creating assertion",
  list_suites: "Listing test suites",
  get_suite_full: "Loading suite details",
  list_test_cases: "Listing test cases",
  list_assertions: "Listing assertions",
};

function getToolSummary(toolResult: ToolResultEvent): string {
  if (!toolResult.result.success) {
    return toolResult.result.error || "Failed";
  }

  const data = toolResult.result.data as Record<string, unknown> | undefined;
  if (!data) return "Done";

  // Summarize based on tool type
  if (toolResult.tool === "import_from_postman" || toolResult.tool === "import_from_curl") {
    const reqs = (data.requests_created as number) || 0;
    const colls = (data.collections_created as number) || 0;
    const parts: string[] = [];
    if (colls > 0) parts.push(`${colls} collection${colls > 1 ? "s" : ""}`);
    if (reqs > 0) parts.push(`${reqs} request${reqs > 1 ? "s" : ""}`);
    return parts.length > 0 ? `Imported ${parts.join(", ")}` : "No items imported";
  }

  if (toolResult.tool === "list_suites" || toolResult.tool === "list_test_cases" || toolResult.tool === "list_assertions") {
    const total = (data.total as number) ?? 0;
    return `Found ${total} item${total !== 1 ? "s" : ""}`;
  }

  if (toolResult.tool === "run_suite") {
    const summary = data.summary as Record<string, unknown> | undefined;
    if (summary) {
      const total = (summary.total_cases as number) || 0;
      const passed = (summary.passed_cases as number) || 0;
      const failed = (summary.failed_cases as number) || 0;
      return `${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ""}`;
    }
    return "Execution complete";
  }

  if (data.name) return `${data.name}`;
  if (data.id) return `ID: ${(data.id as string).slice(0, 8)}...`;
  return "Done";
}

export function ChatToolResult({ toolCall, toolResult, isStreamEnded }: ChatToolResultProps) {
  const label = TOOL_LABELS[toolCall.tool] || toolCall.tool;
  const isLoading = !toolResult && !isStreamEnded;
  const isMissing = !toolResult && !!isStreamEnded;
  const isSuccess = toolResult?.result.success ?? false;
  const isError = (toolResult && !toolResult.result.success) || isMissing;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs",
        "bg-muted/50 border border-border/50",
        isError && "border-destructive/30 bg-destructive/5"
      )}
    >
      {/* Icon */}
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
      ) : isSuccess ? (
        <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
      ) : (
        <X className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
      )}

      {/* Tool info */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <Wrench className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground truncate">{label}</span>
      </div>

      {/* Result summary */}
      {toolResult && (
        <span
          className={cn(
            "text-xs flex-shrink-0",
            isSuccess ? "text-foreground" : "text-destructive"
          )}
        >
          {getToolSummary(toolResult)}
        </span>
      )}
      {isMissing && (
        <span className="text-xs flex-shrink-0 text-destructive">
          No result received
        </span>
      )}
    </div>
  );
}
