import { cn } from "@/lib/utils";

interface NodeConnectorProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  status: "pass" | "fail" | "pending" | "running" | "mixed";
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

export function NodeConnector({ startX, startY, endX, endY, status }: NodeConnectorProps) {
  // Calculate control points for smooth bezier curve
  const midX = (startX + endX) / 2;
  
  // Create a smooth horizontal bezier curve
  const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

  return (
    <g>
      {/* Background glow for running status */}
      {status === "running" && (
        <path
          d={path}
          fill="none"
          className="stroke-primary/20"
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
        strokeDasharray={status === "pending" ? "6 4" : "none"}
        style={{
          transition: "stroke 0.3s ease",
        }}
      />

      {/* Animated dots for running status */}
      {status === "running" && (
        <>
          <circle r="3" className="fill-primary">
            <animateMotion dur="1.5s" repeatCount="indefinite">
              <mpath href={`#path-${startX}-${startY}-${endX}-${endY}`} />
            </animateMotion>
          </circle>
          <defs>
            <path id={`path-${startX}-${startY}-${endX}-${endY}`} d={path} />
          </defs>
        </>
      )}
    </g>
  );
}
