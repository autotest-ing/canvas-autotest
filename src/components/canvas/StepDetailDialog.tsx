import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { RunTestStep } from "@/components/RunTestCaseList";
import {
  fetchStepResultDetails,
  type StepResultFullDetail,
  type StepResultHttpRequest,
  type StepResultHttpResponse,
} from "@/lib/api/suites";

// ============== Types ==============

interface StepDetailDialogProps {
  step: RunTestStep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AssertionItem {
  id: string;
  status: string;
  actual?: unknown;
  expected?: unknown;
  message: string | null;
}

// ============== Helpers ==============

function getMethodColor(method: string) {
  switch (method) {
    case "GET":
      return "bg-blue-500/20 text-blue-600 border-blue-500/30";
    case "POST":
      return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30";
    case "PUT":
      return "bg-amber-500/20 text-amber-600 border-amber-500/30";
    case "PATCH":
      return "bg-orange-500/20 text-orange-600 border-orange-500/30";
    case "DELETE":
      return "bg-red-500/20 text-red-600 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getStatusCodeColor(code: number) {
  if (code >= 200 && code < 300) return "text-emerald-600";
  if (code >= 300 && code < 400) return "text-amber-600";
  if (code >= 400 && code < 500) return "text-orange-600";
  return "text-destructive";
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("value" in obj) return String(obj.value ?? "—");
    return JSON.stringify(value);
  }
  return String(value);
}

// ============== Sub-components ==============

function AssertionStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    case "fail":
      return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
    case "warn":
      return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground shrink-0" />;
  }
}

