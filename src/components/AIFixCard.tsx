import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X, Play, Check, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIFixCardProps {
  stepName: string;
  onApply: () => void;
  onApplyAndRerun: () => void;
  onDismiss: () => void;
}

const mockFix = {
  whatBroke: "The POST /api/orders endpoint returned a 500 error instead of the expected 201 response.",
  whyItBroke: "The inventory-service dependency is failing to respond within the timeout window. The orders service attempts to verify stock levels before creating an order, but the inventory check is timing out after 5 seconds.",
  proposedChange: {
    file: "src/services/orderService.ts",
    before: `async function createOrder(items: OrderItem[]) {
  // Check inventory synchronously
  const stockCheck = await inventoryService.checkStock(items);
  if (!stockCheck.available) {
    throw new Error('Items not in stock');
  }
  return await db.orders.create({ items });
}`,
    after: `async function createOrder(items: OrderItem[]) {
  // Check inventory with retry and fallback
  let stockCheck;
  try {
    stockCheck = await withRetry(
      () => inventoryService.checkStock(items),
      { attempts: 3, backoff: 'exponential' }
    );
  } catch (error) {
    // Fallback: allow order with pending verification
    stockCheck = { available: true, pending: true };
  }
  return await db.orders.create({ 
    items, 
    stockVerified: !stockCheck.pending 
  });
}`,
  },
  riskLevel: "low" as const,
  riskExplanation: "This change adds resilience without modifying core business logic. Orders created during inventory outages will be flagged for manual verification.",
};

const riskStyles = {
  low: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-600",
    badge: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  },
  medium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-600",
    badge: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  },
  high: {
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    text: "text-destructive",
    badge: "bg-destructive/15 text-destructive border-destructive/20",
  },
};

export function AIFixCard({ stepName, onApply, onApplyAndRerun, onDismiss }: AIFixCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const risk = riskStyles[mockFix.riskLevel];

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApply();
    }, 1000);
  };

  const handleApplyAndRerun = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApplyAndRerun();
    }, 1000);
  };

  return (
    <div className={cn(
      "rounded-2xl border-2 overflow-hidden animate-fade-up",
      risk.border,
      risk.bg
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border/30 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Fix Suggestion</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              For failed step: {stepName}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 shrink-0"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="max-h-[60vh]">
        <div className="p-4 space-y-5">
          {/* What broke */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h4 className="text-sm font-medium text-foreground">What broke</h4>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {mockFix.whatBroke}
            </p>
          </div>

          {/* Why it broke */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium text-foreground">Why it broke</h4>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {mockFix.whyItBroke}
            </p>
          </div>

          {/* Proposed change */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-medium text-foreground">Proposed change</h4>
              <Badge variant="outline" className="text-[10px] ml-auto">
                {mockFix.proposedChange.file}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pl-6">
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Before</span>
                <pre className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                  {mockFix.proposedChange.before}
                </pre>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">After</span>
                <pre className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                  {mockFix.proposedChange.after}
                </pre>
              </div>
            </div>
          </div>

          {/* Risk assessment */}
          <div className={cn(
            "p-3 rounded-xl border",
            risk.border,
            "bg-background/50"
          )}>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className={cn("text-xs shrink-0", risk.badge)}>
                {mockFix.riskLevel.toUpperCase()} RISK
              </Badge>
              <p className="text-sm text-muted-foreground">
                {mockFix.riskExplanation}
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t border-border/30 flex items-center justify-end gap-2 bg-background/30">
        <Button variant="outline" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleApply}
          disabled={isApplying}
          className="gap-2"
        >
          {isApplying ? (
            <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
          Apply
        </Button>
        <Button 
          size="sm" 
          onClick={handleApplyAndRerun}
          disabled={isApplying}
          className="gap-2"
        >
          {isApplying ? (
            <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          Apply & Rerun
        </Button>
      </div>
    </div>
  );
}
