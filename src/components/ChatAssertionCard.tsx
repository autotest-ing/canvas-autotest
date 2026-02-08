import { useState } from "react";
import { ShieldCheck, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AssertionSuggestion = {
  name: string;
  description: string;
  assertion_type: string;
  operator: string;
  extractor?: Record<string, unknown>;
  expected?: unknown;
};

interface ChatAssertionCardProps {
  suggestions: AssertionSuggestion[];
  onAdd: (selected: AssertionSuggestion[]) => void;
}

export function ChatAssertionCard({ suggestions, onAdd }: ChatAssertionCardProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleSelection = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAdd = () => {
    const items = Array.from(selected).map((i) => suggestions[i]);
    if (items.length > 0) {
      onAdd(items);
    }
  };

  const selectAll = () => {
    if (selected.size === suggestions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suggestions.map((_, i) => i)));
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-soft p-4 w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm text-foreground">
            Suggested Assertions
          </h4>
        </div>
        <button
          onClick={selectAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {selected.size === suggestions.length ? "Deselect all" : "Select all"}
        </button>
      </div>

      <div className="space-y-1.5">
        {suggestions.map((s, i) => (
          <label
            key={i}
            className={cn(
              "flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors",
              selected.has(i)
                ? "bg-primary/5 border border-primary/20"
                : "hover:bg-muted/50 border border-transparent"
            )}
          >
            <input
              type="checkbox"
              checked={selected.has(i)}
              onChange={() => toggleSelection(i)}
              className="mt-0.5 rounded border-border"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {s.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                  {s.assertion_type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {s.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      {selected.size > 0 && (
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Add {selected.size} assertion{selected.size !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
