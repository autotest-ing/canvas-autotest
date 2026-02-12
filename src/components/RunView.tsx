import { useState, useEffect, useCallback } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { RunTestCaseList, type RunTestCase, type RunTestStep } from "./RunTestCaseList";
import { RunTestCaseCanvas } from "./RunTestCaseCanvas";
import { RunSummaryCard } from "./RunSummaryCard";
import { AIFixCard } from "./AIFixCard";
import { MobileBottomSpacer } from "./LeftRail";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchRunDetails,
  type EnrichedRunDetail,
  type EnrichedCaseResult,
  type EnrichedStepResult,
  type StepResultHttpRequest,
  type StepResultHttpResponse,
  type EnrichedAssertionResult,
} from "@/lib/api/suites";

// ============== Helpers ==============

function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "--";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function toHttpMethod(method: string | null): HttpMethod {
  if (!method) return "GET";
  const upper = method.toUpperCase();
  if (["GET", "POST", "PUT", "PATCH", "DELETE"].includes(upper)) {
    return upper as HttpMethod;
  }
  return "GET";
}

function mapCaseStatus(status: string): RunTestCase["status"] {
  switch (status) {
    case "success":
      return "pass";
    case "failed":
      return "fail";
    case "skipped":
      return "pending";
    case "running":
      return "running";
    default:
      return "pending";
  }
}

function mapStepStatus(status: string): RunTestStep["status"] {
  switch (status) {
    case "success":
      return "pass";
    case "failed":
      return "fail";
    case "skipped":
      return "pending";
    case "running":
      return "running";
    default:
      return "pending";
  }
}

function deriveCaseStatus(caseResult: EnrichedCaseResult): RunTestCase["status"] {
  const stepStatuses = caseResult.step_results.map((sr) => mapStepStatus(sr.status));
  const hasFailed = stepStatuses.includes("fail");
  const hasPassed = stepStatuses.includes("pass");
  const hasRunning = stepStatuses.includes("running");

  if (hasRunning) return "running";
  if (hasFailed && hasPassed) return "mixed";
  if (hasFailed) return "fail";
  if (hasPassed) return "pass";
  return mapCaseStatus(caseResult.status);
}

function mapStepResult(sr: EnrichedStepResult): RunTestStep {
  const passedAssertions = sr.assertion_results.filter((ar) => ar.status === "pass").length;
  return {
    id: sr.id,
    name: sr.step_name || "Unnamed Step",
    method: toHttpMethod(sr.method),
    endpoint: sr.endpoint || "",
    status: mapStepStatus(sr.status),
    duration: formatDuration(sr.started_at, sr.finished_at),
    assertionsPassed: passedAssertions,
    assertionsTotal: sr.assertion_results.length,
    stepResultId: sr.id,
    request: sr.request,
    response: sr.response,
    assertionResults: sr.assertion_results.map((ar) => ({
      status: ar.status,
      message: ar.message || ar.assertion_name || "",
      actual: ar.actual,
      expected: ar.expected,
    })),
  };
}

function mapCaseResult(cr: EnrichedCaseResult): RunTestCase {
  const steps = cr.step_results.map(mapStepResult);
  return {
    id: cr.id,
    name: cr.case_name || "Unnamed Case",
    status: deriveCaseStatus(cr),
    steps,
    duration: formatDuration(cr.started_at, cr.finished_at),
  };
}

// ============== Component ==============

interface RunViewProps {
  runId?: string;
  suiteId?: string;
}

