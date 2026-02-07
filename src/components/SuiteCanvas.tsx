import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Sparkles, BookOpen, Plus, Check, X, Calendar, ChevronDown } from "lucide-react";
import { TestStepCard } from "./TestStepCard";
import type { TestCase, TestStep } from "./TestCaseList";
import type { Environment } from "@/lib/api/suites";
import type { CreateAssertionPayload, StepResultFullDetail } from "@/lib/api/suites";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

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
  onRunWithOverrides: () => void;
  onAskAI: () => void;
  onViewRuns?: () => void;
  onCreateAssertion?: (stepId: string, payload: CreateAssertionPayload) => Promise<void>;
  onEditAssertion?: (stepId: string, assertionId: string) => void;
  onDeleteStep?: (stepId: string) => Promise<void>;
  onFetchLatestResult?: (stepId: string) => Promise<StepResultFullDetail | null>;
  creatingAssertionStepId?: string | null;
  deletingStepId?: string | null;
  onOpenAddTestStep?: () => void;
  isCreatingTestStep?: boolean;
  onReorderSteps?: (testCaseId: string, reorderedSteps: TestStep[]) => Promise<void>;
  onSchedule?: () => void;
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
  onRunWithOverrides,
  onAskAI,
  onViewRuns,
  onCreateAssertion,
  onEditAssertion,
  onDeleteStep,
  onFetchLatestResult,
  creatingAssertionStepId,
  deletingStepId,
  onOpenAddTestStep,
  isCreatingTestStep = false,
  onReorderSteps,
  onSchedule,
}: SuiteCanvasProps) {
  const [isDragMode, setIsDragMode] = useState(false);
  const [localSteps, setLocalSteps] = useState<TestStep[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleEnableDragMode = useCallback(() => {
    if (selectedTestCase) {
      setLocalSteps([...selectedTestCase.steps]);
      setIsDragMode(true);
    }
  }, [selectedTestCase]);

  const handleCancelDragMode = useCallback(() => {
    setIsDragMode(false);
    setLocalSteps([]);
  }, []);

  const handleConfirmDragMode = useCallback(async () => {
    if (!selectedTestCase || !onReorderSteps) return;
    await onReorderSteps(selectedTestCase.id, localSteps);
    setIsDragMode(false);
    setLocalSteps([]);
  }, [selectedTestCase, localSteps, onReorderSteps]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const displaySteps = isDragMode ? localSteps : (selectedTestCase?.steps ?? []);

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
          <div className="inline-flex items-center">
            <Button
              size="sm"
              onClick={onRunSuite}
              className="gap-2 rounded-r-none border-r border-primary-foreground/30"
            >
              <Play className="w-4 h-4" />
              Run Suite
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  aria-label="Run suite options"
                  className="rounded-l-none px-2"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRunWithOverrides}>
                  Run with Overrides
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {onSchedule && (
            <Button variant="outline" size="sm" onClick={onSchedule} className="gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
          )}
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Test Steps
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      ({selectedTestCase.steps.length} step{selectedTestCase.steps.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDragMode ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={handleCancelDragMode}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => void handleConfirmDragMode()}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Save Order
                        </Button>
                      </>
                    ) : (
                      onOpenAddTestStep && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={onOpenAddTestStep}
                          disabled={isCreatingTestStep}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Add Test Step
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={displaySteps.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {displaySteps.map((step, index) => (
                        <TestStepCard
                          key={step.id}
                          step={step}
                          stepNumber={index + 1}
                          isExpanded={index === 0 && !isDragMode}
                          onCreateAssertion={onCreateAssertion}
                          onEditAssertion={onEditAssertion}
                          onDeleteStep={onDeleteStep}
                          onFetchLatestResult={onFetchLatestResult}
                          isCreatingAssertion={creatingAssertionStepId === step.id}
                          isDeletingStep={deletingStepId === step.id}
                          isDragMode={isDragMode}
                          onEnableDragMode={onReorderSteps ? handleEnableDragMode : undefined}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
