import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2, Search, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchTestCasesTable, type TestCaseTableItem } from "@/lib/api/suites";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomSpacer } from "./LeftRail";

const TEST_CASE_PAGE_SIZE = 20;

function formatLastRun(lastRun: string | null): string {
  if (!lastRun) {
    return "Never";
  }

  const timestamp = Date.parse(lastRun);
  if (Number.isNaN(timestamp)) {
    return lastRun;
  }

  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

function StatusBadge({ status }: { status: TestCaseTableItem["status"] }) {
  const config = {
    passed: { icon: CheckCircle2, label: "Passed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    failed: { icon: XCircle, label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
    running: { icon: Clock, label: "Running", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    pending: { icon: AlertTriangle, label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  } as const;

  const { icon: Icon, label, className } = config[status];

  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function DesktopSkeletonTable() {
  return (
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
          {Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={index} className="hover:bg-transparent">
              <TableCell>
                <Skeleton className="h-4 w-56" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MobileSkeletonCards() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TestCasesListView() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { token, currentUser, isCurrentUserLoading } = useAuth();

  const accountId = currentUser?.default_account_id ?? null;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [testCases, setTestCases] = useState<TestCaseTableItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadTestCasesPage = useCallback(
    async (cursor: string | null, reset: boolean) => {
      if (!token || !accountId) {
        if (reset) {
          setTestCases([]);
          setNextCursor(null);
          setTotal(0);
        }
        setLoadError("Missing authentication context.");
        return;
      }

      setLoadError(null);
      if (reset) {
        setIsLoadingInitial(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await fetchTestCasesTable(accountId, token, {
          limit: TEST_CASE_PAGE_SIZE,
          search: debouncedSearch || undefined,
          cursor: cursor ?? undefined,
        });

        setTestCases((currentCases) => {
          if (reset) {
            return response.items;
          }

          const existingIds = new Set(currentCases.map((item) => item.id));
          const nextItems = response.items.filter((item) => !existingIds.has(item.id));
          return [...currentCases, ...nextItems];
        });
        setNextCursor(response.next_cursor);
        setTotal(response.total);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load test cases.";
        setLoadError(message);
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
      }
    },
    [accountId, debouncedSearch, token]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (isCurrentUserLoading) {
      return;
    }

    void loadTestCasesPage(null, true);
  }, [isCurrentUserLoading, loadTestCasesPage]);

  const handleLoadMore = () => {
    if (!nextCursor || isLoadingInitial || isLoadingMore || loadError) {
      return;
    }
    void loadTestCasesPage(nextCursor, false);
  };

  const handleRetry = () => {
    void loadTestCasesPage(null, true);
  };

  const handleTestCaseClick = (testCase: TestCaseTableItem) => {
    if (!testCase.suite_id) {
      return;
    }
    navigate(`/suites/${testCase.suite_id}?selectedCase=${testCase.id}`);
  };

  const handleSuiteClick = (event: MouseEvent<HTMLButtonElement>, suiteId: string) => {
    event.stopPropagation();
    if (!suiteId) {
      return;
    }
    navigate(`/suites/${suiteId}`);
  };

  const headerCount = isLoadingInitial ? "Loading test cases..." : `${Math.max(total, testCases.length)} test cases total`;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="p-4 md:p-6 border-b border-border/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Test Cases
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{headerCount}</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search test cases..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          {isLoadingInitial ? (
            isMobile ? (
              <MobileSkeletonCards />
            ) : (
              <DesktopSkeletonTable />
            )
          ) : loadError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              <p>{loadError}</p>
              <Button variant="outline" size="sm" onClick={handleRetry} className="mt-3">
                Retry
              </Button>
            </div>
          ) : testCases.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
              No test cases found.
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-3">
                  {testCases.map((testCase) => (
                    <Card
                      key={testCase.id}
                      className={cn(
                        "transition-colors",
                        testCase.suite_id ? "cursor-pointer hover:bg-muted/50" : "cursor-default"
                      )}
                      onClick={() => handleTestCaseClick(testCase)}
                    >
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <span className="text-sm font-medium leading-tight">{testCase.name}</span>
                          <StatusBadge status={testCase.status} />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {testCase.suite_id ? (
                            <button
                              onClick={(event) => handleSuiteClick(event, testCase.suite_id)}
                              className="text-primary hover:underline"
                            >
                              {testCase.suite_name}
                            </button>
                          ) : (
                            <span>{testCase.suite_name}</span>
                          )}
                          <span>{testCase.step_count} steps</span>
                          <span>{formatLastRun(testCase.last_run)}</span>
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
                      {testCases.map((testCase) => (
                        <TableRow
                          key={testCase.id}
                          className={cn("hover:bg-muted/50", testCase.suite_id ? "cursor-pointer" : "cursor-default")}
                          onClick={() => handleTestCaseClick(testCase)}
                        >
                          <TableCell className="font-medium max-w-md">
                            <span className="line-clamp-1">{testCase.name}</span>
                          </TableCell>
                          <TableCell>
                            {testCase.suite_id ? (
                              <button
                                onClick={(event) => handleSuiteClick(event, testCase.suite_id)}
                                className="text-primary hover:underline"
                              >
                                {testCase.suite_name}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">{testCase.suite_name}</span>
                            )}
                          </TableCell>
                          <TableCell>{testCase.step_count}</TableCell>
                          <TableCell>
                            <StatusBadge status={testCase.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatLastRun(testCase.last_run)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {nextCursor ? (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </ScrollArea>
      {isMobile ? <MobileBottomSpacer /> : null}
    </div>
  );
}
