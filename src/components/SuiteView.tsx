import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { TestCaseList, type TestCase, type TestStep, type Assertion } from "./TestCaseList";
import { SuiteCanvas } from "./SuiteCanvas";
import { AddAssertionDialog } from "./AddAssertionDialog";
import { AddTestStepDialog, type AddTestStepFormValues } from "./AddTestStepDialog";
import { MobileBottomSpacer } from "./LeftRail";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createAssertion,
  createTestStep,
  deleteAssertion,
  deleteTestStep,
  fetchSuitesFull,
  fetchSuites,
  fetchEnvironments,
  getAssertion,
  updateAssertion,
  type TestSuiteFullResponse,
  type Environment,
  type AssertionNested,
  type CreateAssertionPayload,
  type UpdateAssertionPayload,
} from "@/lib/api/suites";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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

function mapBackendAssertion(assertion: AssertionNested): Assertion {
  return {
    id: assertion.id,
    description: assertion.name,
    type: mapAssertionType(assertion.assertion_type),
    status: "pending",
    assertionType: assertion.assertion_type,
    operator: assertion.operator,
    extractor: assertion.extractor ?? null,
    expected: assertion.expected,
    expectedTemplate: assertion.expected_template ?? null,
    severity: assertion.severity,
    isEnabled: assertion.is_enabled,
    sortOrder: assertion.sort_order,
  };
}

function normalizeMethod(method?: string | null): TestStep["method"] {
  const normalizedMethod = method?.toUpperCase();
  if (normalizedMethod && ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(normalizedMethod)) {
    return normalizedMethod as TestStep["method"];
  }
  return "GET";
}

