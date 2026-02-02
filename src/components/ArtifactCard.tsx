import { Layers, FileCode, Play, Check, X, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ArtifactType = "suite" | "request" | "run";

interface ArtifactCardProps {
  type: ArtifactType;
  title: string;
  subtitle?: string;
  status?: "success" | "failure" | "pending" | "running";
  meta?: string;
  onClick?: () => void;
}

const typeConfig = {
  suite: {
    icon: Layers,
    label: "Suite",
    cta: "Open suite",
  },
  request: {
    icon: FileCode,
    label: "Request",
    cta: "Inspect",
  },
  run: {
    icon: Play,
    label: "Run",
    cta: "View run",
  },
};

const statusConfig = {
  success: {
    icon: Check,
    className: "bg-success/10 text-success",
    label: "Passed",
  },
  failure: {
    icon: X,
    className: "bg-destructive/10 text-destructive",
    label: "Failed",
  },
  pending: {
    icon: Clock,
    className: "bg-muted text-muted-foreground",
    label: "Pending",
  },
  running: {
    icon: Play,
    className: "bg-primary/10 text-primary animate-pulse",
    label: "Running",
  },
};

export function ArtifactCard({ type, title, subtitle, status, meta, onClick }: ArtifactCardProps) {
  const { icon: TypeIcon, cta } = typeConfig[type];
  const statusInfo = status ? statusConfig[status] : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group bg-card rounded-xl p-4 shadow-soft transition-all duration-200 cursor-pointer",
        "hover:shadow-hover hover:scale-[1.01]",
        "animate-fade-up"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
          <TypeIcon className="w-5 h-5 text-accent-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground truncate">{title}</h4>
            {statusInfo && StatusIcon && (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                statusInfo.className
              )}>
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
          {meta && (
            <p className="text-xs text-muted-foreground mt-1">{meta}</p>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
          <span className="hidden sm:inline">{cta}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

// Method badge for requests
export function MethodBadge({ method }: { method: string }) {
  const colorMap: Record<string, string> = {
    GET: "bg-success/10 text-success",
    POST: "bg-primary/10 text-primary",
    PUT: "bg-warning/10 text-warning",
    PATCH: "bg-warning/10 text-warning",
    DELETE: "bg-destructive/10 text-destructive",
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-xs font-mono font-medium",
      colorMap[method] || "bg-muted text-muted-foreground"
    )}>
      {method}
    </span>
  );
}
