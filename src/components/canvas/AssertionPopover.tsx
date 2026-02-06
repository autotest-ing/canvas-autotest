import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import type { RunTestStep } from "@/components/RunTestCaseList";

interface AssertionPopoverProps {
  step: RunTestStep;
}

// Mock assertion data for demonstration
interface Assertion {
  id: string;
  type: "status_code" | "header" | "jsonpath" | "schema" | "time" | "custom";
  name: string;
  expected: string;
  actual?: string;
  status: "pass" | "fail" | "pending";
}

function getMockAssertions(step: RunTestStep): Assertion[] {
  const baseAssertions: Assertion[] = [
    {
      id: "1",
      type: "status_code",
      name: "Status Code",
      expected: "200",
      actual: step.status === "fail" ? "500" : "200",
      status: step.status === "fail" ? "fail" : "pass",
    },
    {
      id: "2",
      type: "time",
      name: "Response Time",
      expected: "< 500ms",
      actual: step.duration || "—",
      status: "pass",
    },
  ];

  if (step.assertionsTotal > 2) {
    baseAssertions.push({
      id: "3",
      type: "jsonpath",
      name: "JSONPath $.data.id",
      expected: "exists",
      actual: step.status === "fail" ? "null" : "12345",
      status: step.status === "fail" && step.assertionsPassed < 2 ? "fail" : "pass",
    });
  }

  if (step.assertionsTotal > 3) {
    baseAssertions.push({
      id: "4",
      type: "schema",
      name: "JSON Schema",
      expected: "Valid",
      actual: "Valid",
      status: "pass",
    });
  }

  if (step.assertionsTotal > 4) {
    baseAssertions.push({
      id: "5",
      type: "header",
      name: "Content-Type",
      expected: "application/json",
      actual: "application/json",
      status: "pass",
    });
  }

  return baseAssertions;
}

function getTypeIcon(type: Assertion["type"]) {
  switch (type) {
    case "status_code":
      return "SC";
    case "header":
      return "HD";
    case "jsonpath":
      return "JP";
    case "schema":
      return "SM";
    case "time":
      return "TM";
    case "custom":
      return "CU";
  }
}

function getStatusIcon(status: Assertion["status"]) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case "fail":
      return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

export function AssertionPopover({ step }: AssertionPopoverProps) {
  const assertions = getMockAssertions(step);
  const passedCount = assertions.filter((a) => a.status === "pass").length;
  const failedCount = assertions.filter((a) => a.status === "fail").length;

  return (
    <div className="bg-popover border-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{step.name}</p>
            <p className="text-xs text-muted-foreground">{step.endpoint}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-bold",
              step.method === "GET" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
              step.method === "POST" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
              step.method === "PUT" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
              step.method === "PATCH" && "bg-orange-500/10 text-orange-600 border-orange-500/20",
              step.method === "DELETE" && "bg-red-500/10 text-red-600 border-red-500/20"
            )}
          >
            {step.method}
          </Badge>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant="outline"
            className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {passedCount} passed
          </Badge>
          {failedCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] bg-destructive/10 text-destructive border-destructive/20"
            >
              <XCircle className="w-3 h-3 mr-1" />
              {failedCount} failed
            </Badge>
          )}
        </div>
      </div>

      {/* Assertions List */}
      <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
        {assertions.map((assertion) => (
          <div
            key={assertion.id}
            className={cn(
              "flex items-start gap-2 p-2 rounded-lg transition-colors",
              assertion.status === "fail" && "bg-destructive/5",
              assertion.status === "pass" && "bg-muted/30"
            )}
          >
            {/* Type Badge */}
            <Badge
              variant="secondary"
              className="h-5 w-7 px-0 justify-center text-[9px] font-bold shrink-0 bg-muted/50"
            >
              {getTypeIcon(assertion.type)}
            </Badge>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {assertion.name}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                <span className="text-muted-foreground">Expected:</span>
                <code className="px-1 py-0.5 bg-muted/50 rounded text-foreground">
                  {assertion.expected}
                </code>
              </div>
              {assertion.actual && (
                <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                  <span className="text-muted-foreground">Actual:</span>
                  <code
                    className={cn(
                      "px-1 py-0.5 rounded",
                      assertion.status === "fail"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted/50 text-foreground"
                    )}
                  >
                    {assertion.actual}
                  </code>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="shrink-0 mt-0.5">{getStatusIcon(assertion.status)}</div>
          </div>
        ))}
      </div>

      {/* Footer warning for failures */}
      {failedCount > 0 && (
        <div className="px-3 py-2 border-t border-border/50 bg-destructive/5">
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{failedCount} assertion{failedCount > 1 ? "s" : ""} failed</span>
          </div>
        </div>
      )}
    </div>
  );
}