function firstNonEmptyString(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function resolveSelectedRequestData(selectedRequest: AddTestStepFormValues["selectedRequest"]) {
  const request = selectedRequest.request ?? {};

  return {
    method: request.method ?? selectedRequest.method ?? null,
    url: request.url ?? selectedRequest.url ?? null,
    fullUrl: request.full_url ?? selectedRequest.full_url ?? null,
  };
}

// Derive endpoint from step config
function deriveEndpointFromConfig(config: Record<string, unknown>): string {
  return (config?.url as string) || (config?.endpoint as string) || (config?.path as string) || "/";
}

function deriveMethod(step: {
  method?: string | null;
  request?: { method?: string | null } | null;
  config: Record<string, unknown>;
}): TestStep["method"] {
  const configMethod = typeof step.config?.method === "string" ? step.config.method : null;
  return normalizeMethod(step.method ?? step.request?.method ?? configMethod);
}

function deriveEndpoint(step: {
  endpoint?: string | null;
  url?: string | null;
  full_url?: string | null;
  request?: { url?: string | null; full_url?: string | null } | null;
  config: Record<string, unknown>;
}): string {
  return (
    firstNonEmptyString(
      step.endpoint,
      step.url,
      step.full_url,
      step.request?.url,
      step.request?.full_url,
      deriveEndpointFromConfig(step.config)
    ) ?? "/"
  );
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
      method: deriveMethod(step),
      endpoint: deriveEndpoint(step),
      status: undefined,
      stepType: step.step_type,
      requestId: step.request_id ?? null,
      collectionId: step.collection_id ?? null,
      sortOrder: step.sort_order,
      config: step.config,
      assertions: step.assertions.map((a) => ({
        ...mapBackendAssertion(a),
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

function SuiteListSkeleton() {
  return (
    <div className="h-full flex flex-col bg-card/50">
      <div className="p-4 border-b border-border/50">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16 mt-2" />
      </div>
      <div className="p-2 space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border/40">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3 mt-2" />
            </div>
            <Skeleton className="w-4 h-4 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SuiteCanvasSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 md:p-6 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80 mt-3 max-w-full" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border/50 p-4 space-y-3">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-4 w-80 max-w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const [isResolvingSuiteId, setIsResolvingSuiteId] = useState(false);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [creatingAssertionStepId, setCreatingAssertionStepId] = useState<string | null>(null);
  const [isAddTestStepDialogOpen, setIsAddTestStepDialogOpen] = useState(false);
  const [isCreatingTestStep, setIsCreatingTestStep] = useState(false);
  const [isEditAssertionDialogOpen, setIsEditAssertionDialogOpen] = useState(false);
  const [editAssertionContext, setEditAssertionContext] = useState<{
    stepId: string;
    assertionId: string;
  } | null>(null);
  const [isUpdatingAssertion, setIsUpdatingAssertion] = useState(false);
  const [deletingAssertionId, setDeletingAssertionId] = useState<string | null>(null);
  const [deletingTestStepId, setDeletingTestStepId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Resolve suiteId: if it's already a UUID use it directly,
  // otherwise fetch the suite list and pick the first one
  useEffect(() => {
    if (suiteId && isUUID(suiteId)) {
      setResolvedSuiteId(suiteId);
      setIsResolvingSuiteId(false);
      return;
    }

    const accountId = currentUser?.default_account_id;
    if (!token || !accountId) {
      setIsResolvingSuiteId(false);
      return;
    }

    let cancelled = false;
    setIsResolvingSuiteId(true);
    setResolvedSuiteId(null);

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
      } finally {
        if (!cancelled) setIsResolvingSuiteId(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [suiteId, token, currentUser?.default_account_id]);

  // Load environments for the account
  useEffect(() => {
    const accountId = currentUser?.default_account_id;
    if (!token || !accountId) return;

    let cancelled = false;
    (async () => {
      try {
        const envs = await fetchEnvironments(accountId, token);
        if (cancelled) return;
        setEnvironments(envs);
        // Auto-select first environment if available
        if (envs.length > 0) {
          setSelectedEnvironmentId(envs[0].id);
        }
      } catch {
        // Silently fail — environments are optional
      }
    })();

    return () => { cancelled = true; };
  }, [token, currentUser?.default_account_id]);

  // Load the full suite once we have a resolved UUID
  useEffect(() => {
    if (!token || !resolvedSuiteId) return;
    let cancelled = false;

    setIsLoading(true);
    // Prevent stale content from showing while switching suites.
    setSuiteName("");
    setSuiteDescription("");
    setTestCases([]);
    setSelectedTestCaseId(null);
    setIsAddTestStepDialogOpen(false);
    setIsEditAssertionDialogOpen(false);
    setEditAssertionContext(null);

    (async () => {
      try {
        const data = await fetchSuitesFull(resolvedSuiteId, token);
        if (cancelled) return;
        setSuiteName(data.name);
        setSuiteDescription(data.description ?? "");
        const cases = transformSuiteData(data);
        setTestCases(cases);
        setSelectedTestCaseId(cases[0]?.id ?? null);
      } catch {
        if (!cancelled) toast.error("Failed to load test suite");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, resolvedSuiteId]);

  const selectedTestCase = testCases.find(tc => tc.id === selectedTestCaseId) || null;
  const isSuiteContentLoading = isResolvingSuiteId || isLoading;

  const handleRunSuite = () => {
    if (!resolvedSuiteId) return;
    // Navigate to canvas page — the WebSocket hook will handle execution
    const params = new URLSearchParams({ autorun: "true" });
    if (selectedEnvironmentId) {
      params.set("environmentId", selectedEnvironmentId);
    }
    navigate(`/suites/${resolvedSuiteId}/runs/live/canvas?${params.toString()}`);
  };

  const handleAskAI = () => {
    console.log("Ask AI about suite:", resolvedSuiteId);
  };

  const handleSelectTestCase = (id: string) => {
    setSelectedTestCaseId(id);
    setIsAddTestStepDialogOpen(false);
    setMobileListOpen(false);
  };

  const handleViewRuns = () => {
    navigate(`/suites/${resolvedSuiteId}/runs`);
  };

  const handleCreateAssertion = async (stepId: string, payload: CreateAssertionPayload) => {
    if (!token) {
      const missingAuthError = new Error("Missing auth token.");
      toast.error("Failed to add assertion", {
        description: missingAuthError.message,
      });
      throw missingAuthError;
    }

    setCreatingAssertionStepId(stepId);

    try {
      const createdAssertion = await createAssertion(payload, token);

      setTestCases((prevCases) =>
        prevCases.map((testCase) => ({
          ...testCase,
          steps: testCase.steps.map((step) => {
            if (step.id !== stepId) {
              return step;
            }

            return {
              ...step,
              assertions: [...step.assertions, mapBackendAssertion(createdAssertion)],
            };
          }),
        }))
      );

      toast.success("Assertion added");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Please try again.";
      toast.error("Failed to add assertion", { description });
      throw error instanceof Error ? error : new Error("Failed to add assertion");
    } finally {
      setCreatingAssertionStepId((currentStepId) => (currentStepId === stepId ? null : currentStepId));
    }
  };

  const handleCreateTestStep = async (testCaseId: string, formValues: AddTestStepFormValues) => {
    if (!token) {
      const missingAuthError = new Error("Missing auth token.");
      toast.error("Failed to add test step", {
        description: missingAuthError.message,
      });
      throw missingAuthError;
    }

    const targetCase = testCases.find((testCase) => testCase.id === testCaseId);
    if (!targetCase) {
      const missingCaseError = new Error("Test case not found.");
      toast.error("Failed to add test step", {
        description: missingCaseError.message,
      });
      throw missingCaseError;
    }

    const nextSortOrder =
      targetCase.steps.reduce((maxSort, step) => (step.sortOrder > maxSort ? step.sortOrder : maxSort), 0) + 1;

    setIsCreatingTestStep(true);

    try {
      const createdStep = await createTestStep(
        {
          test_case_id: testCaseId,
          name: formValues.name,
          step_type: "request",
          request_id: formValues.requestId,
          sort_order: nextSortOrder,
          config: {
            timeout: formValues.timeout,
            retries: formValues.retries,
          },
        },
        token
      );

      const selectedRequestData = resolveSelectedRequestData(formValues.selectedRequest);
      const mappedMethod = normalizeMethod(selectedRequestData.method);
      const mappedEndpoint =
        selectedRequestData.url ?? selectedRequestData.fullUrl ?? deriveEndpointFromConfig(createdStep.config);

      setTestCases((prevCases) =>
        prevCases.map((testCase) => {
          if (testCase.id !== testCaseId) {
            return testCase;
          }

          return {
            ...testCase,
            steps: [
              ...testCase.steps,
              {
                id: createdStep.id,
                name: createdStep.name,
                method: mappedMethod,
                endpoint: mappedEndpoint,
                status: undefined,
                stepType: createdStep.step_type,
                requestId: createdStep.request_id,
                collectionId: createdStep.collection_id,
                sortOrder: createdStep.sort_order,
                config: createdStep.config,
                assertions: [],
              },
            ],
          };
        })
      );

      toast.success("Test step added");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Please try again.";
      toast.error("Failed to add test step", { description });
      throw error instanceof Error ? error : new Error("Failed to add test step");
    } finally {
      setIsCreatingTestStep(false);
    }
  };

  const handleOpenEditAssertion = (stepId: string, assertionId: string) => {
    setEditAssertionContext({ stepId, assertionId });
    setIsEditAssertionDialogOpen(true);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditAssertionDialogOpen(open);
    if (!open) {
      setEditAssertionContext(null);
    }
  };

  const handleFetchAssertion = async (assertionId: string) => {
    if (!token) {
      throw new Error("Missing auth token.");
    }
    return getAssertion(assertionId, token);
  };

  const handleUpdateAssertion = async (assertionId: string, payload: UpdateAssertionPayload) => {
    if (!token) {
      const missingAuthError = new Error("Missing auth token.");
      toast.error("Failed to update assertion", {
        description: missingAuthError.message,
      });
      throw missingAuthError;
    }

    setIsUpdatingAssertion(true);

    try {
      const updatedAssertion = await updateAssertion(assertionId, payload, token);

      setTestCases((prevCases) =>
        prevCases.map((testCase) => ({
          ...testCase,
          steps: testCase.steps.map((step) => ({
            ...step,
            assertions: step.assertions.map((assertion) =>
              assertion.id === assertionId ? mapBackendAssertion(updatedAssertion) : assertion
            ),
          })),
        }))
      );

      toast.success("Assertion updated");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Please try again.";
      toast.error("Failed to update assertion", { description });
      throw error instanceof Error ? error : new Error("Failed to update assertion");
    } finally {
      setIsUpdatingAssertion(false);
    }
  };

  const handleDeleteAssertion = async (assertionId: string) => {
    if (!token) {
      const missingAuthError = new Error("Missing auth token.");
      toast.error("Failed to delete assertion", {
        description: missingAuthError.message,
      });
      throw missingAuthError;
    }

    setDeletingAssertionId(assertionId);

    try {
      await deleteAssertion(assertionId, token);
      setTestCases((prevCases) =>
        prevCases.map((testCase) => ({
          ...testCase,
          steps: testCase.steps.map((step) => ({
            ...step,
            assertions: step.assertions.filter((assertion) => assertion.id !== assertionId),
          })),
        }))
      );
      toast.success("Assertion deleted");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Please try again.";
      toast.error("Failed to delete assertion", { description });
      throw error instanceof Error ? error : new Error("Failed to delete assertion");
    } finally {
      setDeletingAssertionId((currentId) => (currentId === assertionId ? null : currentId));
    }
  };

  const handleDeleteTestStep = async (stepId: string) => {
    if (!token) {
      const missingAuthError = new Error("Missing auth token.");
      toast.error("Failed to delete test step", {
        description: missingAuthError.message,
      });
      throw missingAuthError;
    }

    setDeletingTestStepId(stepId);

    try {
      await deleteTestStep(stepId, token);
      setTestCases((prevCases) =>
        prevCases.map((testCase) => ({
          ...testCase,
          steps: testCase.steps.filter((step) => step.id !== stepId),
        }))
      );

      if (editAssertionContext?.stepId === stepId) {
        setIsEditAssertionDialogOpen(false);
        setEditAssertionContext(null);
      }

      toast.success("Test step deleted");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Please try again.";
      toast.error("Failed to delete test step", { description });
      throw error instanceof Error ? error : new Error("Failed to delete test step");
    } finally {
      setDeletingTestStepId((currentId) => (currentId === stepId ? null : currentId));
    }
  };

  const editAssertionDialog = editAssertionContext ? (
    <AddAssertionDialog
      mode="edit"
      open={isEditAssertionDialogOpen}
      onOpenChange={handleEditDialogOpenChange}
      stepId={editAssertionContext.stepId}
      assertionId={editAssertionContext.assertionId}
      isSubmitting={isUpdatingAssertion}
      isDeleting={deletingAssertionId === editAssertionContext.assertionId}
      onFetchAssertion={handleFetchAssertion}
      onUpdate={handleUpdateAssertion}
      onDelete={handleDeleteAssertion}
    />
  ) : null;

  const addTestStepDialog = selectedTestCase ? (
    <AddTestStepDialog
      open={isAddTestStepDialogOpen}
      onOpenChange={setIsAddTestStepDialogOpen}
      accountId={currentUser?.default_account_id ?? null}
      token={token}
      isSubmitting={isCreatingTestStep}
      onSubmit={(values) => handleCreateTestStep(selectedTestCase.id, values)}
    />
  ) : null;

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
              {isSuiteContentLoading ? (
                <SuiteListSkeleton />
              ) : (
                <TestCaseList
                  testCases={testCases}
                  selectedId={selectedTestCaseId}
                  onSelect={handleSelectTestCase}
                />
              )}
            </SheetContent>
          </Sheet>
          <span className="text-sm text-muted-foreground">
            {isSuiteContentLoading ? "Loading suite..." : (selectedTestCase?.name || "Select a test case")}
          </span>
        </div>

        {/* Canvas content */}
        <div className="flex-1">
          {isSuiteContentLoading ? (
            <SuiteCanvasSkeleton />
          ) : (
            <SuiteCanvas
              suiteName={suiteName}
              suiteDescription={suiteDescription}
              selectedTestCase={selectedTestCase}
              suggestions={mockSuggestions}
              environments={environments}
              selectedEnvironmentId={selectedEnvironmentId}
              onEnvironmentChange={setSelectedEnvironmentId}
              onRunSuite={handleRunSuite}
              onAskAI={handleAskAI}
              onViewRuns={handleViewRuns}
              onCreateAssertion={handleCreateAssertion}
              onEditAssertion={handleOpenEditAssertion}
              onDeleteStep={handleDeleteTestStep}
              creatingAssertionStepId={creatingAssertionStepId}
              deletingStepId={deletingTestStepId}
              onOpenAddTestStep={() => setIsAddTestStepDialogOpen(true)}
              isCreatingTestStep={isCreatingTestStep}
            />
          )}
        </div>
        {addTestStepDialog}
        {editAssertionDialog}
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
            {isSuiteContentLoading ? (
              <SuiteListSkeleton />
            ) : (
              <TestCaseList
                testCases={testCases}
                selectedId={selectedTestCaseId}
                onSelect={handleSelectTestCase}
              />
            )}
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/30 transition-colors" />
          <ResizablePanel defaultSize={70} minSize={50}>
            {isSuiteContentLoading ? (
              <SuiteCanvasSkeleton />
            ) : (
              <SuiteCanvas
                suiteName={suiteName}
                suiteDescription={suiteDescription}
                selectedTestCase={selectedTestCase}
                suggestions={mockSuggestions}
                environments={environments}
                selectedEnvironmentId={selectedEnvironmentId}
                onEnvironmentChange={setSelectedEnvironmentId}
                onRunSuite={handleRunSuite}
                onAskAI={handleAskAI}
                onViewRuns={handleViewRuns}
                onCreateAssertion={handleCreateAssertion}
                onEditAssertion={handleOpenEditAssertion}
                onDeleteStep={handleDeleteTestStep}
                creatingAssertionStepId={creatingAssertionStepId}
                deletingStepId={deletingTestStepId}
                onOpenAddTestStep={() => setIsAddTestStepDialogOpen(true)}
                isCreatingTestStep={isCreatingTestStep}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      {addTestStepDialog}
      {editAssertionDialog}
    </div>
  );
}
