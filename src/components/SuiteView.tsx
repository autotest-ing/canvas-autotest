import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { TestCaseList, type TestCase } from "./TestCaseList";
import { SuiteCanvas } from "./SuiteCanvas";
import { MobileBottomSpacer } from "./LeftRail";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";

// Mock data with proper hierarchy: Suite → Test Cases → Test Steps → Assertions
const mockTestCases: TestCase[] = [
  {
    id: "1",
    name: "User Login Flow",
    description: "Validates complete login flow with valid credentials",
    status: "pass",
    steps: [
      {
        id: "1-1",
        name: "Submit Login Request",
        method: "POST",
        endpoint: "/auth/login",
        status: "pass",
        assertions: [
          { id: "1-1-1", description: "Response status should be 200", type: "status", status: "pass" },
          { id: "1-1-2", description: "Response body should contain access_token", type: "body", status: "pass" },
          { id: "1-1-3", description: "Token should be valid JWT format", type: "schema", status: "pass" },
        ],
      },
      {
        id: "1-2",
        name: "Verify User Session",
        method: "GET",
        endpoint: "/auth/me",
        status: "pass",
        assertions: [
          { id: "1-2-1", description: "Response status should be 200", type: "status", status: "pass" },
          { id: "1-2-2", description: "User object should contain email", type: "body", status: "pass" },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Token Refresh Flow",
    description: "Tests token refresh mechanism before expiry",
    status: "mixed",
    steps: [
      {
        id: "2-1",
        name: "Request Token Refresh",
        method: "POST",
        endpoint: "/auth/refresh",
        status: "pass",
        assertions: [
          { id: "2-1-1", description: "Response status should be 200", type: "status", status: "pass" },
          { id: "2-1-2", description: "New access_token should be returned", type: "body", status: "pass" },
        ],
      },
      {
        id: "2-2",
        name: "Validate New Token",
        method: "GET",
        endpoint: "/auth/validate",
        status: "fail",
        assertions: [
          { id: "2-2-1", description: "Response time should be under 500ms", type: "timing", status: "fail" },
          { id: "2-2-2", description: "Token claims should match", type: "body", status: "pass" },
        ],
      },
    ],
  },
  {
    id: "3",
    name: "User Registration",
    description: "Complete new user registration flow",
    status: "fail",
    steps: [
      {
        id: "3-1",
        name: "Submit Registration",
        method: "POST",
        endpoint: "/auth/register",
        status: "fail",
        assertions: [
          { id: "3-1-1", description: "Response status should be 201", type: "status", status: "fail" },
          { id: "3-1-2", description: "User ID should be returned", type: "body", status: "pending" },
        ],
      },
      {
        id: "3-2",
        name: "Verify Email Sent",
        method: "GET",
        endpoint: "/auth/verify-email-status",
        status: "pending",
        assertions: [
          { id: "3-2-1", description: "Email status should be 'sent'", type: "body", status: "pending" },
        ],
      },
    ],
  },
  {
    id: "4",
    name: "Logout Flow",
    description: "Tests user logout and session invalidation",
    status: "pending",
    steps: [
      {
        id: "4-1",
        name: "Submit Logout",
        method: "POST",
        endpoint: "/auth/logout",
        status: "pending",
        assertions: [
          { id: "4-1-1", description: "Response status should be 200", type: "status", status: "pending" },
          { id: "4-1-2", description: "Session should be invalidated", type: "body", status: "pending" },
        ],
      },
      {
        id: "4-2",
        name: "Verify Session Invalidated",
        method: "GET",
        endpoint: "/auth/me",
        status: "pending",
        assertions: [
          { id: "4-2-1", description: "Response status should be 401", type: "status", status: "pending" },
        ],
      },
    ],
  },
];

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

// Mock suite metadata
const mockSuiteData: Record<string, { name: string; description: string }> = {
  "auth-suite": { name: "Auth Suite", description: "Authentication and authorization flow tests" },
  "api-suite": { name: "API Suite", description: "Core API endpoint tests" },
  "e2e-suite": { name: "E2E Suite", description: "End-to-end user journey tests" },
};

interface SuiteViewProps {
  suiteId?: string;
}

export function SuiteView({ suiteId = "auth-suite" }: SuiteViewProps) {
  const navigate = useNavigate();
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(mockTestCases[0]?.id || null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const selectedTestCase = mockTestCases.find(tc => tc.id === selectedTestCaseId) || null;
  const suiteData = mockSuiteData[suiteId] || mockSuiteData["auth-suite"];

  const handleRunSuite = () => {
    console.log("Running suite:", suiteId);
  };

  const handleAskAI = () => {
    console.log("Ask AI about suite:", suiteId);
  };

  const handleSelectTestCase = (id: string) => {
    setSelectedTestCaseId(id);
    setMobileListOpen(false);
  };

  const handleViewRuns = () => {
    navigate(`/suites/${suiteId}/runs`);
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
                testCases={mockTestCases}
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
            suiteName={suiteData.name}
            suiteDescription={suiteData.description}
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
              testCases={mockTestCases}
              selectedId={selectedTestCaseId}
              onSelect={setSelectedTestCaseId}
            />
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/30 transition-colors" />
          <ResizablePanel defaultSize={70} minSize={50}>
            <SuiteCanvas
              suiteName={suiteData.name}
              suiteDescription={suiteData.description}
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
