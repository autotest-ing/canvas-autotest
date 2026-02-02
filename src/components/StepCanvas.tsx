import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Check } from "lucide-react";
import type { Step } from "./StepTimeline";

interface StepCanvasProps {
  step: Step | null;
  onFixWithAI: () => void;
}

// Mock data for the step details
const mockRequestData = `POST /api/orders HTTP/1.1
Host: api.staging.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "items": [
    { "productId": "prod_123", "quantity": 2 },
    { "productId": "prod_456", "quantity": 1 }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  }
}`;

const mockResponseData = `HTTP/1.1 500 Internal Server Error
Content-Type: application/json
X-Request-Id: req_abc123

{
  "error": {
    "code": "INVENTORY_CHECK_FAILED",
    "message": "Unable to verify product inventory",
    "details": {
      "productId": "prod_456",
      "reason": "Service unavailable"
    }
  }
}`;

const mockDiffData = {
  expected: `{
  "orderId": "ord_xxx",
  "status": "created",
  "total": 149.99
}`,
  actual: `{
  "error": {
    "code": "INVENTORY_CHECK_FAILED",
    "message": "Unable to verify product inventory"
  }
}`,
};

const mockAIExplanation = {
  summary: "The order creation failed because the inventory service is unavailable",
  rootCause: "The downstream inventory-service appears to be experiencing issues. The /api/orders endpoint depends on checking stock availability before confirming orders.",
  suggestion: "This is likely a transient infrastructure issue. The inventory service might be restarting or experiencing high load. Consider adding retry logic with exponential backoff.",
  confidence: "high" as const,
};

export function StepCanvas({ step, onFixWithAI }: StepCanvasProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const isFailed = step?.status === "failure";
  
  const handleCopy = (content: string, tab: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  if (!step) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a step to view details</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">{step.name}</h2>
            <Badge 
              variant={isFailed ? "destructive" : "secondary"}
              className="text-xs"
            >
              {step.status}
            </Badge>
          </div>
          {step.duration && (
            <p className="text-sm text-muted-foreground mt-1">
              Duration: {step.duration}
            </p>
          )}
        </div>
        {isFailed && (
          <Button size="sm" onClick={onFixWithAI} className="gap-2 shrink-0">
            <Sparkles className="w-4 h-4" />
            Fix with AI
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={isFailed ? "diff" : "request"} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 border-b border-border/50">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="diff" className="text-xs">Diff</TabsTrigger>
            <TabsTrigger value="request" className="text-xs">Request</TabsTrigger>
            <TabsTrigger value="response" className="text-xs">Response</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">AI Explanation</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Diff Tab */}
            <TabsContent value="diff" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Expected</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => handleCopy(mockDiffData.expected, "expected")}
                    >
                      {copiedTab === "expected" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <pre className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm font-mono text-foreground overflow-x-auto">
                    {mockDiffData.expected}
                  </pre>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Actual</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => handleCopy(mockDiffData.actual, "actual")}
                    >
                      {copiedTab === "actual" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <pre className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-sm font-mono text-foreground overflow-x-auto">
                    {mockDiffData.actual}
                  </pre>
                </div>
              </div>
            </TabsContent>

            {/* Request Tab */}
            <TabsContent value="request" className="mt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase">Request</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => handleCopy(mockRequestData, "request")}
                  >
                    {copiedTab === "request" ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <pre className="p-4 rounded-xl bg-muted/30 border border-border/50 text-sm font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                  {mockRequestData}
                </pre>
              </div>
            </TabsContent>

            {/* Response Tab */}
            <TabsContent value="response" className="mt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase">Response</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => handleCopy(mockResponseData, "response")}
                  >
                    {copiedTab === "response" ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <pre className={`p-4 rounded-xl text-sm font-mono text-foreground overflow-x-auto whitespace-pre-wrap ${
                  isFailed 
                    ? "bg-destructive/5 border border-destructive/20" 
                    : "bg-muted/30 border border-border/50"
                }`}>
                  {mockResponseData}
                </pre>
              </div>
            </TabsContent>

            {/* AI Explanation Tab */}
            <TabsContent value="ai" className="mt-0 space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Summary</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mockAIExplanation.summary}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Root Cause</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mockAIExplanation.rootCause}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Suggestion</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mockAIExplanation.suggestion}
                      </p>
                    </div>
                    <div className="pt-2">
                      <Badge variant="outline" className="text-xs">
                        Confidence: {mockAIExplanation.confidence}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
