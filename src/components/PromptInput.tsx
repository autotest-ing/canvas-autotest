import { useRef, useState } from "react";
import { Paperclip, Sparkles, Play, X, FileJson, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  onSubmit: (prompt: string, attachedFile?: File | null) => void;
  onPlan?: () => void;
  isLoading?: boolean;
}

export function PromptInput({ onSubmit, onPlan, isLoading }: PromptInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (isLoading) return;
    if (value.trim() || attachedFile) {
      onSubmit(value.trim(), attachedFile);
      setValue("");
      setAttachedFile(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
    // Reset input so re-selecting same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
  };

  const placeholders = [
    "Import my Postman collection and create regression tests",
    "Generate API tests from this OpenAPI spec",
    "Run all suites on staging and fix failures",
  ];

  const canSubmit = (value.trim() || attachedFile) && !isLoading;

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
        {/* Attached file indicator */}
        {attachedFile && (
          <div className="px-4 pt-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm">
              <FileJson className="w-4 h-4" />
              <span className="truncate max-w-[200px]">{attachedFile.name}</span>
              <button
                onClick={removeFile}
                className="hover:bg-accent-foreground/10 rounded p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

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
            disabled={isLoading}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed disabled:opacity-50"
          />
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <Paperclip className="w-4 h-4" />
              <span>Attach</span>
            </button>
            {onPlan && (
              <button
                onClick={onPlan}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Plan</span>
              </button>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200",
              canSubmit
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-soft"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example prompts (only shown when not loading) */}
      {!isLoading && (
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
      )}
    </div>
  );
}
