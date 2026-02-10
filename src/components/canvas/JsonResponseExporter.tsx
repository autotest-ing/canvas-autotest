import { useCallback, useMemo, useState } from "react";
import { Plus, Save, X, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  createStepExport,
  applyStepExport,
  type TestStepExportCompactResponse,
} from "@/lib/api/suites";

// ============== Types ==============

type ExporterMode = "create" | "displayExisting";

interface JsonResponseExporterProps {
  body: unknown;
  testStepId: string;
  mode?: ExporterMode;
  existingExports?: TestStepExportCompactResponse[];
  existingExportsLoading?: boolean;
  existingExportsError?: string | null;
  onApplyExport?: (varKey: string) => void;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ExportRowState {
  varKey: string;
  status: SaveStatus;
  error?: string;
}

interface ValidExistingExport {
  id: string;
  key: string;
  stepName: string;
  extractorPath: string | null;
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

function AddVarButton({
  onClick,
}: {
  onClick?: () => void;
}) {
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

function ExistingExportsDropdown({
  open,
  onOpenChange,
  exports,
  loading,
  error,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exports: ValidExistingExport[];
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {loading ? (
          <DropdownMenuItem disabled className="gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading extracted variables...
          </DropdownMenuItem>
        ) : error ? (
          <DropdownMenuItem disabled className="text-destructive text-xs">
            Failed to load extracted variables
          </DropdownMenuItem>
        ) : exports.length === 0 ? (
          <DropdownMenuItem disabled>No extracted variables</DropdownMenuItem>
        ) : (
          exports.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
            >
              <span className="text-xs font-medium text-foreground">
                {item.key}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {item.stepName}
              </span>
              {item.extractorPath ? (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {item.extractorPath}
                </span>
              ) : null}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
  mode: ExporterMode,
  normalizedExports: ValidExistingExport[],
  existingExportsLoading: boolean,
  existingExportsError: string | null,
  activeField: string | null,
  setActiveField: (path: string | null) => void,
  onApplyExport: (exportId: string) => void,
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
                mode,
                normalizedExports,
                existingExportsLoading,
                existingExportsError,
                activeField,
                setActiveField,
                onApplyExport,
                indent + 1
              )}
              {i < value.length - 1 ? "," : ""}
              {!isObject && mode === "create" && !isActive ? (
                <AddVarButton onClick={() => setActiveField(jsonPath)} />
              ) : null}
              {!isObject && mode === "create" && isActive ? (
                <ExportInput
                  fieldName={
                    keys.length > 0
                      ? keys[keys.length - 1] + "_" + i
                      : String(i)
                  }
                  jsonPath={jsonPath}
                  testStepId={testStepId}
                  onClose={() => setActiveField(null)}
                />
              ) : null}
              {!isObject && mode === "displayExisting" ? (
                <ExistingExportsDropdown
                  open={isActive}
                  onOpenChange={(nextOpen) =>
                    setActiveField(nextOpen ? jsonPath : null)
                  }
                  exports={normalizedExports}
                  loading={existingExportsLoading}
                  error={existingExportsError}
                  onSelect={(exportId) => {
                    onApplyExport(exportId);
                    setActiveField(null);
                  }}
                />
              ) : null}
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
                mode,
                normalizedExports,
                existingExportsLoading,
                existingExportsError,
                activeField,
                setActiveField,
                onApplyExport,
                indent + 1
              )}
              {i < entries.length - 1 ? "," : ""}
              {isLeaf && mode === "create" && !isActive ? (
                <AddVarButton onClick={() => setActiveField(jsonPath)} />
              ) : null}
              {isLeaf && mode === "create" && isActive ? (
                <ExportInput
                  fieldName={key}
                  jsonPath={jsonPath}
                  testStepId={testStepId}
                  onClose={() => setActiveField(null)}
                />
              ) : null}
              {isLeaf && mode === "displayExisting" ? (
                <ExistingExportsDropdown
                  open={isActive}
                  onOpenChange={(nextOpen) =>
                    setActiveField(nextOpen ? jsonPath : null)
                  }
                  exports={normalizedExports}
                  loading={existingExportsLoading}
                  error={existingExportsError}
                  onSelect={(exportId) => {
                    onApplyExport(exportId);
                    setActiveField(null);
                  }}
                />
              ) : null}
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
  mode = "create",
  existingExports = [],
  existingExportsLoading = false,
  existingExportsError = null,
  onApplyExport,
}: JsonResponseExporterProps) {
  const { token } = useAuth();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyExport = useCallback(
    async (exportId: string) => {
      if (!token || isApplying) return;

      setIsApplying(true);
      try {
        const result = await applyStepExport(testStepId, exportId, token);
        if (result.ok && onApplyExport) {
          onApplyExport(result.var_key);
        }
      } catch (err) {
        console.error("Failed to apply export:", err);
      } finally {
        setIsApplying(false);
      }
    },
    [testStepId, token, onApplyExport, isApplying]
  );
  const normalizedExports = useMemo<ValidExistingExport[]>(() => {
    return existingExports
      .filter((item) => typeof item?.key === "string" && item.key.trim())
      .map((item) => {
        const extractorPath =
          typeof item.extractor?.path === "string" ? item.extractor.path : null;
        return {
          id: item.id,
          key: item.key.trim(),
          stepName:
            typeof item.test_step?.name === "string" && item.test_step.name.trim()
              ? item.test_step.name.trim()
              : "Unknown step",
          extractorPath,
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [existingExports]);

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
      {renderValue(
        parsed,
        [],
        testStepId,
        mode,
        normalizedExports,
        existingExportsLoading,
        existingExportsError,
        activeField,
        setActiveField,
        handleApplyExport,
        0
      )}
      {isApplying && (
        <div className="absolute inset-0 bg-background/40 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </pre>
  );
}
