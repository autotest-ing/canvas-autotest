import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomSpacer } from "./LeftRail";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

interface TestCase {
  id: string;
  name: string;
  suiteId: string;
  suiteName: string;
  stepCount: number;
  status: "passed" | "failed" | "running" | "pending";
  lastRun: string;
}

// Mock test cases data aggregated from multiple suites
const mockTestCases: TestCase[] = [
  { id: "tc-1", name: "User can login with valid credentials", suiteId: "auth-suite", suiteName: "Auth Suite", stepCount: 5, status: "passed", lastRun: "2 hours ago" },
  { id: "tc-2", name: "User sees error with invalid password", suiteId: "auth-suite", suiteName: "Auth Suite", stepCount: 4, status: "passed", lastRun: "2 hours ago" },
  { id: "tc-3", name: "Password reset flow completes successfully", suiteId: "auth-suite", suiteName: "Auth Suite", stepCount: 7, status: "failed", lastRun: "2 hours ago" },
  { id: "tc-4", name: "GET /users returns user list", suiteId: "api-suite", suiteName: "API Suite", stepCount: 3, status: "passed", lastRun: "1 hour ago" },
  { id: "tc-5", name: "POST /users creates new user", suiteId: "api-suite", suiteName: "API Suite", stepCount: 4, status: "passed", lastRun: "1 hour ago" },
  { id: "tc-6", name: "DELETE /users/:id removes user", suiteId: "api-suite", suiteName: "API Suite", stepCount: 3, status: "running", lastRun: "5 min ago" },
  { id: "tc-7", name: "User completes checkout flow", suiteId: "e2e-suite", suiteName: "E2E Suite", stepCount: 12, status: "passed", lastRun: "30 min ago" },
  { id: "tc-8", name: "User adds item to cart", suiteId: "e2e-suite", suiteName: "E2E Suite", stepCount: 6, status: "pending", lastRun: "1 day ago" },
  { id: "tc-9", name: "User applies discount code", suiteId: "e2e-suite", suiteName: "E2E Suite", stepCount: 5, status: "failed", lastRun: "3 hours ago" },
];

function StatusBadge({ status }: { status: TestCase["status"] }) {
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

export function TestCasesListView() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTestCases = useMemo(() => {
    if (!searchQuery.trim()) return mockTestCases;
    const query = searchQuery.toLowerCase();
    return mockTestCases.filter(
      (tc) =>
        tc.name.toLowerCase().includes(query) ||
        tc.suiteName.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleTestCaseClick = (testCase: TestCase) => {
    navigate(`/suites/${testCase.suiteId}?selectedCase=${testCase.id}`);
  };

  const handleSuiteClick = (e: React.MouseEvent, suiteId: string) => {
    e.stopPropagation();
    navigate(`/suites/${suiteId}`);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Test Cases
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredTestCases.length} test cases total
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search test cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Test Cases List */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          {isMobile ? (
            <div className="space-y-3">
              {filteredTestCases.map((testCase) => (
                <Card
                  key={testCase.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleTestCaseClick(testCase)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium leading-tight">{testCase.name}</span>
                      <StatusBadge status={testCase.status} />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <button
                        onClick={(e) => handleSuiteClick(e, testCase.suiteId)}
                        className="text-primary hover:underline"
                      >
                        {testCase.suiteName}
                      </button>
                      <span>{testCase.stepCount} steps</span>
                      <span>{testCase.lastRun}</span>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Suite</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTestCases.map((testCase) => (
                    <TableRow
                      key={testCase.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleTestCaseClick(testCase)}
                    >
                      <TableCell className="font-medium max-w-md">
                        <span className="line-clamp-1">{testCase.name}</span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => handleSuiteClick(e, testCase.suiteId)}
                          className="text-primary hover:underline"
                        >
                          {testCase.suiteName}
                        </button>
                      </TableCell>
                      <TableCell>{testCase.stepCount}</TableCell>
                      <TableCell>
                        <StatusBadge status={testCase.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{testCase.lastRun}</TableCell>
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
