import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Play, LayoutGrid } from "lucide-react";
import { SuiteNode } from "@/components/canvas/SuiteNode";
import { TestCaseNode } from "@/components/canvas/TestCaseNode";
import { TestStepNode } from "@/components/canvas/TestStepNode";
import { NodeConnector } from "@/components/canvas/NodeConnector";
import type { RunTestCase, RunTestStep } from "@/components/RunTestCaseList";

interface RunCanvasViewProps {
  runId?: string;
  suiteId?: string;
}

// Mock data for demonstration
const mockTestCases: RunTestCase[] = [
  {
    id: "tc-1",
    name: "User Authentication",
    status: "pass",
    duration: "1.2s",
    steps: [
      { id: "step-1-1", name: "Sign In", method: "POST", endpoint: "/auth/login", status: "pass", duration: "0.4s", assertionsPassed: 3, assertionsTotal: 3 },
      { id: "step-1-2", name: "Verify Token", method: "GET", endpoint: "/auth/verify", status: "pass", duration: "0.3s", assertionsPassed: 2, assertionsTotal: 2 },
    ],
  },
  {
    id: "tc-2",
    name: "Create Lead",
    status: "fail",
    duration: "2.1s",
    steps: [
      { id: "step-2-1", name: "Submit Lead", method: "POST", endpoint: "/leads", status: "pass", duration: "0.8s", assertionsPassed: 4, assertionsTotal: 4 },
      { id: "step-2-2", name: "Validate Response", method: "GET", endpoint: "/leads/123", status: "fail", duration: "0.5s", assertionsPassed: 1, assertionsTotal: 3 },
      { id: "step-2-3", name: "Check Webhook", method: "POST", endpoint: "/webhooks", status: "pending", duration: undefined, assertionsPassed: 0, assertionsTotal: 2 },
    ],
  },
  {
    id: "tc-3",
    name: "List Leads API",
    status: "running",
    duration: undefined,
    steps: [
      { id: "step-3-1", name: "Get All Leads", method: "GET", endpoint: "/leads", status: "running", duration: undefined, assertionsPassed: 0, assertionsTotal: 5 },
    ],
  },
];

const mockSuiteName = "Leads API";
const mockSuiteStatus: "pass" | "fail" | "pending" | "running" | "mixed" = "mixed";

// Layout constants
const SUITE_X = 100;
const SUITE_Y = 300;
const CASE_X = 350;
const CASE_START_Y = 120;
const CASE_SPACING_Y = 200;
const STEP_X = 600;
const STEP_START_OFFSET_Y = -40;
const STEP_SPACING_Y = 100;

export function RunCanvasView({ runId, suiteId }: RunCanvasViewProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const handleRun = () => {
    console.log("Running test suite:", suiteId || runId);
  };

  // Calculate node positions
  const nodePositions = useMemo(() => {
    const positions: {
      suite: { x: number; y: number };
      cases: Array<{ id: string; x: number; y: number; steps: Array<{ id: string; x: number; y: number }> }>;
    } = {
      suite: { x: SUITE_X, y: SUITE_Y },
      cases: [],
    };

    mockTestCases.forEach((testCase, caseIndex) => {
      const caseY = CASE_START_Y + caseIndex * CASE_SPACING_Y;
      const casePosition = {
        id: testCase.id,
        x: CASE_X,
        y: caseY,
        steps: testCase.steps.map((step, stepIndex) => ({
          id: step.id,
          x: STEP_X,
          y: caseY + STEP_START_OFFSET_Y + stepIndex * STEP_SPACING_Y,
        })),
      };
      positions.cases.push(casePosition);
    });

    return positions;
  }, []);

  // Calculate total canvas height needed
  const canvasHeight = useMemo(() => {
    let maxY = SUITE_Y + 100;
    nodePositions.cases.forEach((c) => {
      c.steps.forEach((s) => {
        maxY = Math.max(maxY, s.y + 80);
      });
      maxY = Math.max(maxY, c.y + 80);
    });
    return Math.max(maxY + 100, 700);
  }, [nodePositions]);

  return (
    <div className="relative w-full h-screen overflow-auto">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Run Canvas</span>
          {runId && (
            <span className="text-xs text-muted-foreground">#{runId.slice(0, 8)}</span>
          )}
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        className="relative"
        style={{ 
          width: "100%", 
          minWidth: 900,
          height: canvasHeight,
        }}
      >
        {/* SVG Connectors Layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: canvasHeight }}
        >
          {/* Suite to Test Case connectors */}
          {nodePositions.cases.map((casePos) => (
            <NodeConnector
              key={`suite-to-${casePos.id}`}
              startX={nodePositions.suite.x + 50}
              startY={nodePositions.suite.y}
              endX={casePos.x - 35}
              endY={casePos.y}
              status={mockTestCases.find((tc) => tc.id === casePos.id)?.status || "pending"}
            />
          ))}

          {/* Test Case to Test Step connectors */}
          {nodePositions.cases.map((casePos) => {
            const testCase = mockTestCases.find((tc) => tc.id === casePos.id);
            return casePos.steps.map((stepPos) => {
              const step = testCase?.steps.find((s) => s.id === stepPos.id);
              return (
                <NodeConnector
                  key={`${casePos.id}-to-${stepPos.id}`}
                  startX={casePos.x + 35}
                  startY={casePos.y}
                  endX={stepPos.x - 30}
                  endY={stepPos.y}
                  status={step?.status || "pending"}
                />
              );
            });
          })}
        </svg>

        {/* Nodes Layer */}
        <div className="absolute inset-0">
          {/* Suite Node */}
          <SuiteNode
            name={mockSuiteName}
            status={mockSuiteStatus}
            testCaseCount={mockTestCases.length}
            x={nodePositions.suite.x}
            y={nodePositions.suite.y}
          />

          {/* Test Case Nodes */}
          {nodePositions.cases.map((casePos) => {
            const testCase = mockTestCases.find((tc) => tc.id === casePos.id);
            if (!testCase) return null;
            return (
              <TestCaseNode
                key={testCase.id}
                testCase={testCase}
                x={casePos.x}
                y={casePos.y}
                isSelected={selectedCaseId === testCase.id}
                onClick={() => setSelectedCaseId(testCase.id === selectedCaseId ? null : testCase.id)}
              />
            );
          })}

          {/* Test Step Nodes */}
          {nodePositions.cases.map((casePos) => {
            const testCase = mockTestCases.find((tc) => tc.id === casePos.id);
            if (!testCase) return null;
            return casePos.steps.map((stepPos) => {
              const step = testCase.steps.find((s) => s.id === stepPos.id);
              if (!step) return null;
              return (
                <TestStepNode
                  key={step.id}
                  step={step}
                  x={stepPos.x}
                  y={stepPos.y}
                />
              );
            });
          })}
        </div>
      </div>

      {/* Fixed Run Button */}
      <div className="fixed bottom-6 left-20 z-50">
        <Button onClick={handleRun} size="lg" className="gap-2 shadow-lg">
          <Play className="w-4 h-4" />
          Run
        </Button>
      </div>
    </div>
  );
}
