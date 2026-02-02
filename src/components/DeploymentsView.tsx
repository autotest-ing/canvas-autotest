import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PageTitle } from "@/components/PageTitle";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

interface Deployment {
  id: string;
  deployId: string;
  repo: string;
  branch: string;
  commit: {
    hash: string;
    message: string;
  };
  env: "Production" | "Staging" | "Development";
  risk: {
    score: number;
    level: "Low" | "Medium" | "High";
  };
  result: "Passed" | "Failed" | "Partial";
  started: string;
  duration: string;
  tests: {
    passed: number;
    total: number;
  };
}

const mockDeployments: Deployment[] = [
  {
    id: "1",
    deployId: "dep-001",
    repo: "autotest/webapp",
    branch: "main",
    commit: { hash: "a1b2c3d", message: "feat: add new dashboard widgets" },
    env: "Production",
    risk: { score: 23, level: "Low" },
    result: "Passed",
    started: "2 min ago",
    duration: "5m 42s",
    tests: { passed: 156, total: 160 },
  },
  {
    id: "2",
    deployId: "dep-002",
    repo: "autotest/webapp",
    branch: "feature/payments",
    commit: { hash: "e4f5g6h", message: "fix: payment gateway integration" },
    env: "Staging",
    risk: { score: 67, level: "High" },
    result: "Failed",
    started: "15 min ago",
    duration: "7m 8s",
    tests: { passed: 189, total: 191 },
  },
  {
    id: "3",
    deployId: "dep-003",
    repo: "autotest/api",
    branch: "main",
    commit: { hash: "i7j8k9l", message: "refactor: optimize database queries" },
    env: "Production",
    risk: { score: 45, level: "Medium" },
    result: "Partial",
    started: "1 hour ago",
    duration: "9m 27s",
    tests: { passed: 234, total: 246 },
  },
  {
    id: "4",
    deployId: "dep-004",
    repo: "autotest/webapp",
    branch: "hotfix/login",
    commit: { hash: "m0n1o2p", message: "hotfix: resolve login timeout issue" },
    env: "Production",
    risk: { score: 12, level: "Low" },
    result: "Passed",
    started: "3 hours ago",
    duration: "3m 18s",
    tests: { passed: 89, total: 89 },
  },
];

function ResultBadge({ result }: { result: Deployment["result"] }) {
  const styles = {
    Passed: "bg-green-500/10 text-green-600 border-green-500/20",
    Failed: "bg-red-500/10 text-red-600 border-red-500/20",
    Partial: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        styles[result]
      )}
    >
      {result}
    </span>
  );
}

function RiskBadge({ risk }: { risk: Deployment["risk"] }) {
  const styles = {
    Low: "bg-green-500/15 text-green-600",
    Medium: "bg-amber-500/15 text-amber-600",
    High: "bg-red-500/15 text-red-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
        styles[risk.level]
      )}
    >
      {risk.score} {risk.level}
    </span>
  );
}

function DeploymentCard({ deployment, onClick }: { deployment: Deployment; onClick: () => void }) {
  return (
    <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-sm font-medium">{deployment.deployId}</span>
        <ResultBadge result={deployment.result} />
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="font-medium text-foreground">
          {deployment.repo} / <span className="text-primary">{deployment.branch}</span>
        </div>
        <div className="truncate text-xs">{deployment.commit.message}</div>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span className="font-medium">{deployment.env}</span>
        <RiskBadge risk={deployment.risk} />
        <span>{deployment.duration}</span>
        <span>
          {deployment.tests.passed}/{deployment.tests.total} tests
        </span>
      </div>
    </Card>
  );
}

type SortKey = "deployId" | "repo" | "branch" | "env" | "risk" | "result" | "duration" | "tests";
type SortDirection = "asc" | "desc";

