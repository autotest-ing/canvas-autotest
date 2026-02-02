import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, SkipForward, Clock } from "lucide-react";

export interface Step {
  id: string;
  name: string;
  status: "success" | "failure" | "skipped" | "running" | "pending";
  duration?: string;
}

interface StepTimelineProps {
  steps: Step[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusIcons: Record<Step["status"], React.ElementType> = {
  success: CheckCircle2,
  failure: XCircle,
  skipped: SkipForward,
  running: Clock,
  pending: Clock,
};

const statusStyles: Record<Step["status"], string> = {
  success: "text-emerald-500",
  failure: "text-destructive",
  skipped: "text-muted-foreground",
  running: "text-primary animate-pulse",
  pending: "text-muted-foreground/50",
};

export function StepTimeline({ steps, selectedId, onSelect }: StepTimelineProps) {
  return (
    <div className="h-full flex flex-col bg-card/50">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground">Steps</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {steps.filter(s => s.status === "success").length}/{steps.length} passed
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {steps.map((step, index) => {
            const Icon = statusIcons[step.status];
            const isSelected = selectedId === step.id;
            
            return (
              <div key={step.id} className="relative">
                {/* Timeline connector */}
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "absolute left-[22px] top-10 w-0.5 h-4",
                      steps[index + 1].status === "pending" 
                        ? "bg-border/30" 
                        : "bg-border"
                    )}
                  />
                )}
                
                <button
                  onClick={() => onSelect(step.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                    "hover:bg-accent/50",
                    isSelected ? "bg-accent shadow-soft" : "bg-transparent"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 flex items-center justify-center shrink-0",
                    statusStyles[step.status]
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      step.status === "pending" 
                        ? "text-muted-foreground/50" 
                        : "text-foreground"
                    )}>
                      {step.name}
                    </p>
                  </div>
                  {step.duration && step.status !== "pending" && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {step.duration}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
