import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { TestCaseList, type TestCase, type TestStep, type Assertion } from "./TestCaseList";
import { SuiteCanvas } from "./SuiteCanvas";
import { MobileBottomSpacer } from "./LeftRail";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchSuitesFull, fetchSuites, executeSuite, type TestSuiteFullResponse } from "@/lib/api/suites";
import { toast } from "sonner";

// Simple UUID v4 format check
const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// Map backend assertion_type to frontend Assertion["type"]
function mapAssertionType(backendType: string): Assertion["type"] {
  const mapping: Record<string, Assertion["type"]> = {
    status_code: "status",
    header: "header",
    jsonpath: "body",
    body_contains: "body",
    body_equals: "body",
    response_time: "timing",
    schema: "schema",
    custom: "body",
  };
  return mapping[backendType] ?? "body";
}

// Derive method from step config or default to GET
function deriveMethod(config: Record<string, unknown>): TestStep["method"] {
  const method = (config?.method as string)?.toUpperCase();
  if (method && ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return method as TestStep["method"];
  }
  return "GET";
}

// Derive endpoint from step config
function deriveEndpoint(config: Record<string, unknown>): string {
  return (config?.url as string) || (config?.endpoint as string) || (config?.path as string) || "/";
}

// Transform backend response to frontend TestCase[] format
function transformSuiteData(data: TestSuiteFullResponse): TestCase[] {
  return data.test_cases.map((tc) => ({
    id: tc.id,
    name: tc.name,
    description: tc.description ?? undefined,
    status: undefined, // No last-run status on the definition itself
    steps: tc.steps.map((step) => ({
      id: step.id,
      name: step.name,
      method: deriveMethod(step.config),
      endpoint: deriveEndpoint(step.config),
      status: undefined,
      assertions: step.assertions.map((a) => ({
        id: a.id,
        description: a.name,
        type: mapAssertionType(a.assertion_type),
        status: "pending" as const,
      })),
    })),
  }));
}

const mockSuggestions = [
  {
    id: "1",
    title: "Add rate limiting test",
    description: "Consider adding a test case for rate limiting behavior on the login endpoint to ensure security measures are working.",
    type: "improvement" as const,
  },
  {
    id: "2",
    title: "Slow response detected",
    description: "The /auth/validate endpoint is responding slower than expected. Average response time is 650ms.",
    type: "warning" as const,
  },
  {
    id: "3",
    title: "Token expiry coverage",
    description: "Your tests cover token refresh but don't verify behavior when tokens are expired or invalid.",
    type: "insight" as const,
  },
];

interface SuiteViewProps {
  suiteId?: string;
}

export function SuiteView({ suiteId }: SuiteViewProps) {
  const navigate = useNavigate();
  const { token, currentUser } = useAuth();
  const [resolvedSuiteId, setResolvedSuiteId] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [suiteName, setSuiteName] = useState("");
  const [suiteDescription, setSuiteDescription] = useState("");
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  // Resolve suiteId: if it's already a UUID use it directly,
  // otherwise fetch the suite list and pick the first one
  useEffect(() => {
    if (suiteId && isUUID(suiteId)) {
      setResolvedSuiteId(suiteId);
      return;
    }

    const accountId = currentUser?.default_account_id;
    if (!token || !accountId) return;

    let cancelled = false;
    (async () => {
      try {
        const suites = await fetchSuites(accountId, token);
        if (cancelled) return;
        if (suites.length > 0) {
          setResolvedSuiteId(suites[0].id);
        } else {
          toast.error("No test suites found");
        }
      } catch {
        if (!cancelled) toast.error("Failed to load test suites");
      }
    })();

    return () => { cancelled = true; };
  }, [suiteId, token, currentUser?.default_account_id]);

  // Load the full suite once we have a resolved UUID
  const loadSuite = useCallback(async () => {
    if (!token || !resolvedSuiteId) return;
    setIsLoading(true);
    try {
      const data = await fetchSuitesFull(resolvedSuiteId, token);
      setSuiteName(data.name);
      setSuiteDescription(data.description ?? "");
      const cases = transformSuiteData(data);
      setTestCases(cases);
      setSelectedTestCaseId(cases[0]?.id ?? null);
    } catch {
      toast.error("Failed to load test suite");
    } finally {
      setIsLoading(false);
    }
  }, [token, resolvedSuiteId]);

  useEffect(() => {
    void loadSuite();
  }, [loadSuite]);

  const selectedTestCase = testCases.find(tc => tc.id === selectedTestCaseId) || null;

  const handleRunSuite = async () => {
    if (!token || !resolvedSuiteId) return;
    try {
      await executeSuite(resolvedSuiteId, token);
      toast.success("Suite execution started");
    } catch {
      toast.error("Failed to start suite execution");
    }
  };

  const handleAskAI = () => {
    console.log("Ask AI about suite:", resolvedSuiteId);
  };

  const handleSelectTestCase = (id: string) => {
    setSelectedTestCaseId(id);
    setMobileListOpen(false);
  };

  const handleViewRuns = () => {
    navigate(`/suites/${resolvedSuiteId}/runs`);
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col animate-fade-in">
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
              <TestCaseList
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

        {/* Canvas content */}
        <div className="flex-1">
          <SuiteCanvas
            suiteName={suiteName}
            suiteDescription={suiteDescription}
            selectedTestCase={selectedTestCase}
            suggestions={mockSuggestions}
            onRunSuite={handleRunSuite}
            onAskAI={handleAskAI}
            onViewRuns={handleViewRuns}
          />
        </div>
        <MobileBottomSpacer />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen animate-fade-in flex flex-col">
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <TestCaseList
              testCases={testCases}
              selectedId={selectedTestCaseId}
              onSelect={setSelectedTestCaseId}
            />
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/30 transition-colors" />
          <ResizablePanel defaultSize={70} minSize={50}>
            <SuiteCanvas
              suiteName={suiteName}
              suiteDescription={suiteDescription}
              selectedTestCase={selectedTestCase}
              suggestions={mockSuggestions}
              onRunSuite={handleRunSuite}
              onAskAI={handleAskAI}
              onViewRuns={handleViewRuns}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
