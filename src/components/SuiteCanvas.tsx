import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Sparkles, CheckCircle2, AlertCircle, Lightbulb, BookOpen } from "lucide-react";
import type { Request } from "./RequestList";

interface Assertion {
  id: string;
  description: string;
  type: "status" | "body" | "header" | "timing";
  status: "pass" | "fail" | "pending";
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  type: "improvement" | "warning" | "insight";
}

interface SuiteCanvasProps {
  suiteName: string;
  suiteDescription?: string;
  selectedRequest: Request | null;
  assertions: Assertion[];
  suggestions: AISuggestion[];
  onRunSuite: () => void;
  onAskAI: () => void;
}

export function SuiteCanvas({
  suiteName,
  suiteDescription,
  selectedRequest,
  assertions,
  suggestions,
  onRunSuite,
  onAskAI,
}: SuiteCanvasProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-foreground">{suiteName}</h2>
          {suiteDescription && (
            <p className="text-sm text-muted-foreground mt-1">{suiteDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onAskAI} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Ask AI
          </Button>
          <Button size="sm" onClick={onRunSuite} className="gap-2">
            <Play className="w-4 h-4" />
            Run Suite
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Selected Request Details */}
          {selectedRequest && (
            <Card className="border-border/50 shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold px-2 py-0.5"
                  >
                    {selectedRequest.method}
                  </Badge>
                  <CardTitle className="text-base">{selectedRequest.name}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedRequest.endpoint}
                </p>
              </CardHeader>
            </Card>
          )}

          {/* Assertions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Assertions</h3>
              <Badge variant="secondary" className="text-xs">
                {assertions.filter(a => a.status === "pass").length}/{assertions.length} passing
              </Badge>
            </div>
            <div className="space-y-2">
              {assertions.map((assertion) => (
                <div
                  key={assertion.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      assertion.status === "pass"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : assertion.status === "fail"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {assertion.status === "pass" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : assertion.status === "fail" ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{assertion.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {assertion.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Knowledge</h3>
            </div>
            <Card className="border-border/50 bg-accent/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  This suite tests the authentication flow including login, token refresh, and session management. 
                  The endpoints follow OAuth 2.0 patterns with JWT tokens.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">AI Suggestions</h3>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-xl border ${
                    suggestion.type === "warning"
                      ? "bg-amber-500/5 border-amber-500/20"
                      : suggestion.type === "improvement"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-accent/50 border-border/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        suggestion.type === "warning"
                          ? "bg-amber-500/15 text-amber-600"
                          : suggestion.type === "improvement"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground">
                        {suggestion.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
