import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomSpacer } from "./LeftRail";
import { useAuth } from "@/context/AuthContext";
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  X,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchAllRuns,
  type AllRunsItem,
  type RunStatus,
  type FetchAllRunsParams,
} from "@/lib/api/suites";

type SortField = "started_at" | "finished_at" | "status" | "created_at";

function StatusBadge({ status }: { status: RunStatus }) {
  const config: Record<
    RunStatus,
    { icon: typeof CheckCircle2; label: string; className: string }
  > = {
    success: {
      icon: CheckCircle2,
      label: "Passed",
      className:
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    running: {
      icon: Clock,
      label: "Running",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    canceled: {
      icon: Ban,
      label: "Canceled",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
  };

  const { icon: Icon, label, className } = config[status] ?? config.canceled;

  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <Icon className={cn("w-3 h-3", status === "running" && "animate-pulse")} />
      {label}
    </Badge>
  );
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentDesc,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDesc: boolean;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort === field;
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentDesc ? (
            <ArrowDown className="w-3.5 h-3.5 text-foreground" />
          ) : (
            <ArrowUp className="w-3.5 h-3.5 text-foreground" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
}

function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "--";
  const ms =
    new Date(finishedAt).getTime() - new Date(startedAt).getTime();
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

interface RunsListViewProps {
  suiteId?: string;
}

export function RunsListView({ suiteId }: RunsListViewProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { token, currentUser } = useAuth();
  const accountId = currentUser?.default_account_id;

  // State
  const [runs, setRuns] = useState<AllRunsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Filters / Search / Sort
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortField>("started_at");
  const [sortDesc, setSortDesc] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const loadRuns = useCallback(
    async (cursor?: string) => {
      if (!token || !accountId) return;
      setIsLoading(true);
      setError(null);

      const params: FetchAllRunsParams = {
        sort_by: sortBy,
        sort_desc: sortDesc,
        limit: 20,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.status = statusFilter;
      if (cursor) params.cursor = cursor;

      try {
        const result = await fetchAllRuns(accountId, token, params);
        if (cursor) {
          setRuns((prev) => [...prev, ...result.items]);
        } else {
          setRuns(result.items);
        }
        setTotal(result.total);
        setNextCursor(result.next_cursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load runs");
      } finally {
        setIsLoading(false);
      }
    },
    [token, accountId, debouncedSearch, statusFilter, sortBy, sortDesc]
  );

  // Reload on filter/sort/search change
  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDesc((d) => !d);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
  };

  const handleRunClick = (run: AllRunsItem) => {
    if (suiteId) {
      navigate(`/suites/${suiteId}/runs/${run.id}`);
    } else {
      navigate(`/runs/${run.id}`);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !isLoading) {
      loadRuns(nextCursor);
    }
  };

  const handleRunSuite = () => {
    console.log("Running suite:", suiteId);
  };

  const passedCases = (run: AllRunsItem) => run.summary.passed_cases ?? 0;
  const failedCases = (run: AllRunsItem) => run.summary.failed_cases ?? 0;
  const totalCases = (run: AllRunsItem) => run.summary.total_cases ?? 0;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              All Runs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} run{total !== 1 ? "s" : ""} total
            </p>
          </div>
          {suiteId && (
            <Button size="sm" onClick={handleRunSuite} className="gap-2">
              <Play className="w-4 h-4" />
              Run Suite
            </Button>
          )}
        </div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by suite name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as RunStatus | "all")}
          >
            <SelectTrigger className="w-full sm:w-[160px] h-9">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="success">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 md:mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-auto p-0 text-destructive underline"
            onClick={() => loadRuns()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          {isLoading && runs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading runs...</span>
            </div>
          ) : runs.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <p>No runs found</p>
              {(debouncedSearch || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : isMobile ? (
            /* Mobile Card Layout */
            <div className="space-y-3">
              {runs.map((run) => (
                <Card
                  key={run.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRunClick(run)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground truncate mr-2">
                        {run.suite_name}
                      </span>
                      <StatusBadge status={run.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {passedCases(run)}/{totalCases(run)} passed
                      </span>
                      <span>
                        {formatDuration(run.started_at, run.finished_at)}
                      </span>
                      <span>{formatTimeAgo(run.started_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Desktop Table Layout */
            <div className="rounded-xl border border-border/50 overflow-hidden bg-white dark:bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Suite</TableHead>
                    <SortableHeader
                      label="Status"
                      field="status"
                      currentSort={sortBy}
                      currentDesc={sortDesc}
                      onSort={handleSort}
                    />
                    <TableHead>Tests</TableHead>
                    <TableHead>Duration</TableHead>
                    <SortableHeader
                      label="Started"
                      field="started_at"
                      currentSort={sortBy}
                      currentDesc={sortDesc}
                      onSort={handleSort}
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow
                      key={run.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRunClick(run)}
                    >
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {run.suite_name}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={run.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-emerald-600">
                          {passedCases(run)}
                        </span>
                        <span className="text-muted-foreground"> / </span>
                        <span>{totalCases(run)}</span>
                        {failedCases(run) > 0 && (
                          <span className="text-destructive ml-2">
                            ({failedCases(run)} failed)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDuration(run.started_at, run.finished_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTimeAgo(run.started_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Load More */}
          {nextCursor && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
      {isMobile && <MobileBottomSpacer />}
    </div>
  );
}
