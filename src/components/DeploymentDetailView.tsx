import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  User,
  Clock,
  RefreshCw,
  Play,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DeploymentDetail {
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
  author: string;
  startedDate: string;
  timeline: {
    build: { duration: string; status: "success" | "failure" };
    deploy: { duration: string; status: "success" | "failure" };
    tests: { duration: string; status: "success" | "failure" };
  };
  runs: Array<{
    id: string;
    runId: string;
    suite: string;
    env: string;
    status: "Passed" | "Failed";
    duration: string;
    results: number;
  }>;
}

const mockDeploymentDetails: Record<string, DeploymentDetail> = {
  "dep-001": {
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
    author: "Sarah Chen",
    startedDate: "14/01/2024",
    timeline: {
      build: { duration: "45s", status: "success" },
      deploy: { duration: "1m 12s", status: "success" },
      tests: { duration: "3m 45s", status: "success" },
    },
    runs: [
      { id: "1", runId: "run-001", suite: "Auth E2E Suite", env: "Production", status: "Passed", duration: "1m 29s", results: 24 },
      { id: "2", runId: "run-002", suite: "Dashboard Tests", env: "Production", status: "Passed", duration: "2m 15s", results: 45 },
      { id: "3", runId: "run-003", suite: "API Integration", env: "Production", status: "Passed", duration: "1m 58s", results: 87 },
    ],
  },
  "dep-002": {
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
    author: "Mike Johnson",
    startedDate: "14/01/2024",
    timeline: {
      build: { duration: "52s", status: "success" },
      deploy: { duration: "1m 45s", status: "success" },
      tests: { duration: "4m 31s", status: "failure" },
    },
    runs: [
      { id: "1", runId: "run-004", suite: "Payment Flow", env: "Staging", status: "Failed", duration: "2m 45s", results: 32 },
      { id: "2", runId: "run-005", suite: "Checkout Tests", env: "Staging", status: "Passed", duration: "1m 58s", results: 28 },
    ],
  },
  "dep-003": {
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
    author: "Emily Davis",
    startedDate: "14/01/2024",
    timeline: {
      build: { duration: "1m 5s", status: "success" },
      deploy: { duration: "2m 10s", status: "success" },
      tests: { duration: "6m 12s", status: "success" },
    },
    runs: [
      { id: "1", runId: "run-006", suite: "DB Performance", env: "Production", status: "Passed", duration: "3m 12s", results: 56 },
      { id: "2", runId: "run-007", suite: "Query Tests", env: "Production", status: "Failed", duration: "2m 58s", results: 78 },
    ],
  },
  "dep-004": {
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
    author: "Alex Turner",
    startedDate: "14/01/2024",
    timeline: {
      build: { duration: "32s", status: "success" },
      deploy: { duration: "58s", status: "success" },
      tests: { duration: "1m 48s", status: "success" },
    },
    runs: [
      { id: "1", runId: "run-008", suite: "Login Suite", env: "Production", status: "Passed", duration: "1m 48s", results: 89 },
    ],
  },
};

function ResultBadge({ result }: { result: DeploymentDetail["result"] }) {
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

function RiskBadge({ risk }: { risk: DeploymentDetail["risk"] }) {
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

function StatusBadge({ status }: { status: "Passed" | "Failed" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        status === "Passed"
          ? "bg-green-500/10 text-green-600"
          : "bg-red-500/10 text-red-600"
      )}
    >
      {status === "Passed" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {status}
    </span>
  );
}

function MetadataCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-medium text-sm">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function TimelineNode({
  label,
  duration,
  status,
}: {
  label: string;
  duration: string;
  status: "success" | "failure";
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "w-3 h-3 rounded-full",
          status === "success" ? "bg-green-500" : "bg-red-500"
        )}
      />
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{duration}</span>
    </div>
  );
}

