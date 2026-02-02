import { useState } from "react";
import { Check, Circle, ChevronDown, ChevronRight, Pencil, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanStep {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "done";
}

interface PlanCardProps {
  title: string;
  steps: PlanStep[];
  onApprove: () => void;
  onEdit?: () => void;
}

export function PlanCard({ title, steps, onApprove, onEdit }: PlanCardProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (id: string) => {
    const next = new Set(expandedSteps);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedSteps(next);
  };

  const StatusIcon = ({ status }: { status: PlanStep["status"] }) => {
    switch (status) {
      case "done":
        return (
          <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
            <Check className="w-3 h-3 text-success-foreground" />
          </div>
        );
      case "in-progress":
        return (
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        );
      default:
        return (
          <Circle className="w-5 h-5 text-muted-foreground" />
        );
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-card rounded-2xl shadow-soft animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {steps.length} steps · {steps.filter(s => s.status === "done").length} completed
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="p-2">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="absolute left-[22px] top-10 w-0.5 h-[calc(100%-24px)] bg-border" />
            )}

            <button
              onClick={() => step.description && toggleStep(step.id)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left",
                step.description && "hover:bg-secondary/50 cursor-pointer"
              )}
            >
              <StatusIcon status={step.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium",
                    step.status === "done" && "text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                  {step.description && (
                    expandedSteps.has(step.id) 
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                {step.description && expandedSteps.has(step.id) && (
                  <p className="mt-1 text-sm text-muted-foreground animate-fade-in">
                    {step.description}
                  </p>
                )}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-border">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Pencil className="w-4 h-4" />
          <span>Edit plan</span>
        </button>
        <button
          onClick={onApprove}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-soft"
        >
          <Check className="w-4 h-4" />
          <span>Approve & Execute</span>
        </button>
      </div>
    </div>
  );
}
