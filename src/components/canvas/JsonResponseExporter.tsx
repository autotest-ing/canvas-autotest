import { useState, useCallback } from "react";
import { Plus, Save, X, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { createStepExport } from "@/lib/api/suites";

// ============== Types ==============

interface JsonResponseExporterProps {
  body: unknown;
  testStepId: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ExportRowState {
  varKey: string;
  status: SaveStatus;
  error?: string;
}

// ============== Helpers ==============

/** Convert a field name to UPPERCASE variable name */
function toVarKey(fieldName: string): string {
  return fieldName.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
}

/** Build a JSONPath from nested keys */
function buildJsonPath(keys: string[]): string {
  return "$." + keys.join(".");
}

function parseBody(body: unknown): unknown {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

// ============== Inline Export Input ==============

function ExportInput({
  fieldName,
  jsonPath,
  testStepId,
  onClose,
}: {
  fieldName: string;
  jsonPath: string;
  testStepId: string;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [state, setState] = useState<ExportRowState>({
    varKey: toVarKey(fieldName),
    status: "idle",
  });

  const handleSave = useCallback(async () => {
    if (!token || !state.varKey.trim()) return;

    setState((s) => ({ ...s, status: "saving", error: undefined }));
    try {
      await createStepExport(
        testStepId,
        {
          test_step_id: testStepId,
          var_key: state.varKey.trim(),
          extractor: {
            type: "jsonpath",
            path: jsonPath,
            source: "response_body",
          },
        },
        token
      );
      setState((s) => ({ ...s, status: "saved" }));
      setTimeout(onClose, 1000);
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "Failed to save",
      }));
    }
  }, [token, testStepId, jsonPath, state.varKey, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onClose();
  };

  return (
    <span className="inline-flex items-center gap-1 ml-2 align-middle">
      <Input
        value={state.varKey}
        onChange={(e) =>
          setState((s) => ({ ...s, varKey: e.target.value, status: "idle" }))
        }
        onKeyDown={handleKeyDown}
        className="h-5 w-32 text-[10px] font-mono px-1.5 py-0 border-primary/40 focus-visible:ring-1"
        autoFocus
        disabled={state.status === "saving"}
      />
      {state.status === "saving" ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
      ) : state.status === "saved" ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 hover:bg-emerald-500/10"
            onClick={handleSave}
            disabled={!state.varKey.trim()}
          >
            <Save className="w-3 h-3 text-emerald-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 hover:bg-destructive/10"
            onClick={onClose}
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </Button>
        </>
      )}
      {state.status === "error" && (
        <span className="text-[10px] text-destructive">{state.error}</span>
      )}
    </span>
  );
}

// ============== Add Variable Button ==============

function AddVarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-0.5 ml-1.5 align-middle",
        "text-[10px] text-primary/60 hover:text-primary transition-colors",
        "opacity-0 group-hover/json-line:opacity-100 focus:opacity-100"
      )}
      title="Add variable"
    >
      <Plus className="w-3 h-3" />
      <span className="hidden sm:inline">var</span>
    </button>
  );
}

// ============== JSON Renderer with Export Buttons ==============

function JsonLine({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group/json-line relative", className)}>{children}</div>
  );
}

function renderValue(
  value: unknown,
  keys: string[],
  testStepId: string,
  activeField: string | null,
  setActiveField: (path: string | null) => void,
  indent: number
): React.ReactNode {
  const pad = "  ".repeat(indent);

  if (value === null) return <span className="text-orange-400">null</span>;
  if (typeof value === "boolean")
    return (
      <span className="text-orange-400">{value ? "true" : "false"}</span>
    );
  if (typeof value === "number")
    return <span className="text-amber-400">{value}</span>;
  if (typeof value === "string")
    return (
      <span className="text-emerald-400">
        &quot;{value}&quot;
      </span>
    );

  if (Array.isArray(value)) {
    if (value.length === 0) return <span>{"[]"}</span>;
    return (
      <>
        <span>{"["}</span>
        {"\n"}
        {value.map((item, i) => {
          const itemKeys = [...keys, String(i)];
          const jsonPath = buildJsonPath(itemKeys);
          const isActive = activeField === jsonPath;
          const isObject = typeof item === "object" && item !== null;

          return (
            <JsonLine key={i}>
              <span>{pad}  </span>
              {renderValue(
                item,
                itemKeys,
                testStepId,
                activeField,
                setActiveField,
                indent + 1
              )}
              {i < value.length - 1 ? "," : ""}
              {!isObject && !isActive && (
                <AddVarButton onClick={() => setActiveField(jsonPath)} />
              )}
              {!isObject && isActive && (
                <ExportInput
                  fieldName={keys.length > 0 ? keys[keys.length - 1] + "_" + i : String(i)}
                  jsonPath={jsonPath}
                  testStepId={testStepId}
                  onClose={() => setActiveField(null)}
                />
              )}
              {"\n"}
            </JsonLine>
          );
        })}
        <span>{pad}]</span>
      </>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span>{"{}"}</span>;
    return (
      <>
        <span>{"{"}</span>
        {"\n"}
        {entries.map(([key, val], i) => {
          const fieldKeys = [...keys, key];
          const jsonPath = buildJsonPath(fieldKeys);
          const isActive = activeField === jsonPath;
          const isLeaf =
            val === null ||
            typeof val !== "object" ||
            (typeof val === "object" && val !== null && Object.keys(val as Record<string, unknown>).length === 0);

          return (
            <JsonLine key={key}>
              <span>{pad}  </span>
              <span className="text-sky-300">&quot;{key}&quot;</span>
              <span>{": "}</span>
              {renderValue(
                val,
                fieldKeys,
                testStepId,
                activeField,
                setActiveField,
                indent + 1
              )}
              {i < entries.length - 1 ? "," : ""}
              {isLeaf && !isActive && (
                <AddVarButton onClick={() => setActiveField(jsonPath)} />
              )}
              {isLeaf && isActive && (
                <ExportInput
                  fieldName={key}
                  jsonPath={jsonPath}
                  testStepId={testStepId}
                  onClose={() => setActiveField(null)}
                />
              )}
              {"\n"}
            </JsonLine>
          );
        })}
        <span>{pad}{"}"}</span>
      </>
    );
  }

  return <span>{String(value)}</span>;
}

// ============== Main Component ==============

export function JsonResponseExporter({
  body,
  testStepId,
}: JsonResponseExporterProps) {
  const [activeField, setActiveField] = useState<string | null>(null);

  const parsed = parseBody(body);

  if (parsed === null || parsed === undefined) {
    return <p className="text-sm text-muted-foreground">No body</p>;
  }

  if (typeof parsed !== "object") {
    return (
      <pre className="font-mono text-xs bg-muted/30 p-3 rounded-lg overflow-auto max-h-64 border border-border/50">
        {String(parsed)}
      </pre>
    );
  }

  return (
    <pre className="font-mono text-xs bg-muted/30 p-3 rounded-lg overflow-auto max-h-64 border border-border/50 whitespace-pre">
      {renderValue(parsed, [], testStepId, activeField, setActiveField, 0)}
    </pre>
  );
}
