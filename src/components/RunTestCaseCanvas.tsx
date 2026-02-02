import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, CheckCircle2, XCircle, Clock, Copy, Check, Sparkles } from "lucide-react";
import type { RunTestStep, RunTestCase } from "./RunTestCaseList";

interface RunTestCaseCanvasProps {
  testCase: RunTestCase | null;
  onFixWithAI: (stepId: string) => void;
}

const methodColors: Record<RunTestStep["method"], string> = {
  GET: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  POST: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  PUT: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  PATCH: "bg-orange-500/15 text-orange-600 border-orange-500/20",
  DELETE: "bg-red-500/15 text-red-600 border-red-500/20",
};

function StepStatusIcon({ status }: { status: RunTestStep["status"] }) {
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
          <XCircle className="w-3.5 h-3.5 text-destructive" />
        </div>
      );
    case "running":
      return (
        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
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

// Mock data for step details
const mockStepDetails = {
  request: `POST /auth/login HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "********"
}`,
  response: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "expires_in": 3600
}`,
  assertions: [
    { id: "1", description: "Response status should be 200", status: "pass" as const },
    { id: "2", description: "Response body should contain access_token", status: "pass" as const },
    { id: "3", description: "Token should be valid JWT format", status: "pass" as const },
  ],
};

function RunStepCard({ step, stepNumber, isExpanded = false, onFixWithAI }: { 
  step: RunTestStep; 
  stepNumber: number; 
  isExpanded?: boolean;
  onFixWithAI: () => void;
}) {
  const [open, setOpen] = useState(isExpanded);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const isFailed = step.status === "fail";

  const handleCopy = (content: string, tab: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

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
              {step.duration && (
                <span className="text-xs text-muted-foreground">{step.duration}</span>
              )}
              <Badge variant="secondary" className="text-[10px]">
                {step.assertionsPassed}/{step.assertionsTotal}
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
            <div className="border-t border-border/50 pt-3">
              <Tabs defaultValue={isFailed ? "assertions" : "request"}>
                <div className="flex items-center justify-between mb-3">
                  <TabsList className="bg-muted/50 h-8">
                    <TabsTrigger value="assertions" className="text-xs h-6">Assertions</TabsTrigger>
                    <TabsTrigger value="request" className="text-xs h-6">Request</TabsTrigger>
                    <TabsTrigger value="response" className="text-xs h-6">Response</TabsTrigger>
                  </TabsList>
                  {isFailed && (
                    <Button size="sm" variant="outline" onClick={onFixWithAI} className="gap-1.5 h-7 text-xs">
                      <Sparkles className="w-3 h-3" />
                      Fix with AI
                    </Button>
                  )}
                </div>

                <TabsContent value="assertions" className="mt-0 space-y-2">
                  {mockStepDetails.assertions.map((assertion) => (
                    <div
                      key={assertion.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30"
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                          assertion.status === "pass"
                            ? "bg-emerald-500/15"
                            : "bg-destructive/15"
                        )}
                      >
                        {assertion.status === "pass" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-destructive" />
                        )}
                      </div>
                      <p className="flex-1 text-sm text-foreground">
                        {assertion.description}
                      </p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="request" className="mt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Request</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={() => handleCopy(mockStepDetails.request, "request")}
                      >
                        {copiedTab === "request" ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <pre className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                      {mockStepDetails.request}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="response" className="mt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Response</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={() => handleCopy(mockStepDetails.response, "response")}
                      >
                        {copiedTab === "response" ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <pre className={cn(
                      "p-3 rounded-lg text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap",
                      isFailed 
                        ? "bg-destructive/5 border border-destructive/20" 
                        : "bg-muted/30 border border-border/50"
                    )}>
                      {mockStepDetails.response}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function RunTestCaseCanvas({ testCase, onFixWithAI }: RunTestCaseCanvasProps) {
  if (!testCase) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a test case to view results</p>
      </div>
    );
  }

  const passedSteps = testCase.steps.filter(s => s.status === "pass").length;
  const failedSteps = testCase.steps.filter(s => s.status === "fail").length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">{testCase.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              {testCase.duration && (
                <span className="text-sm text-muted-foreground">Duration: {testCase.duration}</span>
              )}
              <div className="flex items-center gap-2">
                {passedSteps > 0 && (
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    {passedSteps} passed
                  </Badge>
                )}
                {failedSteps > 0 && (
                  <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                    {failedSteps} failed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Test Steps
            </h3>
            <span className="text-xs text-muted-foreground">
              ({testCase.steps.length} step{testCase.steps.length !== 1 ? "s" : ""})
            </span>
          </div>
          
          {testCase.steps.map((step, index) => (
            <RunStepCard
              key={step.id}
              step={step}
              stepNumber={index + 1}
              isExpanded={step.status === "fail"}
              onFixWithAI={() => onFixWithAI(step.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
