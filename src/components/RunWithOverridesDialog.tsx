import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export type OverrideVariableRow = {
  id: string;
  key: string;
  value: string;
};

type RunWithOverridesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variables: OverrideVariableRow[];
  isLoading: boolean;
  isSubmitting: boolean;
  onVariableChange: (id: string, field: "key" | "value", value: string) => void;
  onRun: () => void;
};

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RunWithOverridesDialog({
  open,
  onOpenChange,
  variables,
  isLoading,
  isSubmitting,
  onVariableChange,
  onRun,
}: RunWithOverridesDialogProps) {
  const isRunDisabled = isLoading || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Run with Overrides</DialogTitle>
          <DialogDescription>
            Environment variables available in your test requests
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <LoadingRows />
          ) : (
            <div className="space-y-4">
              {variables.map((variable) => (
                <div key={variable.id} className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-sm text-muted-foreground">Key</p>
                    <Input
                      value={variable.key}
                      onChange={(event) => onVariableChange(variable.id, "key", event.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm text-muted-foreground">Value</p>
                    <Input
                      value={variable.value}
                      onChange={(event) => onVariableChange(variable.id, "value", event.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onRun} disabled={isRunDisabled}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
