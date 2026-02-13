import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface VariableHighlightedTextProps {
  text: string;
  variables?: Record<string, string> | null;
}

export function VariableHighlightedText({
  text,
  variables,
}: VariableHighlightedTextProps) {
  if (!variables || Object.keys(variables).length === 0) {
    return <>{text}</>;
  }

  // Split on {{variable_name}} patterns, keeping the delimiters
  const parts = text.split(/(\{\{[^}]+\}\})/g);

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\{\{(.+)\}\}$/);
        if (match) {
          const varName = match[1].trim();
          const resolvedValue = variables[varName];
          if (resolvedValue !== undefined) {
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <span className="bg-primary/10 text-primary rounded px-0.5 cursor-help border-b border-dashed border-primary/40">
                    {part}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="text-xs">
                    <div className="font-medium text-muted-foreground">
                      {varName}
                    </div>
                    <div className="font-mono mt-0.5 break-all">
                      {String(resolvedValue)}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          }
          // Variable not resolved — show without tooltip
          return (
            <span
              key={index}
              className="bg-muted/50 text-muted-foreground rounded px-0.5"
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
