import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import type { RunTestCase } from "@/components/RunTestCaseList";

interface TestCaseNodeProps {
  testCase: RunTestCase;
  x: number;
  y: number;
  isSelected: boolean;
  onClick: () => void;
}

function getStatusStyles(status: RunTestCase["status"]) {
  switch (status) {
    case "pass":
      return {
        bg: "bg-emerald-500/15",
        border: "border-emerald-500/40",
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        ring: "ring-emerald-500/30",
      };
    case "fail":
    case "mixed":
      return {
        bg: "bg-destructive/15",
        border: "border-destructive/40",
        icon: <XCircle className="w-5 h-5 text-destructive" />,
        ring: "ring-destructive/30",
      };
    case "running":
      return {
        bg: "bg-primary/15",
        border: "border-primary/40",
        icon: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
        ring: "ring-primary/30",
      };
    default:
      return {
        bg: "bg-muted/50",
        border: "border-border",
        icon: <Clock className="w-5 h-5 text-muted-foreground" />,
        ring: "ring-muted-foreground/20",
      };
  }
}

export function TestCaseNode({ testCase, x, y, isSelected, onClick }: TestCaseNodeProps) {
  const styles = getStatusStyles(testCase.status);

  return (
    <div
      className="absolute flex flex-col items-center gap-1.5"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Main Circle */}
      <button
        onClick={onClick}
        className={cn(
          "relative w-16 h-16 rounded-full flex items-center justify-center",
          "border-2 transition-all duration-200",
          "hover:scale-110 focus:outline-none",
          styles.bg,
          styles.border,
          isSelected && `ring-2 ${styles.ring} scale-110`
        )}
      >
        {styles.icon}

        {/* Steps Count Badge */}
        <Badge
          variant="secondary"
          className={cn(
            "absolute -bottom-1 -right-1 h-5 min-w-5 px-1.5 rounded-full",
            "flex items-center justify-center text-[10px] font-medium",
            "bg-background border border-border"
          )}
        >
          {testCase.steps.length}
        </Badge>
      </button>

      {/* Name Label */}
      <div className="text-center max-w-24">
        <p className="text-xs font-medium text-foreground truncate leading-tight">
          {testCase.name}
        </p>
        {testCase.duration && (
          <p className="text-[10px] text-muted-foreground">{testCase.duration}</p>
        )}
      </div>
    </div>
  );
}
