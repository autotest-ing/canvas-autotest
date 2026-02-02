import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, FileText } from "lucide-react";

export interface TestStep {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  status?: "pass" | "fail" | "pending";
  assertions: Assertion[];
}

export interface Assertion {
  id: string;
  description: string;
  type: "status" | "body" | "header" | "timing" | "schema";
  status: "pass" | "fail" | "pending";
}

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  status?: "pass" | "fail" | "pending" | "mixed";
  steps: TestStep[];
}

interface TestCaseListProps {
  testCases: TestCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function getStatusColor(status?: TestCase["status"]) {
  switch (status) {
    case "pass":
      return "bg-emerald-500";
    case "fail":
      return "bg-destructive";
    case "mixed":
      return "bg-amber-500";
    default:
      return "bg-muted-foreground";
  }
}

export function TestCaseList({ testCases, selectedId, onSelect }: TestCaseListProps) {
  const passCount = testCases.filter(tc => tc.status === "pass").length;
  const failCount = testCases.filter(tc => tc.status === "fail").length;

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
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {testCase.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {testCase.steps.length} step{testCase.steps.length !== 1 ? "s" : ""}
                </p>
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
