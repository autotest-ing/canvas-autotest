import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Sparkles, BookOpen } from "lucide-react";
import { TestStepCard } from "./TestStepCard";
import type { TestCase } from "./TestCaseList";
import type { Environment } from "@/lib/api/suites";
import type { CreateAssertionPayload } from "@/lib/api/suites";

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  type: "improvement" | "warning" | "insight";
}

interface SuiteCanvasProps {
  suiteName: string;
  suiteDescription?: string;
  selectedTestCase: TestCase | null;
  suggestions: AISuggestion[];
  environments: Environment[];
  selectedEnvironmentId: string | null;
  onEnvironmentChange: (environmentId: string | null) => void;
  onRunSuite: () => void;
  onAskAI: () => void;
  onViewRuns?: () => void;
  onCreateAssertion?: (stepId: string, payload: CreateAssertionPayload) => Promise<void>;
  creatingAssertionStepId?: string | null;
}

export function SuiteCanvas({
  suiteName,
  suiteDescription,
  selectedTestCase,
  suggestions,
  environments,
  selectedEnvironmentId,
  onEnvironmentChange,
  onRunSuite,
  onAskAI,
  onViewRuns,
  onCreateAssertion,
  creatingAssertionStepId,
}: SuiteCanvasProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">{suiteName}</h2>
          {suiteDescription && (
            <p className="text-sm text-muted-foreground mt-1">{suiteDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onAskAI} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Ask AI
          </Button>
          <Select
            value={selectedEnvironmentId ?? "none"}
            onValueChange={(val) => onEnvironmentChange(val === "none" ? null : val)}
          >
            <SelectTrigger className="h-8 w-[140px] text-sm">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Environment</SelectItem>
              {environments.map((env) => (
                <SelectItem key={env.id} value={env.id}>
                  {env.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={onRunSuite} className="gap-2">
            <Play className="w-4 h-4" />
            Run Suite
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Selected Test Case Details */}
          {selectedTestCase ? (
            <>
              {/* Test Case Header */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">
                  {selectedTestCase.name}
                </h3>
                {selectedTestCase.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTestCase.description}
                  </p>
                )}
              </div>

              {/* Test Steps */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Test Steps
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    ({selectedTestCase.steps.length} step{selectedTestCase.steps.length !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedTestCase.steps.map((step, index) => (
                    <TestStepCard
                      key={step.id}
                      step={step}
                      stepNumber={index + 1}
                      isExpanded={index === 0}
                      onCreateAssertion={onCreateAssertion}
                      isCreatingAssertion={creatingAssertionStepId === step.id}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Select a test case to view its steps and assertions
                </p>
              </CardContent>
            </Card>
          )}

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
              <Sparkles className="w-4 h-4 text-muted-foreground" />
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
