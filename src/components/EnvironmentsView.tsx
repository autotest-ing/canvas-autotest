import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MobileBottomSpacer } from "./LeftRail";
import { PageTitle } from "./PageTitle";
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  Globe, 
  Variable, 
  Lock,
  Sparkles,
  AlertTriangle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { fetchEnvironmentDetail, fetchEnvironments } from "@/lib/api/environments";
import { toast } from "sonner";

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

interface SecretPair {
  id: string;
  key: string;
  value: string;
  isRevealed: boolean;
}

interface AISuggestion {
  id: string;
  type: "missing" | "suggestion";
  message: string;
  variable?: string;
}

interface Environment {
  baseUrl: string;
  variables: KeyValuePair[];
  secrets: SecretPair[];
  hasChanges: boolean;
}

type EnvironmentSummary = {
  id: string;
  name: string;
  isDefault: boolean;
};

const mockSuggestions: AISuggestion[] = [
  { 
    id: "1", 
    type: "missing", 
    message: "The WEBHOOK_SECRET variable is used in 3 requests but not defined.",
    variable: "WEBHOOK_SECRET"
  },
  { 
    id: "2", 
    type: "suggestion", 
    message: "Consider adding a RATE_LIMIT variable based on recent 429 responses.",
    variable: "RATE_LIMIT"
  },
];

const DEFAULT_ACCOUNT_STORAGE_KEY = "autotest.default_account_id";