function RunCard({ run, onClick }: { run: DeploymentDetail["runs"][0]; onClick: () => void }) {
  return (
    <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-sm font-medium">{run.runId}</span>
        <StatusBadge status={run.status} />
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="font-medium text-foreground">{run.suite}</div>
        <div className="text-xs">{run.env}</div>
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span>{run.duration}</span>
        <span>{run.results} tests</span>
      </div>
    </Card>
  );
}

export function DeploymentDetailView() {
  const { deployId } = useParams<{ deployId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const deployment = deployId ? mockDeploymentDetails[deployId] : null;

  if (!deployment) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate("/deployments")}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Deployment not found</h1>
          </div>
          <p className="text-muted-foreground">
            The deployment "{deployId}" could not be found.
          </p>
        </div>
      </div>
    );
  }

  const handleAction = (action: string) => {
    toast({
      title: action,
      description: `${action} action triggered for ${deployment.deployId}`,
    });
  };

  const skippedTests = deployment.tests.total - deployment.tests.passed;

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/deployments")}
              className="p-2 rounded-lg hover:bg-muted transition-colors mt-0.5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold font-mono">
                  {deployment.deployId}
                </h1>
                <ResultBadge result={deployment.result} />
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {deployment.commit.message}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("Rerun affected")}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Rerun affected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("Rerun full")}
            >
              <Play className="w-4 h-4 mr-1" />
              Rerun full
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("Create issue")}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Create issue
            </Button>
          </div>
        </div>

        {/* Metadata Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetadataCard icon={GitBranch} label="Branch" value={deployment.branch} />
          <MetadataCard icon={GitCommit} label="Commit" value={deployment.commit.hash} />
          <MetadataCard icon={User} label="Author" value={deployment.author} />
          <MetadataCard icon={Clock} label="Started" value={deployment.startedDate} />
        </div>

        {/* Stats Card */}
        <Card className="p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
              <RiskBadge risk={deployment.risk} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Environment</p>
              <p className="font-medium text-sm">{deployment.env}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="font-medium text-sm">{deployment.duration}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tests</p>
              <p className="font-medium text-sm">
                {deployment.tests.passed} executed
                {skippedTests > 0 && `, ${skippedTests} skipped`}
              </p>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-4 md:p-6">
          <h2 className="font-semibold mb-4">Timeline</h2>
          <div className="flex items-center justify-between px-4 md:px-8">
            <TimelineNode
              label="Build"
              duration={deployment.timeline.build.duration}
              status={deployment.timeline.build.status}
            />
            <div
              className={cn(
                "flex-1 h-0.5 mx-2",
                deployment.timeline.build.status === "success"
                  ? "bg-green-500/30"
                  : "bg-red-500/30"
              )}
            />
            <TimelineNode
              label="Deploy"
              duration={deployment.timeline.deploy.duration}
              status={deployment.timeline.deploy.status}
            />
            <div
              className={cn(
                "flex-1 h-0.5 mx-2",
                deployment.timeline.deploy.status === "success"
                  ? "bg-green-500/30"
                  : "bg-red-500/30"
              )}
            />
            <TimelineNode
              label="Tests"
              duration={deployment.timeline.tests.duration}
              status={deployment.timeline.tests.status}
            />
          </div>
        </Card>

        {/* Runs Table/Cards */}
        <Card className="p-4 md:p-6">
          <h2 className="font-semibold mb-4">Runs in this deployment</h2>
          {isMobile ? (
            <div className="space-y-3">
              {deployment.runs.map((run) => (
                <RunCard
                  key={run.id}
                  run={run}
                  onClick={() => navigate(`/runs/${run.runId}`)}
                />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run ID</TableHead>
                    <TableHead>Suite</TableHead>
                    <TableHead>Env</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Results</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployment.runs.map((run) => (
                    <TableRow
                      key={run.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/runs/${run.runId}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        {run.runId}
                      </TableCell>
                      <TableCell>{run.suite}</TableCell>
                      <TableCell>{run.env}</TableCell>
                      <TableCell>
                        <StatusBadge status={run.status} />
                      </TableCell>
                      <TableCell>{run.duration}</TableCell>
                      <TableCell>{run.results}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
