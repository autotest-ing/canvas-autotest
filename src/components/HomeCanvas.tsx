import { useState } from "react";
import { PromptInput } from "./PromptInput";
import { PlanCard } from "./PlanCard";
import { ArtifactCard } from "./ArtifactCard";
import { Sparkles } from "lucide-react";

type ViewState = "empty" | "planning" | "executing" | "complete";

const mockPlanSteps = [
  { id: "1", title: "Import Postman collection", description: "Parse the uploaded .json file and extract all requests", status: "done" as const },
  { id: "2", title: "Normalize requests", description: "Standardize headers, params, and body formats", status: "done" as const },
  { id: "3", title: "Group into suites", description: "Organize requests by endpoint prefix into logical test suites", status: "in-progress" as const },
  { id: "4", title: "Generate assertions", description: "Create smart assertions based on response schemas", status: "pending" as const },
  { id: "5", title: "Run initial regression", description: "Execute all tests against the staging environment", status: "pending" as const },
];

const mockArtifacts = [
  { type: "suite" as const, title: "Auth Suite", subtitle: "5 requests", status: "success" as const, meta: "Last run 2m ago" },
  { type: "suite" as const, title: "Users API", subtitle: "12 requests", status: "success" as const, meta: "Last run 2m ago" },
  { type: "suite" as const, title: "Orders API", subtitle: "8 requests", status: "failure" as const, meta: "2 failures" },
  { type: "run" as const, title: "Regression Run #42", subtitle: "25 tests", status: "failure" as const, meta: "Duration: 1m 23s" },
];

export function HomeCanvas() {
  const [viewState, setViewState] = useState<ViewState>("empty");
  const [prompt, setPrompt] = useState("");

  const handlePromptSubmit = (value: string) => {
    setPrompt(value);
    setViewState("planning");
  };

  const handlePlanApprove = () => {
    setViewState("executing");
    // Simulate execution completing
    setTimeout(() => setViewState("complete"), 2000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-screen">
      {/* Empty state - Hero prompt */}
      {viewState === "empty" && (
        <div className="w-full max-w-2xl animate-fade-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI-powered API testing</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
              What do you want to test today?
            </h1>
            <p className="text-lg text-muted-foreground">
              Describe your testing goal and I'll create a plan
            </p>
          </div>
          <PromptInput 
            onSubmit={handlePromptSubmit}
            onPlan={() => setViewState("planning")}
          />
        </div>
      )}

      {/* Planning state */}
      {viewState === "planning" && (
        <div className="w-full max-w-xl">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-2">Understanding your request...</p>
            <p className="text-foreground font-medium">"{prompt}"</p>
          </div>
          <PlanCard
            title="Test Generation Plan"
            steps={mockPlanSteps}
            onApprove={handlePlanApprove}
            onEdit={() => {}}
          />
        </div>
      )}

      {/* Executing state */}
      {viewState === "executing" && (
        <div className="w-full max-w-xl text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-card shadow-soft animate-pulse">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="font-medium text-foreground">Executing plan...</span>
          </div>
        </div>
      )}

      {/* Complete state - Show artifacts */}
      {viewState === "complete" && (
        <div className="w-full max-w-2xl">
          {/* Mini prompt at top */}
          <div className="mb-8">
            <PromptInput 
              onSubmit={handlePromptSubmit}
              onPlan={() => {}}
            />
          </div>

          {/* Artifacts timeline */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">Generated artifacts</h2>
            {mockArtifacts.map((artifact, i) => (
              <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
                <ArtifactCard {...artifact} onClick={() => {}} />
              </div>
            ))}
          </div>

          {/* Quick action for failure */}
          <div className="mt-6 p-4 rounded-2xl bg-destructive/5 border border-destructive/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">2 tests failed after your last deploy</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  POST /orders endpoint returning 500. I can analyze and suggest a fix.
                </p>
              </div>
              <button className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">
                Fix with AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
