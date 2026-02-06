import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Loader2, Layers } from "lucide-react";

interface SuiteNodeProps {
  name: string;
  status: "pass" | "fail" | "pending" | "running" | "mixed";
  testCaseCount: number;
  x: number;
  y: number;
}

function getStatusStyles(status: SuiteNodeProps["status"]) {
  switch (status) {
    case "pass":
      return {
        bg: "bg-emerald-500/20",
        border: "border-emerald-500/50",
        icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
        glow: "shadow-emerald-500/20",
      };
    case "fail":
      return {
        bg: "bg-destructive/20",
        border: "border-destructive/50",
        icon: <XCircle className="w-8 h-8 text-destructive" />,
        glow: "shadow-destructive/20",
      };
    case "running":
      return {
        bg: "bg-primary/20",
        border: "border-primary/50",
        icon: <Loader2 className="w-8 h-8 text-primary animate-spin" />,
        glow: "shadow-primary/20",
      };
    case "mixed":
      return {
        bg: "bg-amber-500/20",
        border: "border-amber-500/50",
        icon: <Layers className="w-8 h-8 text-amber-500" />,
        glow: "shadow-amber-500/20",
      };
    default:
      return {
        bg: "bg-muted",
        border: "border-border",
        icon: <Clock className="w-8 h-8 text-muted-foreground" />,
        glow: "",
      };
  }
}

export function SuiteNode({ name, status, testCaseCount, x, y }: SuiteNodeProps) {
  const styles = getStatusStyles(status);

  return (
    <div
      className="absolute flex flex-col items-center gap-2"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Main Circle */}
      <div
        className={cn(
          "relative w-24 h-24 rounded-full flex items-center justify-center",
          "border-2 transition-all duration-300",
          "hover:scale-105 cursor-pointer",
          "shadow-lg",
          styles.bg,
          styles.border,
          styles.glow && `shadow-xl ${styles.glow}`
        )}
      >
        {styles.icon}
        
        {/* Count Badge */}
        <Badge
          className={cn(
            "absolute -top-1 -right-1 h-6 min-w-6 rounded-full",
            "flex items-center justify-center text-xs font-bold",
            "bg-background border-2 border-border text-foreground"
          )}
        >
          {testCaseCount}
        </Badge>
      </div>

      {/* Name Label */}
      <div className="text-center max-w-28">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">Test Suite</p>
      </div>
    </div>
  );
}
