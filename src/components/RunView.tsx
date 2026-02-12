import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { RunTestCaseList, type RunTestCase } from "./RunTestCaseList";
import { RunTestCaseCanvas } from "./RunTestCaseCanvas";
import { RunSummaryCard } from "./RunSummaryCard";
import { AIFixCard } from "./AIFixCard";
import { Breadcrumbs } from "./Breadcrumbs";
import { MobileBottomSpacer } from "./LeftRail";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import { toast } from "sonner";

// Mock data with proper hierarchy: Run → Test Cases → Test Steps
const mockRunTestCases: RunTestCase[] = [
  {
    id: "1",
    name: "User Login Flow",
    status: "pass",
    duration: "434ms",
    steps: [
      {
        id: "1-1",
        name: "Submit Login Request",
        method: "POST",
        endpoint: "/auth/login",
        status: "pass",
        duration: "245ms",
        assertionsPassed: 3,
        assertionsTotal: 3,
      },
      {
        id: "1-2",
        name: "Verify User Session",
        method: "GET",
        endpoint: "/auth/me",
        status: "pass",
        duration: "189ms",
        assertionsPassed: 2,
        assertionsTotal: 2,
      },
    ],
  },
  {
    id: "2",
    name: "Token Refresh Flow",
    status: "mixed",
    duration: "562ms",
    steps: [
      {
        id: "2-1",
        name: "Request Token Refresh",
        method: "POST",
        endpoint: "/auth/refresh",
        status: "pass",
        duration: "212ms",
        assertionsPassed: 2,
        assertionsTotal: 2,
      },
      {
        id: "2-2",
        name: "Validate New Token",
        method: "GET",
        endpoint: "/auth/validate",
        status: "fail",
        duration: "350ms",
        assertionsPassed: 1,
        assertionsTotal: 2,
      },
    ],
  },
  {
    id: "3",
    name: "User Registration",
    status: "fail",
    duration: "1.2s",
    steps: [
      {
        id: "3-1",
        name: "Submit Registration",
        method: "POST",
        endpoint: "/auth/register",
        status: "fail",
        duration: "1.2s",
        assertionsPassed: 0,
        assertionsTotal: 2,
      },
      {
        id: "3-2",
        name: "Verify Email Sent",
        method: "GET",
        endpoint: "/auth/verify-email-status",
        status: "pending",
        assertionsPassed: 0,
        assertionsTotal: 1,
      },
    ],
  },
  {
    id: "4",
    name: "Logout Flow",
    status: "pending",
    steps: [
      {
        id: "4-1",
        name: "Submit Logout",
        method: "POST",
        endpoint: "/auth/logout",
        status: "pending",
        assertionsPassed: 0,
        assertionsTotal: 2,
      },
      {
        id: "4-2",
        name: "Verify Session Invalidated",
        method: "GET",
        endpoint: "/auth/me",
        status: "pending",
        assertionsPassed: 0,
        assertionsTotal: 1,
      },
    ],
  },
];

// Mock data linking runs to suites
const mockRunData = {
  runId: "run-42",
  suiteName: "Auth Suite",
  suiteId: "auth-suite",
  startedAt: "15 min ago",
  duration: "2.1s",
  triggeredBy: "CI/CD",
  branch: "main",
  commit: "a1b2c3d",
};

interface RunViewProps {
  runId?: string;
  suiteId?: string;
}

export function RunView({ runId, suiteId }: RunViewProps) {
  const navigate = useNavigate();
  const firstFailedCase = mockRunTestCases.find(tc => tc.status === "fail" || tc.status === "mixed");
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(
    firstFailedCase?.id || mockRunTestCases[0]?.id || null
  );
  const [showAIFix, setShowAIFix] = useState(false);
  const [fixingStepId, setFixingStepId] = useState<string | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const isMobile = useIsMobile();

  const selectedTestCase = mockRunTestCases.find(tc => tc.id === selectedTestCaseId) || null;

  // Build breadcrumbs based on context
  const breadcrumbItems = suiteId
    ? [
      { label: "Suites", href: "/suites" },
      { label: mockRunData.suiteName, href: `/suites/${suiteId}` },
      { label: "Runs", href: `/suites/${suiteId}/runs` },
      { label: runId || mockRunData.runId },
    ]
    : [
      { label: "Runs", href: "/runs" },
      { label: runId || mockRunData.runId },
    ];

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
    const failedCount = mockRunTestCases.filter(
      tc => tc.status === "fail" || tc.status === "mixed"
    ).length;
    toast.success(`Re-running ${failedCount} failed test case(s)...`, {
      description: "Starting a new run for failed test cases only.",
    });
  };

  const handleRerunTestCase = (testCaseId: string) => {
    const testCase = mockRunTestCases.find(tc => tc.id === testCaseId);
    toast.success(`Re-running "${testCase?.name}"...`, {
      description: "Starting a new run for this test case.",
    });
  };

  // Find the step name for the AI fix card
  const fixingStep = fixingStepId
    ? selectedTestCase?.steps.find(s => s.id === fixingStepId)
    : null;

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col animate-fade-in">

        {/* Summary Card */}
        <div className="px-4 pb-4">
          <RunSummaryCard
            runId={runId || mockRunData.runId}
            testCases={mockRunTestCases}
            duration={mockRunData.duration}
            triggeredBy={mockRunData.triggeredBy}
            startedAt={mockRunData.startedAt}
            branch={mockRunData.branch}
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
                testCases={mockRunTestCases}
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
          runId={runId || mockRunData.runId}
          testCases={mockRunTestCases}
          duration={mockRunData.duration}
          triggeredBy={mockRunData.triggeredBy}
          startedAt={mockRunData.startedAt}
          branch={mockRunData.branch}
          onRerunAll={handleRerunAll}
          onRerunFailed={handleRerunFailed}
        />
      </div>

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <RunTestCaseList
              testCases={mockRunTestCases}
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