export function DeploymentsView() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const branches = useMemo(
    () => [...new Set(mockDeployments.map((d) => d.branch))],
    []
  );

  const filteredDeployments = useMemo(() => {
    return mockDeployments.filter((d) => {
      const matchesSearch =
        search === "" ||
        d.deployId.toLowerCase().includes(search.toLowerCase()) ||
        d.repo.toLowerCase().includes(search.toLowerCase()) ||
        d.branch.toLowerCase().includes(search.toLowerCase()) ||
        d.commit.message.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || d.result === statusFilter;
      const matchesEnv = envFilter === "all" || d.env === envFilter;
      const matchesBranch = branchFilter === "all" || d.branch === branchFilter;

      return matchesSearch && matchesStatus && matchesEnv && matchesBranch;
    });
  }, [search, statusFilter, envFilter, branchFilter]);

  const sortedDeployments = useMemo(() => {
    if (!sortKey) return filteredDeployments;

    return [...filteredDeployments].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortKey) {
        case "deployId":
          aVal = a.deployId;
          bVal = b.deployId;
          break;
        case "repo":
          aVal = a.repo;
          bVal = b.repo;
          break;
        case "branch":
          aVal = a.branch;
          bVal = b.branch;
          break;
        case "env":
          aVal = a.env;
          bVal = b.env;
          break;
        case "risk":
          aVal = a.risk.score;
          bVal = b.risk.score;
          break;
        case "result":
          aVal = a.result;
          bVal = b.result;
          break;
        case "duration":
          aVal = a.duration;
          bVal = b.duration;
          break;
        case "tests":
          aVal = a.tests.passed / a.tests.total;
          bVal = b.tests.passed / b.tests.total;
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filteredDeployments, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <PageTitle>Deployments</PageTitle>
          <p className="text-muted-foreground text-sm mt-1">
            All deployments and their test results
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deployments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Passed">Passed</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={envFilter} onValueChange={setEnvFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Envs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Envs</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Staging">Staging</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isMobile ? (
          <div className="space-y-3">
            {sortedDeployments.map((deployment) => (
              <DeploymentCard
                key={deployment.id}
                deployment={deployment}
                onClick={() => navigate(`/deployments/${deployment.deployId}`)}
              />
            ))}
            {sortedDeployments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No deployments found
              </p>
            )}
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden bg-white dark:bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("deployId")}>
                    <div className="flex items-center">Deploy ID <SortIcon columnKey="deployId" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("repo")}>
                    <div className="flex items-center">Repo <SortIcon columnKey="repo" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("branch")}>
                    <div className="flex items-center">Branch <SortIcon columnKey="branch" /></div>
                  </TableHead>
                  <TableHead>Commit</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("env")}>
                    <div className="flex items-center">Env <SortIcon columnKey="env" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("risk")}>
                    <div className="flex items-center">Risk <SortIcon columnKey="risk" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("result")}>
                    <div className="flex items-center">Result <SortIcon columnKey="result" /></div>
                  </TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("duration")}>
                    <div className="flex items-center">Duration <SortIcon columnKey="duration" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("tests")}>
                    <div className="flex items-center">Tests <SortIcon columnKey="tests" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDeployments.map((deployment) => (
                  <TableRow
                    key={deployment.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/deployments/${deployment.deployId}`)}
                  >
                    <TableCell className="font-mono text-sm">
                      {deployment.deployId}
                    </TableCell>
                    <TableCell>{deployment.repo}</TableCell>
                    <TableCell className="text-primary font-medium">
                      {deployment.branch}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-muted-foreground">
                          {deployment.commit.hash}
                        </span>
                        <span className="text-sm truncate max-w-[200px]">
                          {deployment.commit.message}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{deployment.env}</TableCell>
                    <TableCell>
                      <RiskBadge risk={deployment.risk} />
                    </TableCell>
                    <TableCell>
                      <ResultBadge result={deployment.result} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {deployment.started}
                    </TableCell>
                    <TableCell>{deployment.duration}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          deployment.tests.passed === deployment.tests.total
                            ? "text-green-600"
                            : "text-amber-600"
                        )}
                      >
                        {deployment.tests.passed}/{deployment.tests.total}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedDeployments.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-8"
                    >
                      No deployments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