function AssertionsTab({ assertions }: { assertions: AssertionItem[] }) {
  const passedCount = assertions.filter((a) => a.status === "pass").length;
  const failedCount = assertions.filter((a) => a.status === "fail").length;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {passedCount} passed
        </Badge>
        {failedCount > 0 && (
          <Badge
            variant="outline"
            className="text-xs bg-destructive/10 text-destructive border-destructive/20"
          >
            <XCircle className="w-3 h-3 mr-1" />
            {failedCount} failed
          </Badge>
        )}
      </div>

      {/* Assertions list */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2">
          {assertions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No assertions
            </p>
          ) : (
            assertions.map((assertion) => (
              <div
                key={assertion.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  assertion.status === "fail" &&
                    "bg-destructive/5 border-destructive/20",
                  assertion.status === "pass" &&
                    "bg-emerald-500/5 border-emerald-500/20",
                  assertion.status === "warn" &&
                    "bg-amber-500/5 border-amber-500/20",
                  assertion.status !== "fail" &&
                    assertion.status !== "pass" &&
                    assertion.status !== "warn" &&
                    "bg-muted/30 border-border/50"
                )}
              >
                <AssertionStatusIcon status={assertion.status} />
                <div className="flex-1 min-w-0 space-y-1">
                  {assertion.message && (
                    <p className="text-sm font-medium text-foreground">
                      {assertion.message}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="text-muted-foreground">
                      Expected:{" "}
                      <code className="px-1 py-0.5 bg-muted/50 rounded text-foreground">
                        {formatValue(assertion.expected)}
                      </code>
                    </span>
                    <span className="text-muted-foreground">
                      Actual:{" "}
                      <code
                        className={cn(
                          "px-1 py-0.5 rounded",
                          assertion.status === "fail"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted/50 text-foreground"
                        )}
                      >
                        {formatValue(assertion.actual)}
                      </code>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function KeyValueTable({ data }: { data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">No headers</p>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground w-1/3">
              Key
            </th>
            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key} className="border-t border-border/50">
              <td className="px-3 py-1.5 font-mono text-foreground">{key}</td>
              <td className="px-3 py-1.5 font-mono text-muted-foreground break-all">
                {String(value ?? "")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeadersSection({ headers }: { headers: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 hover:bg-muted/30 transition-colors"
        >
          <span className="text-xs font-medium text-muted-foreground">
            Headers
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <KeyValueTable data={headers} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function RequestTab({
  request,
  loading,
  error,
}: {
  request: StepResultHttpRequest | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading request details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-destructive">{error}</div>
    );
  }

  if (!request) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No request data available
      </p>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="space-y-4">
        {/* Method & URL */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">URL</h4>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold shrink-0",
                getMethodColor(request.method ?? "GET")
              )}
            >
              {request.method ?? "GET"}
            </Badge>
            <code className="text-sm font-mono text-foreground break-all">
              {request.url ?? "—"}
            </code>
          </div>
        </div>

        <HeadersSection headers={request.headers} />

        {/* Body */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Body
          </h4>
          {request.body ? (
            <pre className="font-mono text-xs bg-muted/30 p-3 rounded-lg overflow-auto max-h-64 border border-border/50">
              {formatJson(request.body)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">No body</p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

function ResponseTab({
  response,
  loading,
  error,
}: {
  response: StepResultHttpResponse | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading response details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-destructive">{error}</div>
    );
  }

  if (!response) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No response data available
      </p>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="space-y-4">
        {/* Status & Duration */}
        <div className="flex items-center gap-4">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              Status Code
            </h4>
            <span
              className={cn(
                "text-lg font-bold font-mono",
                response.status_code
                  ? getStatusCodeColor(response.status_code)
                  : "text-muted-foreground"
              )}
            >
              {response.status_code ?? "—"}
            </span>
          </div>
          {response.duration_ms != null && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">
                Duration
              </h4>
              <span className="text-sm font-mono text-foreground">
                {response.duration_ms.toFixed(0)}ms
              </span>
            </div>
          )}
        </div>

        <HeadersSection headers={response.headers} />

        {/* Body */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Body
          </h4>
          {response.body || response.raw_body ? (
            <pre className="font-mono text-xs bg-muted/30 p-3 rounded-lg overflow-auto max-h-64 border border-border/50">
              {formatJson(response.body ?? response.raw_body)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">No body</p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============== Main Dialog Component ==============

export function StepDetailDialog({
  step,
  open,
  onOpenChange,
}: StepDetailDialogProps) {
  const { token } = useAuth();
  const [fullDetail, setFullDetail] = useState<StepResultFullDetail | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("response");

  useEffect(() => {
    if (open) {
      setActiveTab("response");
    }
  }, [open, step?.id, step?.stepResultId]);

  // Fetch full details when dialog opens
  useEffect(() => {
    if (!open || !step?.stepResultId || !token) {
      setFullDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchStepResultDetails(step.stepResultId, token)
      .then((data) => {
        if (!cancelled) setFullDetail(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, step?.stepResultId, token]);

  if (!step) return null;

  // Use WS-cached assertion results for immediate display,
  // upgrade to API data once loaded
  const assertions: AssertionItem[] =
    fullDetail?.assertion_results.map((ar) => ({
      id: ar.id,
      status: ar.status,
      actual: ar.actual,
      expected: ar.expected,
      message: ar.message,
    })) ??
    step.assertionResults?.map((ar, i) => ({
      id: String(i),
      status: ar.status,
      actual: ar.actual,
      expected: ar.expected,
      message: ar.message ?? null,
    })) ??
    [];

  const passedCount = assertions.filter((a) => a.status === "pass").length;
  const failedCount = assertions.filter((a) => a.status === "fail").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-base">{step.name}</DialogTitle>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold",
                getMethodColor(step.method)
              )}
            >
              {step.method}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                step.status === "pass" &&
                  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                step.status === "fail" &&
                  "bg-destructive/10 text-destructive border-destructive/20"
              )}
            >
              {step.status === "pass" ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : step.status === "fail" ? (
                <XCircle className="w-3 h-3 mr-1" />
              ) : null}
              {step.status}
            </Badge>
          </div>
          <DialogDescription className="text-xs font-mono mt-1 break-all">
            {step.endpoint}
          </DialogDescription>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {step.duration && <span>Duration: {step.duration}</span>}
            <span>
              {passedCount} passed / {failedCount} failed
            </span>
          </div>
        </DialogHeader>

        {/* Tabbed Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="mx-6 mt-4 w-fit">
            <TabsTrigger value="assertions">
              Assertions ({assertions.length})
            </TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <TabsContent value="assertions">
              <AssertionsTab assertions={assertions} />
            </TabsContent>
            <TabsContent value="request">
              <RequestTab
                request={fullDetail?.request ?? null}
                loading={loading}
                error={error}
              />
            </TabsContent>
            <TabsContent value="response">
              <ResponseTab
                response={fullDetail?.response ?? null}
                loading={loading}
                error={error}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
