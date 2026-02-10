import { useCallback, useMemo, useState } from "react";
import { Plus, Save, X, Check, Loader2, Copy, FileJson, AlignLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  createStepExport,
  applyStepExport,
  applyEnvironmentVariable,
  type TestStepExportCompactResponse,
  type EnvironmentDetailVariable,
} from "@/lib/api/suites";
import { toast } from "sonner";

// ============== Types ==============

type ExporterMode = "create" | "displayExisting";

export interface JsonResponseExporterProps {
  body: unknown;
  resolvedBody?: unknown;
  testStepId: string;
  mode?: ExporterMode;
  existingExports?: TestStepExportCompactResponse[];
  existingExportsLoading?: boolean;
  existingExportsError?: string | null;
  onApplyExport?: (varKey: string) => void;
  environmentVariables?: EnvironmentDetailVariable[];
  environmentVariablesLoading?: boolean;
  environmentVariablesError?: string | null;
  environmentName?: string | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ExportRowState {
  varKey: string;
  status: SaveStatus;
  error?: string;
}

export interface ValidExistingExport {
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

function getResolvedValue(path: string[], resolvedBody: unknown): unknown {
  if (!resolvedBody || typeof resolvedBody !== 'object') return undefined;

  let current: any = resolvedBody;
  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    if (key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
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

export function ExistingExportsDropdown({
  open,
  onOpenChange,
  exports,
  loading,
  error,
  onSelect,
  environmentVariables = [],
  environmentVariablesLoading = false,
  environmentVariablesError = null,
  environmentName = null,
  onSelectEnvVar,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exports: ValidExistingExport[];
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  environmentVariables?: EnvironmentDetailVariable[];
  environmentVariablesLoading?: boolean;
  environmentVariablesError?: string | null;
  environmentName?: string | null;
  onSelectEnvVar?: (id: string | number, key: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {children || (
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
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[560px] p-0 bg-popover z-50">
        <div className="grid grid-cols-2 divide-x divide-border">
          {/* Left column: Runtime variables */}
          <div className="flex flex-col">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-xs font-semibold text-foreground">Runtime variables</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading...
                </div>
              ) : error ? (
                <div className="px-3 py-3 text-xs text-destructive">
                  Failed to load variables
                </div>
              ) : exports.length === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  No extracted variables
                </div>
              ) : (
                exports.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="w-full flex flex-col items-start gap-0.5 px-3 py-2 hover:bg-accent/50 transition-colors cursor-pointer text-left"
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
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right column: Environment variables */}
          <div className="flex flex-col">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-xs font-semibold text-foreground">
                Environment variables
                {environmentName && (
                  <span className="text-muted-foreground font-normal ml-1">({environmentName})</span>
                )}
              </span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {environmentVariablesLoading ? (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading...
                </div>
              ) : environmentVariablesError ? (
                <div className="px-3 py-3 text-xs text-destructive">
                  Failed to load environment variables
                </div>
              ) : environmentVariables.length === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  No environment variables
                </div>
              ) : (
                environmentVariables.map((envVar, idx) => (
                  <button
                    key={envVar.id ?? idx}
                    type="button"
                    onClick={() => {
                      if (envVar.id) {
                        onSelectEnvVar?.(envVar.id, envVar.key);
                      }
                    }}
                    className="w-full flex flex-col items-start gap-0.5 px-3 py-2 hover:bg-accent/50 transition-colors cursor-pointer text-left"
                  >
                    <span className="text-xs font-medium text-foreground">
                      {envVar.key}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate max-w-full">
                      {envVar.value ? (envVar.value.length > 30 ? envVar.value.slice(0, 30) + "…" : envVar.value) : "******"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
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

function RenderStringValue({
  value,
  path,
  resolvedBody
}: {
  value: string,
  path: string[],
  resolvedBody: unknown
}) {
  if (value.includes("{{") && value.includes("}}")) {
    const resolvedValue = getResolvedValue(path, resolvedBody);
    if (resolvedValue !== undefined) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <span className="text-emerald-400 cursor-help underline decoration-emerald-500/50 decoration-dashed decoration-[0.5px] border-b-0">
                &quot;{value}&quot;
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] break-all">
              <p className="font-mono text-xs">{String(resolvedValue)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
  }
  return <span className="text-emerald-400">&quot;{value}&quot;</span>;
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
  onApplyExport: (exportId: string, path: string) => void,
  indent: number,
  environmentVariables: EnvironmentDetailVariable[],
  environmentVariablesLoading: boolean,
  environmentVariablesError: string | null,
  environmentName: string | null,
  onApplyEnvVar: (id: string | number, key: string, path: string) => void,
  resolvedBody?: unknown
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
    return <RenderStringValue value={value} path={keys} resolvedBody={resolvedBody} />;

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
                indent + 1,
                environmentVariables,
                environmentVariablesLoading,
                environmentVariablesError,
                environmentName,
                onApplyEnvVar,
                resolvedBody
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
                    onApplyExport(exportId, jsonPath);
                    setActiveField(null);
                  }}
                  environmentVariables={environmentVariables}
                  environmentVariablesLoading={environmentVariablesLoading}
                  environmentVariablesError={environmentVariablesError}
                  environmentName={environmentName}
                  onSelectEnvVar={(id, key) => onApplyEnvVar(id, key, jsonPath)}
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
                indent + 1,
                environmentVariables,
                environmentVariablesLoading,
                environmentVariablesError,
                environmentName,
                onApplyEnvVar,
                resolvedBody
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
                    onApplyExport(exportId, jsonPath);
                    setActiveField(null);
                  }}
                  environmentVariables={environmentVariables}
                  environmentVariablesLoading={environmentVariablesLoading}
                  environmentVariablesError={environmentVariablesError}
                  environmentName={environmentName}
                  onSelectEnvVar={(id, key) => onApplyEnvVar(id, key, jsonPath)}
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
  resolvedBody,
  testStepId,
  mode = "create",
  existingExports = [],
  existingExportsLoading = false,
  existingExportsError = null,
  onApplyExport,
  environmentVariables = [],
  environmentVariablesLoading = false,
  environmentVariablesError = null,
  environmentName = null,
}: JsonResponseExporterProps) {
  const { token } = useAuth();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "raw">("tree");

  const handleApplyExport = useCallback(
    async (exportId: string, path?: string) => {
      if (!token || isApplying) return;

      setIsApplying(true);
      try {
        const result = await applyStepExport(testStepId, exportId, token, path);
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

  const handleApplyEnvVar = useCallback(
    async (envVarId: string | number, varKey: string, path: string) => {
      if (!token || isApplying) return;

      setIsApplying(true);
      try {
        const result = await applyEnvironmentVariable(testStepId, envVarId, token, path);
        if (result.ok && onApplyExport) {
          onApplyExport(varKey);
        }
      } catch (err) {
        console.error("Failed to apply environment variable:", err);
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
  const resolvedParsed = parseBody(resolvedBody);
  const rawText = useMemo(() => {
    if (typeof body === 'string') return body;
    try {
      return JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  }, [body]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    toast.success("Copied to clipboard");
  };

  if (parsed === null || parsed === undefined) {
    return <p className="text-sm text-muted-foreground">No body</p>;
  }

  // Fallback for non-object types
  if (typeof parsed !== "object") {
    return (
      <div className="relative group">
        <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm" onClick={handleCopy}>
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <pre className="font-mono text-xs bg-muted/30 p-3 rounded-lg overflow-auto max-h-64 border border-border/50">
          {String(parsed)}
        </pre>
      </div>
    );
  }

  return (
    <div className="relative border border-border/50 rounded-lg overflow-hidden flex flex-col bg-muted/30">
      <div className="flex items-center justify-end px-2 py-1 border-b border-border/50 bg-muted/20 gap-1">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-6 px-2 text-[10px] gap-1", viewMode === "tree" && "bg-background shadow-sm")}
                onClick={() => setViewMode("tree")}
              >
                <AlignLeft className="w-3 h-3" />
                Tree
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tree View</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-6 px-2 text-[10px] gap-1", viewMode === "raw" && "bg-background shadow-sm")}
                onClick={() => setViewMode("raw")}
              >
                <FileJson className="w-3 h-3" />
                Raw
              </Button>
            </TooltipTrigger>
            <TooltipContent>Raw JSON</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-[1px] h-3 bg-border mx-1" />

        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                <Copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy to clipboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="overflow-auto max-h-64 p-3 relative">
        {viewMode === "raw" ? (
          <pre className="font-mono text-xs whitespace-pre text-foreground/80">
            {rawText}
          </pre>
        ) : (
          <pre className="font-mono text-xs whitespace-pre">
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
              0,
              environmentVariables,
              environmentVariablesLoading,
              environmentVariablesError,
              environmentName,
              handleApplyEnvVar,
              resolvedParsed
            )}
          </pre>
        )}

        {isApplying && (
          <div className="absolute inset-0 bg-background/40 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
