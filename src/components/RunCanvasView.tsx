import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, LayoutGrid, ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";
import { SuiteNode } from "@/components/canvas/SuiteNode";
import { TestCaseNode } from "@/components/canvas/TestCaseNode";
import { TestStepNode } from "@/components/canvas/TestStepNode";
import { NodeConnector } from "@/components/canvas/NodeConnector";
import { CanvasMinimap } from "@/components/canvas/CanvasMinimap";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

// Node radii (based on Tailwind classes)
const SUITE_NODE_RADIUS = 48;  // w-24 = 96px / 2
const CASE_NODE_RADIUS = 32;   // w-16 = 64px / 2
const STEP_NODE_RADIUS = 24;   // w-12 = 48px / 2

// Zoom constants
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

export function RunCanvasView({ runId, suiteId }: RunCanvasViewProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track viewport size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setViewportSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleRun = () => {
    console.log("Running test suite:", suiteId || runId);
  };

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomSlider = useCallback((value: number[]) => {
    setZoom(value[0]);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && (e.target as HTMLElement).closest('.canvas-content')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => Math.min(Math.max(z + delta, MIN_ZOOM), MAX_ZOOM));
    }
  }, []);

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

  // Calculate total canvas dimensions needed
  const canvasDimensions = useMemo(() => {
    let maxY = SUITE_Y + 100;
    let maxX = STEP_X + 150;
    nodePositions.cases.forEach((c) => {
      c.steps.forEach((s) => {
        maxY = Math.max(maxY, s.y + 80);
        maxX = Math.max(maxX, s.x + 100);
      });
      maxY = Math.max(maxY, c.y + 80);
    });
    return {
      width: Math.max(maxX + 100, 900),
      height: Math.max(maxY + 100, 700),
    };
  }, [nodePositions]);

  // Build minimap nodes data
  const minimapNodes = useMemo(() => {
    const nodes: Array<{
      x: number;
      y: number;
      type: "suite" | "case" | "step";
      status?: "pass" | "fail" | "pending" | "running" | "mixed";
    }> = [];

    // Suite node
    nodes.push({
      x: nodePositions.suite.x,
      y: nodePositions.suite.y,
      type: "suite",
      status: mockSuiteStatus,
    });

    // Case and step nodes
    nodePositions.cases.forEach((casePos) => {
      const testCase = mockTestCases.find((tc) => tc.id === casePos.id);
      nodes.push({
        x: casePos.x,
        y: casePos.y,
        type: "case",
        status: testCase?.status,
      });

      casePos.steps.forEach((stepPos) => {
        const step = testCase?.steps.find((s) => s.id === stepPos.id);
        nodes.push({
          x: stepPos.x,
          y: stepPos.y,
          type: "step",
          status: step?.status,
        });
      });
    });

    return nodes;
  }, [nodePositions]);

  const handlePanChange = useCallback((newPan: { x: number; y: number }) => {
    setPan(newPan);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
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

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1.5 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>

          <div className="w-24 px-2">
            <Slider
              value={[zoom]}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              onValueChange={handleZoomSlider}
              className="cursor-pointer"
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomReset}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset View</TooltipContent>
          </Tooltip>

          <span className="text-xs text-muted-foreground w-10 text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Pan indicator */}
      {isPanning && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/30">
            <Move className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Panning</span>
          </div>
        </div>
      )}

      {/* Canvas Container with zoom and pan transforms */}
      <div 
        className="canvas-content absolute inset-0"
        style={{ 
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
      >
        <div
          className="relative origin-top-left transition-transform duration-75"
          style={{
            width: canvasDimensions.width,
            minWidth: 900,
            height: canvasDimensions.height,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* SVG Connectors Layer */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: canvasDimensions.width, height: canvasDimensions.height }}
          >
            {/* Suite to Test Case connectors */}
            {nodePositions.cases.map((casePos) => (
              <NodeConnector
                key={`suite-to-${casePos.id}`}
                startX={nodePositions.suite.x + SUITE_NODE_RADIUS}
                startY={nodePositions.suite.y}
                endX={casePos.x - CASE_NODE_RADIUS}
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
                    startX={casePos.x + CASE_NODE_RADIUS}
                    startY={casePos.y}
                    endX={stepPos.x - STEP_NODE_RADIUS}
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
      </div>

      {/* Minimap */}
      <CanvasMinimap
        canvasWidth={canvasDimensions.width}
        canvasHeight={canvasDimensions.height}
        viewportWidth={viewportSize.width}
        viewportHeight={viewportSize.height}
        zoom={zoom}
        pan={pan}
        onPanChange={handlePanChange}
        nodes={minimapNodes}
      />

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
