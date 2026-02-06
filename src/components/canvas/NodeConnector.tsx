import { useMemo } from "react";

interface NodeConnectorProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  status: "pass" | "fail" | "pending" | "running" | "mixed";
}

function getStatusFill(status: NodeConnectorProps["status"]) {
  switch (status) {
    case "pass":
      return "hsl(var(--chart-2))"; // emerald
    case "fail":
    case "mixed":
      return "hsl(var(--destructive))";
    case "running":
      return "hsl(var(--primary))";
    default:
      return "hsl(var(--muted-foreground) / 0.4)";
  }
}

// Calculate point on cubic bezier curve at parameter t (0-1)
function bezierPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

export function NodeConnector({ startX, startY, endX, endY, status }: NodeConnectorProps) {
  const midX = (startX + endX) / 2;

  // Control points for bezier
  const p0 = { x: startX, y: startY };
  const p1 = { x: midX, y: startY };
  const p2 = { x: midX, y: endY };
  const p3 = { x: endX, y: endY };

  // Generate dots along the curve
  const dots = useMemo(() => {
    const numDots = 12;
    const points: { x: number; y: number; t: number }[] = [];
    
    for (let i = 0; i <= numDots; i++) {
      const t = i / numDots;
      const point = bezierPoint(t, p0, p1, p2, p3);
      points.push({ ...point, t });
    }
    
    return points;
  }, [p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y]);

  const pathId = `path-${startX}-${startY}-${endX}-${endY}`;
  const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  const fillColor = getStatusFill(status);

  return (
    <g>
      {/* Static dots along the path */}
      {dots.map((dot, index) => (
        <circle
          key={index}
          cx={dot.x}
          cy={dot.y}
          r={status === "running" ? 3.5 : 3}
          fill={fillColor}
          opacity={status === "pending" ? 0.4 : 0.7}
          style={{
            transition: "fill 0.3s ease, opacity 0.3s ease",
          }}
        />
      ))}

      {/* Animated pulsing dots for running status */}
      {status === "running" && (
        <>
          <defs>
            <path id={pathId} d={path} />
          </defs>
          
          {/* First pulsing dot */}
          <circle r="5" fill="hsl(var(--primary))" opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
              <mpath href={`#${pathId}`} />
            </animateMotion>
            <animate
              attributeName="r"
              values="4;6;4"
              dur="0.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.9;1;0.9"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Second pulsing dot (delayed) */}
          <circle r="5" fill="hsl(var(--primary))" opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear" begin="0.5s">
              <mpath href={`#${pathId}`} />
            </animateMotion>
            <animate
              attributeName="r"
              values="4;6;4"
              dur="0.6s"
              repeatCount="indefinite"
              begin="0.5s"
            />
            <animate
              attributeName="opacity"
              values="0.9;1;0.9"
              dur="0.6s"
              repeatCount="indefinite"
              begin="0.5s"
            />
          </circle>

          {/* Third pulsing dot (more delayed) */}
          <circle r="5" fill="hsl(var(--primary))" opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear" begin="1s">
              <mpath href={`#${pathId}`} />
            </animateMotion>
            <animate
              attributeName="r"
              values="4;6;4"
              dur="0.6s"
              repeatCount="indefinite"
              begin="1s"
            />
            <animate
              attributeName="opacity"
              values="0.9;1;0.9"
              dur="0.6s"
              repeatCount="indefinite"
              begin="1s"
            />
          </circle>
        </>
      )}
    </g>
  );
}