export function RunView({ runId, suiteId }: RunViewProps) {
  const { token } = useAuth();
  const isMobile = useIsMobile();

  const [runData, setRunData] = useState<EnrichedRunDetail | null>(null);
  const [testCases, setTestCases] = useState<RunTestCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [showAIFix, setShowAIFix] = useState(false);
  const [fixingStepId, setFixingStepId] = useState<string | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const loadRunDetails = useCallback(async () => {
    if (!runId || !token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRunDetails(runId, token);
      setRunData(data);
      const mapped = data.case_results.map(mapCaseResult);
      setTestCases(mapped);

      // Auto-select first failed case, or first case
      const firstFailed = mapped.find((tc) => tc.status === "fail" || tc.status === "mixed");
      setSelectedTestCaseId(firstFailed?.id || mapped[0]?.id || null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load run details";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [runId, token]);

  useEffect(() => {
    loadRunDetails();
  }, [loadRunDetails]);

  const selectedTestCase = testCases.find((tc) => tc.id === selectedTestCaseId) || null;

  const handleFixWithAI = (stepId: string) => {
    setFixingStepId(stepId);
    setShowAIFix(true);
  };

  const handleApplyFix = () => {
    setShowAIFix(false);
    setFixingStepId(null);
    toast.success("Fix applied successfully", {
      description: "The proposed changes have been applied to your codebase.",
    });
  };

  const handleApplyAndRerun = () => {
    setShowAIFix(false);
    setFixingStepId(null);
    toast.success("Fix applied, rerunning tests...", {
      description: "The changes have been applied. Running test suite.",
    });
  };

  const handleDismissFix = () => {
    setShowAIFix(false);
    setFixingStepId(null);
  };

  const handleSelectTestCase = (id: string) => {
    setSelectedTestCaseId(id);
    setShowAIFix(false);
    setFixingStepId(null);
    setMobileListOpen(false);
  };

  const handleRerunAll = () => {
    toast.success("Re-running all tests...", {
      description: "Starting a new run for all test cases in this suite.",
    });
  };

  const handleRerunFailed = () => {
    const failedCount = testCases.filter(
      (tc) => tc.status === "fail" || tc.status === "mixed"
    ).length;
    toast.success(`Re-running ${failedCount} failed test case(s)...`, {
      description: "Starting a new run for failed test cases only.",
    });
  };

  const handleRerunTestCase = (testCaseId: string) => {
    const testCase = testCases.find((tc) => tc.id === testCaseId);
    toast.success(`Re-running "${testCase?.name}"...`, {
      description: "Starting a new run for this test case.",
    });
  };

  // Find the step name for the AI fix card
  const fixingStep = fixingStepId
    ? selectedTestCase?.steps.find((s) => s.id === fixingStepId)
    : null;

  // Derived run metadata
  const displayRunId = runId || runData?.id || "";
  const shortRunId = displayRunId.length > 12
    ? `${displayRunId.slice(0, 8)}...${displayRunId.slice(-4)}`
    : displayRunId;
  const suiteName = runData?.suite_name || "";
  const duration = runData
    ? formatDuration(runData.started_at, runData.finished_at)
    : "--";
  const startedAt = runData ? formatTimeAgo(runData.started_at) : "";
  const branch = runData?.summary?.branch as string | undefined;

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading run details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-md px-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadRunDetails}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col animate-fade-in">
        {/* Summary Card */}
        <div className="px-4 pb-4">
          <RunSummaryCard
            runId={shortRunId}
            testCases={testCases}
            duration={duration}
            triggeredBy="Manual"
            startedAt={startedAt}
            branch={branch}
            onRerunAll={handleRerunAll}
            onRerunFailed={handleRerunFailed}
          />
        </div>

        {/* Mobile header with list toggle */}
        <div className="px-4 pb-4 border-b border-border/50 flex items-center gap-2">
          <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <List className="w-4 h-4" />
                Test Cases
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <RunTestCaseList
                testCases={testCases}
                selectedId={selectedTestCaseId}
                onSelect={handleSelectTestCase}
              />
            </SheetContent>
          </Sheet>
          <span className="text-sm text-muted-foreground">
            {selectedTestCase?.name || "Select a test case"}
          </span>
        </div>

        {/* AI Fix Card */}
        {showAIFix && fixingStep && (
          <div className="p-4 border-b border-border/50">
            <AIFixCard
              stepName={fixingStep.name}
              onApply={handleApplyFix}
              onApplyAndRerun={handleApplyAndRerun}
              onDismiss={handleDismissFix}
            />
          </div>
        )}

        {/* Test Case Canvas */}
        <div className="flex-1">
          <RunTestCaseCanvas
            testCase={selectedTestCase}
            onFixWithAI={handleFixWithAI}
            onRerunTestCase={handleRerunTestCase}
          />
        </div>
        <MobileBottomSpacer />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen animate-fade-in flex flex-col">
      {/* Summary Card */}
      <div className="px-6 py-4 border-b border-border/50">
        <RunSummaryCard
          runId={shortRunId}
          testCases={testCases}
          duration={duration}
          triggeredBy="Manual"
          startedAt={startedAt}
          branch={branch}
          onRerunAll={handleRerunAll}
          onRerunFailed={handleRerunFailed}
        />
      </div>

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <RunTestCaseList
              testCases={testCases}
              selectedId={selectedTestCaseId}
              onSelect={handleSelectTestCase}
            />
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/30 transition-colors" />
          <ResizablePanel defaultSize={75} minSize={50}>
            <div className="h-full flex flex-col">
              {showAIFix && fixingStep && (
                <div className="p-4 border-b border-border/50">
                  <AIFixCard
                    stepName={fixingStep.name}
                    onApply={handleApplyFix}
                    onApplyAndRerun={handleApplyAndRerun}
                    onDismiss={handleDismissFix}
                  />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <RunTestCaseCanvas
                  testCase={selectedTestCase}
                  onFixWithAI={handleFixWithAI}
                  onRerunTestCase={handleRerunTestCase}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
