import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomSpacer } from "./LeftRail";
import { Play, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Run {
  id: string;
  runId: string;
  status: "passed" | "failed" | "running" | "pending";
  passedTests: number;
  failedTests: number;
  totalTests: number;
  duration: string;
  startedAt: string;
  triggeredBy: string;
}

// Mock historical runs data
const mockRuns: Run[] = [
  { id: "1", runId: "run-47", status: "running", passedTests: 2, failedTests: 0, totalTests: 4, duration: "1.2s", startedAt: "2 min ago", triggeredBy: "Manual" },
  { id: "2", runId: "run-46", status: "failed", passedTests: 3, failedTests: 1, totalTests: 4, duration: "2.8s", startedAt: "15 min ago", triggeredBy: "CI/CD" },
  { id: "3", runId: "run-45", status: "passed", passedTests: 4, failedTests: 0, totalTests: 4, duration: "2.1s", startedAt: "1 hour ago", triggeredBy: "CI/CD" },
  { id: "4", runId: "run-44", status: "passed", passedTests: 4, failedTests: 0, totalTests: 4, duration: "2.3s", startedAt: "3 hours ago", triggeredBy: "Manual" },
  { id: "5", runId: "run-43", status: "failed", passedTests: 2, failedTests: 2, totalTests: 4, duration: "3.1s", startedAt: "5 hours ago", triggeredBy: "CI/CD" },
  { id: "6", runId: "run-42", status: "passed", passedTests: 4, failedTests: 0, totalTests: 4, duration: "2.0s", startedAt: "1 day ago", triggeredBy: "Schedule" },
];

const mockSuiteData: Record<string, { name: string; description: string }> = {
  "auth-suite": { name: "Auth Suite", description: "Authentication and authorization flow tests" },
  "api-suite": { name: "API Suite", description: "Core API endpoint tests" },
  "e2e-suite": { name: "E2E Suite", description: "End-to-end user journey tests" },
};

function StatusBadge({ status }: { status: Run["status"] }) {
  const config = {
    passed: { icon: CheckCircle2, label: "Passed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    failed: { icon: XCircle, label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
    running: { icon: Clock, label: "Running", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    pending: { icon: AlertTriangle, label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

interface RunsListViewProps {
  suiteId?: string;
}

export function RunsListView({ suiteId }: RunsListViewProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const suiteData = suiteId ? mockSuiteData[suiteId] : null;

  const handleRunClick = (runId: string) => {
    if (suiteId) {
      navigate(`/suites/${suiteId}/runs/${runId}`);
    } else {
      navigate(`/runs/${runId}`);
    }
  };

  const handleRunSuite = () => {
    console.log("Running suite:", suiteId);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {suiteData ? `${suiteData.name} - Run History` : "All Runs"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mockRuns.length} runs total
            </p>
          </div>
          {suiteId && (
            <Button size="sm" onClick={handleRunSuite} className="gap-2">
              <Play className="w-4 h-4" />
              Run Suite
            </Button>
          )}
        </div>
      </div>

      {/* Runs List */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          {isMobile ? (
            <div className="space-y-3">
              {mockRuns.map((run) => (
                <Card
                  key={run.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRunClick(run.runId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-medium">{run.runId}</span>
                      <StatusBadge status={run.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{run.passedTests}/{run.totalTests} passed</span>
                      <span>{run.duration}</span>
                      <span>{run.startedAt}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden bg-white dark:bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Run ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Triggered By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRuns.map((run) => (
                    <TableRow
                      key={run.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRunClick(run.runId)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {run.runId}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={run.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-emerald-600">{run.passedTests}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span>{run.totalTests}</span>
                        {run.failedTests > 0 && (
                          <span className="text-destructive ml-2">({run.failedTests} failed)</span>
                        )}
                      </TableCell>
                      <TableCell>{run.duration}</TableCell>
                      <TableCell className="text-muted-foreground">{run.startedAt}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {run.triggeredBy}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </ScrollArea>
      {isMobile && <MobileBottomSpacer />}
    </div>
  );
}
