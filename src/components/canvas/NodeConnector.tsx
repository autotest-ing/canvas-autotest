import { cn } from "@/lib/utils";

interface NodeConnectorProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  status: "pass" | "fail" | "pending" | "running" | "mixed";
  isAnimating?: boolean;
  isPaused?: boolean;
}

function getStatusColor(status: NodeConnectorProps["status"]) {
  switch (status) {
    case "pass":
      return "stroke-emerald-500/60";
    case "fail":
    case "mixed":
      return "stroke-destructive/60";
    case "running":
      return "stroke-primary/60";
    default:
      return "stroke-muted-foreground/40";
  }
}

function getAnimatingDotColor(status: NodeConnectorProps["status"]) {
  switch (status) {
    case "pass":
      return "fill-emerald-500";
    case "fail":
    case "mixed":
      return "fill-destructive";
    case "running":
      return "fill-primary";
    default:
      return "fill-muted-foreground";
  }
}

export function NodeConnector({ 
  startX, 
  startY, 
  endX, 
  endY, 
  status,
  isAnimating = false,
  isPaused = false,
}: NodeConnectorProps) {
  // Calculate control points for smooth bezier curve
  const midX = (startX + endX) / 2;
  
  // Create a smooth horizontal bezier curve
  const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  const pathId = `path-${startX}-${startY}-${endX}-${endY}`;

  const showAnimation = isAnimating || status === "running";
  const animationState = isPaused ? "paused" : "running";

  return (
    <g>
      {/* Background glow for running/animating status */}
      {showAnimation && (
        <path
          d={path}
          fill="none"
          className={cn(
            status === "running" ? "stroke-primary/20" : "stroke-primary/15"
          )}
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      
      {/* Main connector line */}
      <path
        d={path}
        fill="none"
        className={cn(getStatusColor(status))}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={status === "pending" && !isAnimating ? "6 4" : "none"}
        style={{
          transition: "stroke 0.3s ease",
        }}
      />

      {/* Animated dots for running/animating status */}
      {showAnimation && (
        <>
          <defs>
            <path id={pathId} d={path} />
          </defs>
          
          {/* Three staggered dots traveling along the path */}
          {[0, 0.33, 0.66].map((delay, index) => (
            <circle 
              key={index} 
              r="4" 
              className={cn(
                getAnimatingDotColor(status),
                "drop-shadow-sm"
              )}
              style={{ opacity: 0.9 - index * 0.2 }}
            >
              <animateMotion 
                dur="2s" 
                repeatCount="indefinite"
                begin={`${delay}s`}
                style={{ animationPlayState: animationState }}
              >
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
          ))}
        </>
      )}
    </g>
  );
}
