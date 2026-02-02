import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Timer, GitBranch, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunTestCase } from "./RunTestCaseList";

interface RunSummaryCardProps {
  runId: string;
  testCases: RunTestCase[];
  duration: string;
  triggeredBy: string;
  startedAt: string;
  branch?: string;
  commit?: string;
}

export function RunSummaryCard({
  runId,
  testCases,
  duration,
  triggeredBy,
  startedAt,
  branch,
  commit,
}: RunSummaryCardProps) {
  const passedCases = testCases.filter(tc => tc.status === "pass").length;
  const failedCases = testCases.filter(tc => tc.status === "fail" || tc.status === "mixed").length;
  const pendingCases = testCases.filter(tc => tc.status === "pending" || tc.status === "running").length;
  const totalCases = testCases.length;
  
  // Calculate total steps and assertions
  const totalSteps = testCases.reduce((sum, tc) => sum + tc.steps.length, 0);
  const passedSteps = testCases.reduce(
    (sum, tc) => sum + tc.steps.filter(s => s.status === "pass").length, 
    0
  );
  const totalAssertions = testCases.reduce(
    (sum, tc) => sum + tc.steps.reduce((s, step) => s + step.assertionsTotal, 0),
    0
  );
  const passedAssertions = testCases.reduce(
    (sum, tc) => sum + tc.steps.reduce((s, step) => s + step.assertionsPassed, 0),
    0
  );

  const overallStatus = failedCases > 0 ? "failed" : pendingCases > 0 ? "running" : "passed";

  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Status indicator and run ID */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                overallStatus === "passed" && "bg-emerald-500/15",
                overallStatus === "failed" && "bg-destructive/15",
                overallStatus === "running" && "bg-primary/15"
              )}
            >
              {overallStatus === "passed" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {overallStatus === "failed" && <XCircle className="w-5 h-5 text-destructive" />}
              {overallStatus === "running" && <Clock className="w-5 h-5 text-primary animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">{runId}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    overallStatus === "passed" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    overallStatus === "failed" && "bg-destructive/10 text-destructive border-destructive/20",
                    overallStatus === "running" && "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  {overallStatus === "passed" && "Passed"}
                  {overallStatus === "failed" && "Failed"}
                  {overallStatus === "running" && "Running"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{startedAt}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 lg:gap-6 lg:ml-auto">
            {/* Test Cases */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-semibold text-emerald-600">{passedCases}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-lg font-semibold">{totalCases}</span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cases</p>
              </div>
              
              <div className="h-8 w-px bg-border/50" />
              
              <div className="text-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-semibold text-emerald-600">{passedSteps}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-lg font-semibold">{totalSteps}</span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Steps</p>
              </div>
              
              <div className="h-8 w-px bg-border/50" />
              
              <div className="text-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-semibold text-emerald-600">{passedAssertions}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-lg font-semibold">{totalAssertions}</span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Assertions</p>
              </div>
            </div>

            <div className="h-8 w-px bg-border/50 hidden lg:block" />

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4" />
                <span>{duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{triggeredBy}</span>
              </div>
              {branch && (
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" />
                  <span className="font-mono text-xs">{branch}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
