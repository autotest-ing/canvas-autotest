import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, LayoutGrid, ZoomIn, ZoomOut, Maximize2, Move, Square, Pause } from "lucide-react";
import { SuiteNode } from "@/components/canvas/SuiteNode";
import { TestCaseNode } from "@/components/canvas/TestCaseNode";
import { TestStepNode } from "@/components/canvas/TestStepNode";
import { StepDetailDialog } from "@/components/canvas/StepDetailDialog";
import { NodeConnector } from "@/components/canvas/NodeConnector";
import { CanvasMinimap } from "@/components/canvas/CanvasMinimap";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSuiteExecution } from "@/hooks/use-suite-execution";
import { useAuth } from "@/context/AuthContext";
import type { RunTestStep } from "@/components/RunTestCaseList";

interface RunCanvasViewProps {
  runId?: string;
  suiteId?: string;
  environmentId?: string;
  variables?: Record<string, unknown>;
}

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

export function RunCanvasView({ runId, suiteId, environmentId, variables }: RunCanvasViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [selectedStep, setSelectedStep] = useState<RunTestStep | null>(null);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const hasAutoStarted = useRef(false);

  const { token } = useAuth();

  // WebSocket-driven suite execution
  const {
    testCases,
    suiteName,
    suiteStatus,
    runId: wsRunId,
    isRunning,
    error,
    startExecution,
    stopExecution,
  } = useSuiteExecution({
    token,
    suiteId,
    environmentId,
    variables,
  });

  const displayRunId = wsRunId || runId;
  const isAnimating = isRunning;

  // Set initial zoom for mobile
  useEffect(() => {
    if (isMobile) {
      setZoom(0.6);
      setPan({ x: 20, y: 80 });
    }
  }, [isMobile]);

  // Auto-start execution when autorun=true
  useEffect(() => {
    const autorun = searchParams.get("autorun");
    if (autorun === "true" && !hasAutoStarted.current && token && suiteId) {
      hasAutoStarted.current = true;
      startExecution();
    }
  }, [searchParams, token, suiteId, startExecution]);

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

  const handleRun = useCallback(() => {
    setIsPaused(false);
    hasAutoStarted.current = true;
    setSearchParams({ autorun: "true" });
    startExecution();
  }, [setSearchParams, startExecution]);

  const handleStop = useCallback(() => {
    setIsPaused(false);
    setSearchParams({});
    stopExecution();
  }, [setSearchParams, stopExecution]);

  const handlePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleStepClick = useCallback((step: RunTestStep) => {
    if (step.status === "pass" || step.status === "fail") {
      setSelectedStep(step);
      setStepDialogOpen(true);
    }
  }, []);

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

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Calculate node positions based on real data
  // Dynamically space test cases so their step nodes never overlap
  const nodePositions = useMemo(() => {
    const cases: Array<{ id: string; x: number; y: number; steps: Array<{ id: string; x: number; y: number }> }> = [];

    const CASE_GAP = 60; // minimum gap between the last step of one case and the first step of the next
    let nextCaseY = CASE_START_Y;

    testCases.forEach((testCase) => {
      const caseY = nextCaseY;
      const stepCount = Math.max(testCase.steps.length, 1);

      cases.push({
        id: testCase.id,
        x: CASE_X,
        y: caseY,
        steps: testCase.steps.map((step, stepIndex) => ({
          id: step.id,
          x: STEP_X,
          y: caseY + STEP_START_OFFSET_Y + stepIndex * STEP_SPACING_Y,
        })),
      });

      // The last step Y for this case
      const lastStepY = caseY + STEP_START_OFFSET_Y + (stepCount - 1) * STEP_SPACING_Y;
      // Next case starts so its first step won't overlap with this case's last step
      // First step of next case will be at nextCaseY + STEP_START_OFFSET_Y
      // We need: nextCaseY + STEP_START_OFFSET_Y > lastStepY + CASE_GAP
      nextCaseY = lastStepY + CASE_GAP - STEP_START_OFFSET_Y;
    });

    // Center the suite node vertically relative to test cases
    let suiteY = SUITE_Y;
    if (cases.length > 0) {
      const firstCaseY = cases[0].y;
      const lastCaseY = cases[cases.length - 1].y;
      suiteY = (firstCaseY + lastCaseY) / 2;
    }

    return { suite: { x: SUITE_X, y: suiteY }, cases };
  }, [testCases]);

  // Calculate total canvas dimensions needed
  const canvasDimensions = useMemo(() => {
    let maxY = nodePositions.suite.y + 100;
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
      status: suiteStatus,
    });

    // Case and step nodes
    nodePositions.cases.forEach((casePos) => {
      const testCase = testCases.find((tc) => tc.id === casePos.id);
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
  }, [nodePositions, testCases, suiteStatus]);

  const handlePanChange = useCallback((newPan: { x: number; y: number }) => {
    setPan(newPan);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
          <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <span className="text-xs sm:text-sm font-medium text-foreground">Canvas</span>
          {displayRunId && !isMobile && (
            <span className="text-xs text-muted-foreground">#{displayRunId.slice(0, 8)}</span>
          )}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-1 sm:px-2 sm:py-1.5 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-7 sm:w-7"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
              >
                <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>

          {!isMobile && (
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
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-7 sm:w-7"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-0.5 sm:mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-7 sm:w-7"
                onClick={handleZoomReset}
              >
                <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset View</TooltipContent>
          </Tooltip>

          {!isMobile && (
            <span className="text-xs text-muted-foreground w-10 text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
          )}
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

      {/* Error display */}
      {error && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20">
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/30">
            {error}
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
                status={testCases.find((tc) => tc.id === casePos.id)?.status || "pending"}
                isAnimating={isAnimating}
                isPaused={isPaused}
              />
            ))}

            {/* Test Case to Test Step connectors */}
            {nodePositions.cases.map((casePos) => {
              const testCase = testCases.find((tc) => tc.id === casePos.id);
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
                    isAnimating={isAnimating}
                    isPaused={isPaused}
                  />
                );
              });
            })}
          </svg>

          {/* Nodes Layer */}
          <div className="absolute inset-0">
            {/* Suite Node */}
            <SuiteNode
              name={suiteName || "Test Suite"}
              status={suiteStatus}
              testCaseCount={testCases.length}
              x={nodePositions.suite.x}
              y={nodePositions.suite.y}
            />

            {/* Test Case Nodes */}
            {nodePositions.cases.map((casePos) => {
              const testCase = testCases.find((tc) => tc.id === casePos.id);
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
              const testCase = testCases.find((tc) => tc.id === casePos.id);
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
                    onStepClick={handleStepClick}
                  />
                );
              });
            })}
          </div>
        </div>
      </div>

      {/* Minimap - hidden on mobile */}
      {!isMobile && (
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
      )}

      {/* Fixed Control Buttons */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-20 sm:translate-x-0 z-50 flex items-center gap-2">
        {!isAnimating ? (
          <Button onClick={handleRun} size={isMobile ? "default" : "lg"} className="gap-2 shadow-lg">
            <Play className="w-4 h-4" />
            Run
          </Button>
        ) : (
          <>
            <Button onClick={handlePause} size={isMobile ? "default" : "lg"} variant="secondary" className="gap-1.5 sm:gap-2 shadow-lg">
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  {!isMobile && "Resume"}
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  {!isMobile && "Pause"}
                </>
              )}
            </Button>
            <Button onClick={handleStop} size={isMobile ? "default" : "lg"} variant="destructive" className="gap-1.5 sm:gap-2 shadow-lg">
              <Square className="w-4 h-4" />
              {!isMobile && "Stop"}
            </Button>
          </>
        )}
      </div>

      {/* Step Detail Dialog */}
      <StepDetailDialog
        step={selectedStep}
        suiteId={suiteId}
        open={stepDialogOpen}
        onOpenChange={setStepDialogOpen}
      />
    </div>
  );
}
