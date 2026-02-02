import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Request {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  name: string;
  status?: "success" | "failure" | "pending";
}

interface RequestListProps {
  requests: Request[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const methodColors: Record<Request["method"], string> = {
  GET: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  POST: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  PUT: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  PATCH: "bg-orange-500/15 text-orange-600 border-orange-500/20",
  DELETE: "bg-red-500/15 text-red-600 border-red-500/20",
};

export function RequestList({ requests, selectedId, onSelect }: RequestListProps) {
  return (
    <div className="h-full flex flex-col bg-card/50">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground">Requests</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{requests.length} endpoints</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {requests.map((request) => (
            <button
              key={request.id}
              onClick={() => onSelect(request.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                "hover:bg-accent/50",
                selectedId === request.id
                  ? "bg-accent shadow-soft"
                  : "bg-transparent"
              )}
            >
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0 h-5 rounded-md shrink-0",
                  methodColors[request.method]
                )}
              >
                {request.method}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {request.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {request.endpoint}
                </p>
              </div>
              {request.status && (
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    request.status === "success" && "bg-emerald-500",
                    request.status === "failure" && "bg-destructive",
                    request.status === "pending" && "bg-muted-foreground"
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
