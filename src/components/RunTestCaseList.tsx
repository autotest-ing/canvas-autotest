import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";

export interface RunTestStep {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  status: "pass" | "fail" | "pending" | "running";
  duration?: string;
  assertionsPassed: number;
  assertionsTotal: number;
}

export interface RunTestCase {
  id: string;
  name: string;
  status: "pass" | "fail" | "pending" | "running" | "mixed";
  steps: RunTestStep[];
  duration?: string;
}

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

export function RunTestCaseList({ testCases, selectedId, onSelect }: RunTestCaseListProps) {
  const passCount = testCases.filter(tc => tc.status === "pass").length;
  const failCount = testCases.filter(tc => tc.status === "fail" || tc.status === "mixed").length;

  return (
    <div className="h-full flex flex-col bg-card/50">
      <div className="p-4 border-b border-border/50">
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
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {testCases.map((testCase) => (
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
