import { useState } from "react";
import { Paperclip, Sparkles, Play, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  onPlan?: () => void;
}

export function PromptInput({ onSubmit, onPlan }: PromptInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const placeholders = [
    "Import my Postman collection and create regression tests",
    "Generate API tests from this OpenAPI spec",
    "Run all suites on staging and fix failures",
  ];

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto transition-all duration-300",
        isFocused && "scale-[1.01]"
      )}
    >
      <div
        className={cn(
          "relative bg-card rounded-2xl shadow-soft transition-all duration-300",
          isFocused && "shadow-prompt ring-2 ring-primary/20"
        )}
      >
        {/* Input area */}
        <div className="p-4 pb-3">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[0]}
            rows={2}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed"
          />
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              <span>Attach</span>
            </button>
            <button
              onClick={onPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Plan</span>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200",
              value.trim()
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-soft"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            <Play className="w-4 h-4" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Example prompts */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {placeholders.slice(1).map((prompt, i) => (
          <button
            key={i}
            onClick={() => setValue(prompt)}
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full bg-card/50 hover:bg-card transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
