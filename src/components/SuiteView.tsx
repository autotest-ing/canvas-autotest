import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { RequestList, type Request } from "./RequestList";
import { SuiteCanvas } from "./SuiteCanvas";
import { MobileBottomSpacer } from "./LeftRail";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";

const mockRequests: Request[] = [
  { id: "1", method: "POST", endpoint: "/auth/login", name: "Login", status: "success" },
  { id: "2", method: "POST", endpoint: "/auth/refresh", name: "Refresh Token", status: "success" },
  { id: "3", method: "GET", endpoint: "/auth/me", name: "Get Current User", status: "success" },
  { id: "4", method: "POST", endpoint: "/auth/logout", name: "Logout", status: "pending" },
  { id: "5", method: "POST", endpoint: "/auth/register", name: "Register", status: "failure" },
  { id: "6", method: "POST", endpoint: "/auth/forgot-password", name: "Forgot Password", status: "pending" },
];

const mockAssertions = [
  { id: "1", description: "Response status should be 200", type: "status" as const, status: "pass" as const },
  { id: "2", description: "Response body should contain access_token", type: "body" as const, status: "pass" as const },
  { id: "3", description: "Token should be valid JWT format", type: "body" as const, status: "pass" as const },
  { id: "4", description: "Response time should be under 500ms", type: "timing" as const, status: "fail" as const },
  { id: "5", description: "Content-Type header should be application/json", type: "header" as const, status: "pass" as const },
];

const mockSuggestions = [
  {
    id: "1",
    title: "Add rate limiting test",
    description: "Consider adding a test for rate limiting behavior on the login endpoint to ensure security measures are working.",
    type: "improvement" as const,
  },
  {
    id: "2",
    title: "Slow response detected",
    description: "The /auth/login endpoint is responding slower than expected. Average response time is 650ms.",
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
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(mockRequests[0]?.id || null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const selectedRequest = mockRequests.find(r => r.id === selectedRequestId) || null;

  const handleRunSuite = () => {
    console.log("Running suite:", suiteId);
  };

  const handleAskAI = () => {
    console.log("Ask AI about suite:", suiteId);
  };

  const handleSelectRequest = (id: string) => {
    setSelectedRequestId(id);
    setMobileListOpen(false);
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Mobile header with list toggle */}
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <List className="w-4 h-4" />
                Requests
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <RequestList
                requests={mockRequests}
                selectedId={selectedRequestId}
                onSelect={handleSelectRequest}
              />
            </SheetContent>
          </Sheet>
          <span className="text-sm text-muted-foreground">
            {selectedRequest?.name || "Select a request"}
          </span>
        </div>

        {/* Canvas content */}
        <div className="flex-1">
          <SuiteCanvas
            suiteName="Auth Suite"
            suiteDescription="Authentication and authorization flow tests"
            selectedRequest={selectedRequest}
            assertions={mockAssertions}
            suggestions={mockSuggestions}
            onRunSuite={handleRunSuite}
            onAskAI={handleAskAI}
          />
        </div>
        <MobileBottomSpacer />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <RequestList
            requests={mockRequests}
            selectedId={selectedRequestId}
            onSelect={setSelectedRequestId}
          />
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border/50 hover:bg-primary/30 transition-colors" />
        <ResizablePanel defaultSize={70} minSize={50}>
          <SuiteCanvas
            suiteName="Auth Suite"
            suiteDescription="Authentication and authorization flow tests"
            selectedRequest={selectedRequest}
            assertions={mockAssertions}
            suggestions={mockSuggestions}
            onRunSuite={handleRunSuite}
            onAskAI={handleAskAI}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
