import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface CanvasMinimapProps {
  canvasWidth: number;
  canvasHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  nodes: Array<{
    x: number;
    y: number;
    type: "suite" | "case" | "step";
    status?: "pass" | "fail" | "pending" | "running" | "mixed";
  }>;
}

const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 100;

function getNodeColor(status?: string) {
  switch (status) {
    case "pass":
      return "rgb(16, 185, 129)"; // emerald-500
    case "fail":
      return "rgb(239, 68, 68)"; // red-500
    case "running":
      return "rgb(20, 184, 166)"; // primary/teal
    case "mixed":
      return "rgb(251, 191, 36)"; // amber-400
    default:
      return "rgb(156, 163, 175)"; // gray-400
  }
}

export function CanvasMinimap({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  zoom,
  pan,
  onPanChange,
  nodes,
}: CanvasMinimapProps) {
  // Calculate scale to fit canvas in minimap
  const scale = useMemo(() => {
    const scaleX = MINIMAP_WIDTH / canvasWidth;
    const scaleY = MINIMAP_HEIGHT / canvasHeight;
    return Math.min(scaleX, scaleY);
  }, [canvasWidth, canvasHeight]);

  // Calculate viewport rectangle in minimap coordinates
  const viewportRect = useMemo(() => {
    const width = (viewportWidth / zoom) * scale;
    const height = (viewportHeight / zoom) * scale;
    const x = (-pan.x / zoom) * scale;
    const y = (-pan.y / zoom) * scale;
    return { x, y, width, height };
  }, [viewportWidth, viewportHeight, zoom, pan, scale]);

  // Handle click on minimap to navigate
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert click position to canvas coordinates
      const canvasX = clickX / scale;
      const canvasY = clickY / scale;

      // Center the viewport on the clicked position
      const newPanX = -(canvasX - viewportWidth / zoom / 2) * zoom;
      const newPanY = -(canvasY - viewportHeight / zoom / 2) * zoom;

      onPanChange({ x: newPanX, y: newPanY });
    },
    [scale, viewportWidth, viewportHeight, zoom, onPanChange]
  );

  // Handle drag on minimap
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const startPan = { ...pan };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        // Convert minimap movement to canvas pan
        const panDeltaX = -(deltaX / scale) * zoom;
        const panDeltaY = -(deltaY / scale) * zoom;

        onPanChange({
          x: startPan.x - panDeltaX,
          y: startPan.y - panDeltaY,
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [pan, scale, zoom, onPanChange]
  );

  return (
    <div
      className={cn(
        "absolute bottom-20 right-4 z-10",
        "bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg",
        "overflow-hidden cursor-pointer"
      )}
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Canvas background */}
      <div className="absolute inset-0 bg-muted/30" />

      {/* Render nodes as dots */}
      <svg
        className="absolute inset-0"
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
      >
        {nodes.map((node, index) => {
          const x = node.x * scale;
          const y = node.y * scale;
          const radius = node.type === "suite" ? 6 : node.type === "case" ? 4 : 3;
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={radius}
              fill={getNodeColor(node.status)}
              className="opacity-80"
            />
          );
        })}

        {/* Connection lines (simplified) */}
        {nodes.filter(n => n.type === "suite").map((suite, si) => (
          nodes.filter(n => n.type === "case").map((caseNode, ci) => (
            <line
              key={`suite-${si}-case-${ci}`}
              x1={suite.x * scale}
              y1={suite.y * scale}
              x2={caseNode.x * scale}
              y2={caseNode.y * scale}
              stroke="rgb(156, 163, 175)"
              strokeWidth={0.5}
              strokeDasharray="2,2"
              opacity={0.4}
            />
          ))
        ))}
      </svg>

      {/* Viewport indicator */}
      <div
        className={cn(
          "absolute border-2 border-primary rounded-sm",
          "bg-primary/10 transition-all duration-75"
        )}
        style={{
          left: Math.max(0, viewportRect.x),
          top: Math.max(0, viewportRect.y),
          width: Math.min(viewportRect.width, MINIMAP_WIDTH - Math.max(0, viewportRect.x)),
          height: Math.min(viewportRect.height, MINIMAP_HEIGHT - Math.max(0, viewportRect.y)),
        }}
      />

      {/* Label */}
      <div className="absolute bottom-1 left-1.5 text-[9px] font-medium text-muted-foreground/70">
        Minimap
      </div>
    </div>
  );
}
