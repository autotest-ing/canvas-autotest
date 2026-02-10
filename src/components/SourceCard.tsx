import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileJson, FileCode, RefreshCw, Layers, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SourceType = "postman" | "openapi" | "swagger";

export interface Source {
  id: string;
  name: string;
  description?: string | null;
  type: SourceType;
  lastSync: string;
  requestCount: number;
  status: "synced" | "pending" | "error";
}

interface SourceCardProps {
  source: Source;
  onCreateSuite: (id: string) => void;
  onResync: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeConfig: Record<SourceType, { icon: typeof FileJson; label: string; color: string }> = {
  postman: {
    icon: FileJson,
    label: "Postman",
    color: "bg-orange-500/15 text-orange-600 border-orange-500/20",
  },
  openapi: {
    icon: FileCode,
    label: "OpenAPI",
    color: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  },
  swagger: {
    icon: FileCode,
    label: "Swagger",
    color: "bg-green-500/15 text-green-600 border-green-500/20",
  },
};

const statusConfig = {
  synced: {
    label: "Synced",
    color: "bg-emerald-500/15 text-emerald-600",
  },
  pending: {
    label: "Pending",
    color: "bg-amber-500/15 text-amber-600",
  },
  error: {
    label: "Sync Error",
    color: "bg-destructive/15 text-destructive",
  },
};

export function SourceCard({ source, onCreateSuite, onResync, onDelete }: SourceCardProps) {
  const typeInfo = typeConfig[source.type];
  const statusInfo = statusConfig[source.status];
  const TypeIcon = typeInfo.icon;

  return (
    <div className="bg-card rounded-2xl p-4 md:p-5 shadow-sm border border-border/50 hover:shadow-hover transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Type Icon & Content Row for Mobile */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Type Icon */}
          <div className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0",
            typeInfo.color.split(" ")[0]
          )}>
            <TypeIcon className={cn("w-5 h-5 md:w-6 md:h-6", typeInfo.color.split(" ")[1])} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{source.name}</h3>
              <Badge variant="outline" className={cn("text-[10px] shrink-0", typeInfo.color)}>
                {typeInfo.label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{source.requestCount} requests</span>
              <span className="hidden sm:inline">•</span>
              <span>Last sync: {source.lastSync}</span>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className={cn("text-xs", statusInfo.color)}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
          {/* Desktop buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResync(source.id)}
            className="gap-1.5 hidden sm:flex"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-sync
          </Button>
          <Button
            size="sm"
            onClick={() => onCreateSuite(source.id)}
            className="gap-1.5 hidden sm:flex"
          >
            <Layers className="w-3.5 h-3.5" />
            Create Suite
          </Button>

          {/* Mobile buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResync(source.id)}
            className="gap-1.5 sm:hidden flex-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </Button>
          <Button
            size="sm"
            onClick={() => onCreateSuite(source.id)}
            className="gap-1.5 sm:hidden flex-1"
          >
            <Layers className="w-3.5 h-3.5" />
            Suite
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onResync(source.id)}>
                Re-sync source
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(source.id)}
                className="text-destructive focus:text-destructive"
              >
                Delete source
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
