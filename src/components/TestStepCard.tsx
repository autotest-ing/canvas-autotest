import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import type { TestStep, Assertion } from "./TestCaseList";

interface TestStepCardProps {
  step: TestStep;
  stepNumber: number;
  isExpanded?: boolean;
}

const methodColors: Record<TestStep["method"], string> = {
  GET: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  POST: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  PUT: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  PATCH: "bg-orange-500/15 text-orange-600 border-orange-500/20",
  DELETE: "bg-red-500/15 text-red-600 border-red-500/20",
};

function AssertionIcon({ status }: { status: Assertion["status"] }) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    case "fail":
      return <AlertCircle className="w-3 h-3 text-destructive" />;
    default:
      return <Clock className="w-3 h-3 text-muted-foreground" />;
  }
}

function StepStatusIcon({ status }: { status?: TestStep["status"] }) {
  switch (status) {
    case "pass":
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        </div>
      );
    case "fail":
      return (
        <div className="w-6 h-6 rounded-full bg-destructive/15 flex items-center justify-center">
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      );
  }
}

export function TestStepCard({ step, stepNumber, isExpanded = false }: TestStepCardProps) {
  const [open, setOpen] = useState(isExpanded);
  const passedAssertions = step.assertions.filter(a => a.status === "pass").length;
  const totalAssertions = step.assertions.length;

  return (
    <Card className="border-border/50 overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center gap-4 hover:bg-accent/30 transition-colors text-left">
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-medium text-muted-foreground w-6">
                #{stepNumber}
              </span>
              <StepStatusIcon status={step.status} />
            </div>
            
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0 h-5 rounded-md shrink-0",
                methodColors[step.method]
              )}
            >
              {step.method}
            </Badge>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {step.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {step.endpoint}
              </p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="secondary" className="text-[10px]">
                {passedAssertions}/{totalAssertions} assertions
              </Badge>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0">
            <div className="border-t border-border/50 pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Assertions
              </p>
              {step.assertions.map((assertion) => (
                <div
                  key={assertion.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30"
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                      assertion.status === "pass"
                        ? "bg-emerald-500/15"
                        : assertion.status === "fail"
                        ? "bg-destructive/15"
                        : "bg-muted"
                    )}
                  >
                    <AssertionIcon status={assertion.status} />
                  </div>
                  <p className="flex-1 text-sm text-foreground">
                    {assertion.description}
                  </p>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {assertion.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
