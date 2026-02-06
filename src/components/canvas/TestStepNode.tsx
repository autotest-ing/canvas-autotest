import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { AssertionPopover } from "@/components/canvas/AssertionPopover";
import type { RunTestStep } from "@/components/RunTestCaseList";

interface TestStepNodeProps {
  step: RunTestStep;
  x: number;
  y: number;
}

function getStatusStyles(status: RunTestStep["status"]) {
  switch (status) {
    case "pass":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      };
    case "fail":
      return {
        bg: "bg-destructive/10",
        border: "border-destructive/30",
        icon: <XCircle className="w-4 h-4 text-destructive" />,
      };
    case "running":
      return {
        bg: "bg-primary/10",
        border: "border-primary/30",
        icon: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
      };
    default:
      return {
        bg: "bg-muted/40",
        border: "border-border/50",
        icon: <Clock className="w-4 h-4 text-muted-foreground" />,
      };
  }
}

function getMethodColor(method: RunTestStep["method"]) {
  switch (method) {
    case "GET":
      return "bg-blue-500/20 text-blue-600 border-blue-500/30";
    case "POST":
      return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30";
    case "PUT":
      return "bg-amber-500/20 text-amber-600 border-amber-500/30";
    case "PATCH":
      return "bg-orange-500/20 text-orange-600 border-orange-500/30";
    case "DELETE":
      return "bg-red-500/20 text-red-600 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function TestStepNode({ step, x, y }: TestStepNodeProps) {
  const styles = getStatusStyles(step.status);

  return (
    <div
      className="absolute flex flex-col items-center gap-1"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          {/* Main Circle */}
          <button
            className={cn(
              "relative w-12 h-12 rounded-full flex items-center justify-center",
              "border transition-all duration-200",
              "hover:scale-110 focus:outline-none cursor-pointer",
              styles.bg,
              styles.border
            )}
          >
            {styles.icon}
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="right" align="center" className="w-72 p-0">
          <AssertionPopover step={step} />
        </HoverCardContent>
      </HoverCard>

      {/* Name and Method Badge */}
      <div className="text-center max-w-28">
        <p className="text-[11px] font-medium text-foreground truncate leading-tight">
          {step.name}
        </p>
        <Badge
          variant="outline"
          className={cn(
            "mt-0.5 h-4 text-[9px] font-bold px-1.5 border",
            getMethodColor(step.method)
          )}
        >
          {step.method}
        </Badge>
      </div>
    </div>
  );
}
