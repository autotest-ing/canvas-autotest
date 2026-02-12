import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronRight, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";

export interface RunTestStep {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  status: "pass" | "fail" | "pending" | "running";
  duration?: string;
  assertionsPassed: number;
  assertionsTotal: number;
  stepResultId?: string;
  request?: {
    method: string | null;
    url: string | null;
    headers: Record<string, unknown> | null;
    body: unknown;
  } | null;
  response?: {
    status_code: number | null;
    headers: Record<string, unknown> | null;
    body: unknown;
    raw_body: string | null;
    duration_ms: number | null;
    request_body?: unknown;
    request_headers?: Record<string, unknown> | null;
    request_url?: string | null;
  } | null;
  assertionResults?: Array<{
    status: string;
    message: string;
    actual?: unknown;
    expected?: unknown;
  }>;
}

export interface RunTestCase {
  id: string;
  name: string;
  status: "pass" | "fail" | "pending" | "running" | "mixed";
  steps: RunTestStep[];
  duration?: string;
}

type StatusFilter = "all" | "pass" | "fail" | "pending";

interface RunTestCaseListProps {
  testCases: RunTestCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function getStatusIcon(status: RunTestCase["status"]) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case "fail":
    case "mixed":
      return <XCircle className="w-4 h-4 text-destructive" />;
    case "running":
      return <Clock className="w-4 h-4 text-primary animate-pulse" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

function getStatusColor(status: RunTestCase["status"]) {
  switch (status) {
    case "pass":
      return "bg-emerald-500";
    case "fail":
    case "mixed":
      return "bg-destructive";
    case "running":
      return "bg-primary";
    default:
      return "bg-muted-foreground";
  }
}

function matchesFilter(status: RunTestCase["status"], filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "pass") return status === "pass";
  if (filter === "fail") return status === "fail" || status === "mixed";
  if (filter === "pending") return status === "pending" || status === "running";
  return true;
}

export function RunTestCaseList({ testCases, selectedId, onSelect }: RunTestCaseListProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  
  const passCount = testCases.filter(tc => tc.status === "pass").length;
  const failCount = testCases.filter(tc => tc.status === "fail" || tc.status === "mixed").length;
  const pendingCount = testCases.filter(tc => tc.status === "pending" || tc.status === "running").length;
  
  const filteredTestCases = testCases.filter(tc => matchesFilter(tc.status, filter));

  return (
    <div className="h-full flex flex-col bg-card/50">
      <div className="p-4 border-b border-border/50 space-y-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">Test Cases</h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">{testCases.length} cases</p>
            {passCount > 0 && (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                {passCount} passed
              </Badge>
            )}
            {failCount > 0 && (
              <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                {failCount} failed
              </Badge>
            )}
          </div>
        </div>
        
        {/* Filter Toggle */}
        <ToggleGroup 
          type="single" 
          value={filter} 
          onValueChange={(value) => value && setFilter(value as StatusFilter)}
          className="justify-start gap-1"
        >
          <ToggleGroupItem 
            value="all" 
            size="sm" 
            className={cn(
              "text-xs h-7 px-2.5 data-[state=on]:bg-accent",
              filter === "all" && "font-medium"
            )}
          >
            All
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="pass" 
            size="sm" 
            className={cn(
              "text-xs h-7 px-2.5 gap-1",
              filter === "pass" && "bg-emerald-500/10 text-emerald-600 font-medium"
            )}
            disabled={passCount === 0}
          >
            <CheckCircle2 className="w-3 h-3" />
            {passCount}
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="fail" 
            size="sm" 
            className={cn(
              "text-xs h-7 px-2.5 gap-1",
              filter === "fail" && "bg-destructive/10 text-destructive font-medium"
            )}
            disabled={failCount === 0}
          >
            <XCircle className="w-3 h-3" />
            {failCount}
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="pending" 
            size="sm" 
            className={cn(
              "text-xs h-7 px-2.5 gap-1",
              filter === "pending" && "bg-muted font-medium"
            )}
            disabled={pendingCount === 0}
          >
            <Clock className="w-3 h-3" />
            {pendingCount}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredTestCases.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No test cases match this filter
            </div>
          ) : (
            filteredTestCases.map((testCase) => (
              <button
                key={testCase.id}
                onClick={() => onSelect(testCase.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                  "hover:bg-accent/50",
                  selectedId === testCase.id
                    ? "bg-accent shadow-soft"
                    : "bg-transparent"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {getStatusIcon(testCase.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {testCase.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{testCase.steps.length} steps</span>
                    {testCase.duration && (
                      <>
                        <span>•</span>
                        <span>{testCase.duration}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      getStatusColor(testCase.status)
                    )}
                  />
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