export function EnvironmentsView() {
  const { token } = useAuth();
  const [activeEnvironmentId, setActiveEnvironmentId] = useState<string | null>(null);
  const [environments, setEnvironments] = useState<Record<string, Environment>>({});
  const [environmentSnapshots, setEnvironmentSnapshots] = useState<Record<string, Environment>>({});
  const [environmentList, setEnvironmentList] = useState<EnvironmentSummary[]>([]);
  const [suggestions] = useState<AISuggestion[]>(mockSuggestions);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingEnvironment, setPendingEnvironment] = useState<string | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const activeEnvironmentName = useMemo(() => {
    if (!activeEnvironmentId) return "environment";
    return environmentList.find(env => env.id === activeEnvironmentId)?.name ?? "environment";
  }, [activeEnvironmentId, environmentList]);

  const currentEnv = activeEnvironmentId ? environments[activeEnvironmentId] : null;
  const baseUrl = currentEnv?.baseUrl ?? "";
  const variables = currentEnv?.variables ?? [];
  const secrets = currentEnv?.secrets ?? [];
  const hasChanges = currentEnv?.hasChanges ?? false;

  const baseUrlVariable = variables.find(variable => variable.key === "BASE_URL");
  const visibleVariables = variables.filter(variable => variable.key !== "BASE_URL");

  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const fetchEnvironmentList = useCallback(async () => {
    if (!token) {
      setIsListLoading(false);
      return;
    }

    const accountId = window.localStorage.getItem(DEFAULT_ACCOUNT_STORAGE_KEY);
    if (!accountId) {
      toast.error("Missing account", {
        description: "No default account ID found. Please log in again.",
      });
      setIsListLoading(false);
      return;
    }

    setIsListLoading(true);
    try {
      const items = await fetchEnvironments(accountId, token);
      const sorted = [...items].sort((a, b) => {
        if (a.is_default === b.is_default) return 0;
        return a.is_default ? -1 : 1;
      });
      const summaries = sorted.map(item => ({
        id: item.id,
        name: item.name,
        isDefault: item.is_default,
      }));
      setEnvironmentList(summaries);
      setActiveEnvironmentId(summaries[0]?.id ?? null);
    } catch (error) {
      toast.error("Failed to load environments", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsListLoading(false);
    }
  }, [token]);

  const fetchEnvironmentInfo = useCallback(async (envId: string) => {
    if (!token) return;
    setIsDetailLoading(true);
    try {
      const detail = await fetchEnvironmentDetail(envId, token);
      const mapped: Environment = {
        baseUrl: detail.base_url ?? detail.baseUrl ?? "",
        variables: (detail.variables ?? []).map((variable, index) => ({
          id: String(variable.id ?? `${envId}-variable-${index}`),
          key: variable.key ?? "",
          value: variable.value ?? "",
        })),
        secrets: (detail.secrets ?? []).map((secret, index) => ({
          id: String(secret.id ?? `${envId}-secret-${index}`),
          key: secret.key ?? "",
          value: secret.value ?? "",
          isRevealed: false,
        })),
        hasChanges: false,
      };
      setEnvironments(prev => ({
        ...prev,
        [envId]: mapped,
      }));
      setEnvironmentSnapshots(prev => ({
        ...prev,
        [envId]: mapped,
      }));
    } catch (error) {
      toast.error("Failed to load environment details", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsDetailLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    fetchEnvironmentList();
  }, [fetchEnvironmentList]);

  useEffect(() => {
    if (!activeEnvironmentId) return;
    fetchEnvironmentInfo(activeEnvironmentId);
  }, [activeEnvironmentId, fetchEnvironmentInfo]);

  const handleTabChange = (value: string) => {
    const newEnv = value;
    if (newEnv === activeEnvironmentId) return;
    
    if (hasChanges) {
      setPendingEnvironment(newEnv);
      setShowUnsavedDialog(true);
    } else {
      setActiveEnvironmentId(newEnv);
    }
  };

  const handleDiscard = useCallback(() => {
    if (!activeEnvironmentId) return;
    const snapshot = environmentSnapshots[activeEnvironmentId];
    if (snapshot) {
      setEnvironments(prev => ({
        ...prev,
        [activeEnvironmentId]: snapshot,
      }));
    }
    
    // Proceed with pending action
    if (pendingEnvironment) {
      setActiveEnvironmentId(pendingEnvironment);
      setPendingEnvironment(null);
    }
    setShowUnsavedDialog(false);
  }, [activeEnvironmentId, environmentSnapshots, pendingEnvironment]);

  const handleSaveAndProceed = useCallback(() => {
    // Validate before saving
    const emptyVars = variables.filter(v => v.key && !v.value);
    const emptySecrets = secrets.filter(s => s.key && !s.value);
    
    if (emptyVars.length > 0 || emptySecrets.length > 0) {
      toast.error("Missing values", {
        description: "Some variables or secrets are missing values.",
      });
      setShowUnsavedDialog(false);
      return;
    }

    toast.success("Environment saved", {
      description: `Your ${activeEnvironmentName} environment configuration has been updated.`,
    });
    
    if (activeEnvironmentId) {
      setEnvironments(prev => ({
        ...prev,
        [activeEnvironmentId]: { ...prev[activeEnvironmentId], hasChanges: false },
      }));
      setEnvironmentSnapshots(prev => ({
        ...prev,
        [activeEnvironmentId]: { ...prev[activeEnvironmentId], hasChanges: false },
      }));
    }

    // Proceed with pending action
    if (pendingEnvironment) {
      setActiveEnvironmentId(pendingEnvironment);
      setPendingEnvironment(null);
    }
    setShowUnsavedDialog(false);
  }, [activeEnvironmentId, activeEnvironmentName, pendingEnvironment, variables, secrets]);

  const handleCancelDialog = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingEnvironment(null);
  }, []);

  const handleCancelChanges = () => {
    if (!activeEnvironmentId) return;
    const snapshot = environmentSnapshots[activeEnvironmentId];
    if (!snapshot) return;
    setEnvironments(prev => ({
      ...prev,
      [activeEnvironmentId]: snapshot,
    }));
    toast.info("Changes discarded", {
      description: `Your ${activeEnvironmentName} environment has been reset.`,
    });
  };

  const updateCurrentEnv = (updates: Partial<Environment>) => {
    if (!activeEnvironmentId) return;
    setEnvironments(prev => ({
      ...prev,
      [activeEnvironmentId]: { ...prev[activeEnvironmentId], ...updates, hasChanges: true },
    }));
  };

  const handleBaseUrlChange = (value: string) => {
    if (baseUrlVariable) {
      updateCurrentEnv({
        variables: variables.map(variable =>
          variable.id === baseUrlVariable.id ? { ...variable, value } : variable
        ),
      });
      return;
    }
    updateCurrentEnv({ baseUrl: value });
  };

  const addVariable = () => {
    updateCurrentEnv({ variables: [...variables, { id: String(Date.now()), key: "", value: "" }] });
  };

  const updateVariable = (id: string, field: "key" | "value", value: string) => {
    updateCurrentEnv({ variables: variables.map(v => v.id === id ? { ...v, [field]: value } : v) });
  };

  const removeVariable = (id: string) => {
    updateCurrentEnv({ variables: variables.filter(v => v.id !== id) });
  };

  const addSecret = () => {
    updateCurrentEnv({ secrets: [...secrets, { id: String(Date.now()), key: "", value: "", isRevealed: true }] });
  };

  const updateSecret = (id: string, field: "key" | "value", value: string) => {
    updateCurrentEnv({ secrets: secrets.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };

  const removeSecret = (id: string) => {
    updateCurrentEnv({ secrets: secrets.filter(s => s.id !== id) });
  };

  const toggleSecretVisibility = (id: string) => {
    updateCurrentEnv({ secrets: secrets.map(s => s.id === id ? { ...s, isRevealed: !s.isRevealed } : s) });
  };

  const addSuggestedVariable = (variable: string) => {
    updateCurrentEnv({ variables: [...variables, { id: String(Date.now()), key: variable, value: "" }] });
    toast.success("Variable added", {
      description: `${variable} has been added. Don't forget to set its value.`,
    });
  };

  const handleSave = () => {
    // Validate
    const emptyVars = variables.filter(v => v.key && !v.value);
    const emptySecrets = secrets.filter(s => s.key && !s.value);
    
    if (emptyVars.length > 0 || emptySecrets.length > 0) {
      toast.error("Missing values", {
        description: "Some variables or secrets are missing values.",
      });
      return;
    }

    toast.success("Environment saved", {
      description: `Your ${activeEnvironmentName} environment configuration has been updated.`,
    });
    if (activeEnvironmentId) {
      setEnvironments(prev => ({
        ...prev,
        [activeEnvironmentId]: { ...prev[activeEnvironmentId], hasChanges: false },
      }));
      setEnvironmentSnapshots(prev => ({
        ...prev,
        [activeEnvironmentId]: { ...prev[activeEnvironmentId], hasChanges: false },
      }));
    }
  };

  const handleAddBaseUrlVariable = () => {
    if (baseUrlVariable) return;
    updateCurrentEnv({
      variables: [...variables, { id: String(Date.now()), key: "BASE_URL", value: "" }],
    });
  };

  const hasEnvironment = Boolean(activeEnvironmentId && currentEnv);
  const shouldShowDetailSkeleton = Boolean(activeEnvironmentId) && isDetailLoading;

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <ScrollArea className="flex-1">
        <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border/50 mb-6">
            <div>
              <PageTitle>Environments</PageTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure base URLs, variables, and secrets for your test runs
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {hasChanges && (
                <Button variant="outline" onClick={handleCancelChanges} className="gap-2 flex-1 sm:flex-none">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              )}
              <Button onClick={handleSave} disabled={!hasChanges} className="gap-2 flex-1 sm:flex-none">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Environment Tabs */}
          {isListLoading ? (
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          ) : (
            <Tabs value={activeEnvironmentId ?? ""} onValueChange={handleTabChange} className="w-full">
              <TabsList className="w-full sm:w-auto flex flex-wrap">
                {environmentList.map((env) => (
                  <TabsTrigger key={env.id} value={env.id} className="flex-1 sm:flex-none">
                    {env.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* Content */}
          <div className="space-y-6">
          {!isListLoading && environmentList.length === 0 && (
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base">No environments found</CardTitle>
                <CardDescription>
                  Create an environment in your account to start configuring variables and secrets.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={cn(
                    "p-4 rounded-xl border flex items-start gap-3",
                    suggestion.type === "missing"
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    suggestion.type === "missing"
                      ? "bg-amber-500/15 text-amber-600"
                      : "bg-primary/15 text-primary"
                  )}>
                    {suggestion.type === "missing" ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{suggestion.message}</p>
                  </div>
                  {suggestion.variable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSuggestedVariable(suggestion.variable!)}
                      className="shrink-0"
                    >
                      Add {suggestion.variable}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {shouldShowDetailSkeleton && (
            <div className="space-y-6">
              <Card className="border-border/50 shadow-soft">
                <CardHeader className="pb-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-60" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-soft">
                <CardHeader className="pb-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-soft">
                <CardHeader className="pb-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          )}

          {!isDetailLoading && hasEnvironment && (
            <>
              {/* Base URL */}
              <Card className="border-border/50 shadow-soft">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-base">Base URL</CardTitle>
                  </div>
                  <CardDescription>
                    The base URL for all API requests in this environment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!baseUrlVariable && (
                    <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 p-3 text-sm text-muted-foreground">
                      Set a <span className="font-semibold text-foreground">BASE_URL</span> variable to define the base URL for this
                      environment.
                      <Button variant="link" className="px-2" onClick={handleAddBaseUrlVariable}>
                        Add BASE_URL
                      </Button>
                    </div>
                  )}
                  <Input
                    value={baseUrlVariable?.value ?? baseUrl}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                    placeholder="https://api.example.com"
                    className="font-mono"
                  />
                </CardContent>
              </Card>

              {/* Variables */}
              <Card className="border-border/50 shadow-soft">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Variable className="w-5 h-5 text-muted-foreground" />
                      <CardTitle className="text-base">Variables</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {visibleVariables.length}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={addVariable} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Add Variable
                    </Button>
                  </div>
                  <CardDescription>
                    Environment variables available in your test requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visibleVariables.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No variables defined. Click &quot;Add Variable&quot; to create one.
                    </div>
                  ) : (
                    visibleVariables.map((variable) => (
                      <div key={variable.id} className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Key</Label>
                            <Input
                              value={variable.key}
                              onChange={(e) => updateVariable(variable.id, "key", e.target.value)}
                              placeholder="VARIABLE_NAME"
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Value</Label>
                            <Input
                              value={variable.value}
                              onChange={(e) => updateVariable(variable.id, "value", e.target.value)}
                              placeholder="value"
                              className="font-mono text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariable(variable.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive mt-5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Secrets */}
              <Card className="border-border/50 shadow-soft">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <CardTitle className="text-base">Secrets</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {secrets.length}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={addSecret} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Add Secret
                    </Button>
                  </div>
                  <CardDescription>
                    Sensitive values like API keys and tokens (stored encrypted)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {secrets.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No secrets defined. Click &quot;Add Secret&quot; to create one.
                    </div>
                  ) : (
                    secrets.map((secret) => (
                      <div key={secret.id} className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Key</Label>
                            <Input
                              value={secret.key}
                              onChange={(e) => updateSecret(secret.id, "key", e.target.value)}
                              placeholder="SECRET_NAME"
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Value</Label>
                            <div className="relative">
                              <Input
                                type={secret.isRevealed ? "text" : "password"}
                                value={secret.value}
                                onChange={(e) => updateSecret(secret.id, "value", e.target.value)}
                                placeholder="••••••••"
                                className="font-mono text-sm pr-10"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleSecretVisibility(secret.id)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              >
                                {secret.isRevealed ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSecret(secret.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive mt-5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
          <MobileBottomSpacer />
          </div>
        </div>
      </ScrollArea>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save or discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to the {activeEnvironmentName} environment. 
              Would you like to save them before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDialog}>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={handleDiscard}>Discard</Button>
            <AlertDialogAction onClick={handleSaveAndProceed}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
