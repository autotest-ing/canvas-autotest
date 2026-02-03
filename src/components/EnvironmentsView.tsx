import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { fetchEnvironmentDetail, fetchEnvironments, updateEnvironment } from "@/lib/api/environments";
import { toast } from "sonner";

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  isOverridable: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
}

interface SecretPair {
  id: string;
  key: string;
  value: string;
  isRevealed: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
}

interface AISuggestion {
  id: string;
  type: "missing" | "suggestion";
  message: string;
  variable?: string;
}

interface Environment {
  name: string;
  isDefault: boolean;
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
  const [isEditing, setIsEditing] = useState(false);

  const activeEnvironmentName = useMemo(() => {
    if (!activeEnvironmentId) return "environment";
    const localName = environments[activeEnvironmentId]?.name;
    if (localName) return localName;
    return environmentList.find(env => env.id === activeEnvironmentId)?.name ?? "environment";
  }, [activeEnvironmentId, environmentList, environments]);

  const currentEnv = activeEnvironmentId ? environments[activeEnvironmentId] : null;
  const baseUrl = currentEnv?.baseUrl ?? "";
  const environmentName = currentEnv?.name ?? "";
  const variables = currentEnv?.variables ?? [];
  const secrets = currentEnv?.secrets ?? [];
  const hasChanges = currentEnv?.hasChanges ?? false;

  const baseUrlVariable = variables.find(variable => variable.key === "BASE_URL" && !variable.isDeleted);
  const visibleVariables = variables.filter(variable => variable.key !== "BASE_URL" && !variable.isDeleted);
  const visibleSecrets = secrets.filter(secret => !secret.isDeleted);

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

  const sortEnvironmentSummaries = useCallback((items: EnvironmentSummary[]) => {
    return [...items].sort((a, b) => {
      if (a.isDefault === b.isDefault) {
        return a.name.localeCompare(b.name);
      }
      return a.isDefault ? -1 : 1;
    });
  }, []);

  const updateEnvironmentSummary = useCallback((envId: string, env: Environment) => {
    setEnvironmentList(prev => {
      const updated = prev.map(item => item.id === envId ? {
        ...item,
        name: env.name || item.name,
        isDefault: env.isDefault,
      } : item);
      return sortEnvironmentSummaries(updated);
    });
  }, [sortEnvironmentSummaries]);

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
      const summaries = items.map(item => ({
        id: item.id,
        name: item.name,
        isDefault: item.is_default,
      }));
      const sorted = sortEnvironmentSummaries(summaries);
      setEnvironmentList(sorted);
      setActiveEnvironmentId(sorted[0]?.id ?? null);
    } catch (error) {
      toast.error("Failed to load environments", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsListLoading(false);
    }
  }, [sortEnvironmentSummaries, token]);

  const fetchEnvironmentInfo = useCallback(async (envId: string) => {
    if (!token) return;
    setIsDetailLoading(true);
    try {
      const detail = await fetchEnvironmentDetail(envId, token);
      const mapped: Environment = {
        name: detail.name ?? "",
        isDefault: detail.is_default ?? detail.isDefault ?? false,
        baseUrl: detail.base_url ?? detail.baseUrl ?? "",
        variables: (detail.variables ?? []).map((variable, index) => ({
          id: String(variable.id ?? `${envId}-variable-${index}`),
          key: variable.key ?? "",
          value: variable.value ?? "",
          isOverridable: variable.is_overridable ?? variable.isOverridable ?? false,
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

  useEffect(() => {
    setIsEditing(false);
  }, [activeEnvironmentId]);

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
      updateEnvironmentSummary(activeEnvironmentId, snapshot);
    }
    
    // Proceed with pending action
    if (pendingEnvironment) {
      setActiveEnvironmentId(pendingEnvironment);
      setPendingEnvironment(null);
    }
    setShowUnsavedDialog(false);
  }, [activeEnvironmentId, environmentSnapshots, pendingEnvironment, updateEnvironmentSummary]);

  const handleSaveAndProceed = useCallback(async () => {
    // Validate before saving
    const emptyVars = variables.filter(v => !v.isDeleted && v.key && !v.value);
    const emptySecrets = secrets.filter(s => !s.isDeleted && s.key && !s.value);
    
    if (emptyVars.length > 0 || emptySecrets.length > 0) {
      toast.error("Missing values", {
        description: "Some variables or secrets are missing values.",
      });
      setShowUnsavedDialog(false);
      return;
    }

    if (!token || !activeEnvironmentId || !currentEnv) {
      toast.error("Unable to save environment", {
        description: "Missing environment details. Please reload and try again.",
      });
      setShowUnsavedDialog(false);
      return;
    }

    try {
      await updateEnvironment(
        activeEnvironmentId,
        {
          name: currentEnv.name,
          is_default: currentEnv.isDefault,
          base_url: baseUrlVariable?.value ?? currentEnv.baseUrl,
          variables: currentEnv.variables.map(variable => ({
            id: variable.id,
            key: variable.key,
            value: variable.value,
            is_overridable: variable.isOverridable,
            ...(variable.isNew ? { new: true } : {}),
            ...(variable.isDeleted ? { is_deleted: true } : {}),
          })),
          secrets: currentEnv.secrets.map(secret => ({
            id: secret.id,
            key: secret.key,
            value: secret.value,
            ...(secret.isNew ? { new: true } : {}),
            ...(secret.isDeleted ? { is_deleted: true } : {}),
          })),
        },
        token
      );

      toast.success("Environment saved", {
        description: `Your ${activeEnvironmentName} environment configuration has been updated.`,
      });
    } catch (error) {
      toast.error("Failed to save environment", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
      setShowUnsavedDialog(false);
      return;
    }
    
    setEnvironments(prev => ({
      ...prev,
      [activeEnvironmentId]: { ...prev[activeEnvironmentId], hasChanges: false },
    }));
    setEnvironmentSnapshots(prev => ({
      ...prev,
      [activeEnvironmentId]: { ...prev[activeEnvironmentId], hasChanges: false },
    }));
    updateEnvironmentSummary(activeEnvironmentId, currentEnv);

    // Proceed with pending action
    if (pendingEnvironment) {
      setActiveEnvironmentId(pendingEnvironment);
      setPendingEnvironment(null);
    }
    setShowUnsavedDialog(false);
  }, [
    activeEnvironmentName,
    activeEnvironmentId,
    baseUrlVariable?.value,
    currentEnv,
    pendingEnvironment,
    secrets,
    token,
    updateEnvironmentSummary,
    variables,
  ]);

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
      [activeEnvironmentId]: { ...snapshot, hasChanges: false },
    }));
    updateEnvironmentSummary(activeEnvironmentId, snapshot);
    setIsEditing(false);
    toast.info("Changes discarded", {
      description: `Your ${activeEnvironmentName} environment has been reset.`,
    });
  };

  const updateCurrentEnv = (updates: Partial<Environment>) => {
    if (!activeEnvironmentId || !isEditing) return;
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
    updateCurrentEnv({
      variables: [
        ...variables,
        { id: String(Date.now()), key: "", value: "", isOverridable: false, isNew: true },
      ],
    });
  };

  const updateVariable = (id: string, field: "key" | "value" | "isOverridable", value: string | boolean) => {
    updateCurrentEnv({ variables: variables.map(v => v.id === id ? { ...v, [field]: value } : v) });
  };

  const removeVariable = (id: string) => {
    updateCurrentEnv({
      variables: variables.map(v => v.id === id ? { ...v, isDeleted: true } : v),
    });
  };

  const addSecret = () => {
    updateCurrentEnv({
      secrets: [...secrets, { id: String(Date.now()), key: "", value: "", isRevealed: true, isNew: true }],
    });
  };

  const updateSecret = (id: string, field: "key" | "value", value: string) => {
    updateCurrentEnv({ secrets: secrets.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };

  const removeSecret = (id: string) => {
    updateCurrentEnv({
      secrets: secrets.map(s => s.id === id ? { ...s, isDeleted: true } : s),
    });
  };

  const toggleSecretVisibility = (id: string) => {
    updateCurrentEnv({ secrets: secrets.map(s => s.id === id ? { ...s, isRevealed: !s.isRevealed } : s) });
  };

  const addSuggestedVariable = (variable: string) => {
    updateCurrentEnv({
      variables: [
        ...variables,
        { id: String(Date.now()), key: variable, value: "", isOverridable: false, isNew: true },
      ],
    });
    toast.success("Variable added", {
      description: `${variable} has been added. Don't forget to set its value.`,
    });
  };

  const handleSave = async () => {
    // Validate
    const emptyVars = variables.filter(v => !v.isDeleted && v.key && !v.value);
    const emptySecrets = secrets.filter(s => !s.isDeleted && s.key && !s.value);
    
    if (emptyVars.length > 0 || emptySecrets.length > 0) {
      toast.error("Missing values", {
        description: "Some variables or secrets are missing values.",
      });
      return;
    }

    if (!token || !activeEnvironmentId || !currentEnv) {
      toast.error("Unable to save environment", {
        description: "Missing environment details. Please reload and try again.",
      });
      return;
    }

    try {
      await updateEnvironment(
        activeEnvironmentId,
        {
          name: currentEnv.name,
          is_default: currentEnv.isDefault,
          base_url: baseUrlVariable?.value ?? currentEnv.baseUrl,
          variables: currentEnv.variables.map(variable => ({
            id: variable.id,
            key: variable.key,
            value: variable.value,
            is_overridable: variable.isOverridable,
            ...(variable.isNew ? { new: true } : {}),
            ...(variable.isDeleted ? { is_deleted: true } : {}),
          })),
          secrets: currentEnv.secrets.map(secret => ({
            id: secret.id,
            key: secret.key,
            value: secret.value,
            ...(secret.isNew ? { new: true } : {}),
            ...(secret.isDeleted ? { is_deleted: true } : {}),
          })),
        },
        token
      );

      toast.success("Environment saved", {
        description: `Your ${activeEnvironmentName} environment configuration has been updated.`,
      });
    } catch (error) {
      toast.error("Failed to save environment", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
      return;
    }

    setEnvironments(prev => ({
      ...prev,
      [activeEnvironmentId]: { ...prev[activeEnvironmentId], hasChanges: false },
    }));
    setEnvironmentSnapshots(prev => ({
      ...prev,
      [activeEnvironmentId]: { ...prev[activeEnvironmentId], hasChanges: false },
    }));
    updateEnvironmentSummary(activeEnvironmentId, currentEnv);
  };

  const handleAddBaseUrlVariable = () => {
    if (baseUrlVariable) return;
    updateCurrentEnv({
      variables: [
        ...variables,
        { id: String(Date.now()), key: "BASE_URL", value: "", isOverridable: false, isNew: true },
      ],
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
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} className="gap-2 flex-1 sm:flex-none">
                  <Save className="w-4 h-4" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button variant="outline" onClick={handleCancelChanges} className="gap-2 flex-1 sm:flex-none">
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={!hasChanges} className="gap-2 flex-1 sm:flex-none">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </>
              )}
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
                    <span className="flex items-center gap-2">
                      <span>{env.name}</span>
                    </span>
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
                      disabled={!isEditing}
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
              {/* Environment Details */}
              <Card className="border-border/50 shadow-soft">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Environment details</CardTitle>
                  <CardDescription>
                    Name settings for this environment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Environment name</Label>
                    <Input
                      value={environmentName}
                      onChange={(e) => updateCurrentEnv({ name: e.target.value })}
                      placeholder="Environment name"
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>

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
                      <Button
                        variant="link"
                        className="px-2"
                        onClick={handleAddBaseUrlVariable}
                        disabled={!isEditing}
                      >
                        Add BASE_URL
                      </Button>
                    </div>
                  )}
                  <Input
                    value={baseUrlVariable?.value ?? baseUrl}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                    placeholder="https://api.example.com"
                    className="font-mono"
                    disabled={!isEditing}
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
                    {isEditing && (
                      <Button variant="outline" size="sm" onClick={addVariable} className="gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Add Variable
                      </Button>
                    )}
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
                        <div className="flex-1 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Key</Label>
                            <Input
                              value={variable.key}
                              onChange={(e) => updateVariable(variable.id, "key", e.target.value)}
                              placeholder="VARIABLE_NAME"
                              className="font-mono text-sm"
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Value</Label>
                            <Input
                              value={variable.value}
                              onChange={(e) => updateVariable(variable.id, "value", e.target.value)}
                              placeholder="value"
                              className="font-mono text-sm"
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                            <Label className="text-xs text-muted-foreground">Overridable</Label>
                            <Switch
                              checked={variable.isOverridable}
                              onCheckedChange={(checked) => updateVariable(variable.id, "isOverridable", checked)}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVariable(variable.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive mt-5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
                        {visibleSecrets.length}
                      </Badge>
                    </div>
                    {isEditing && (
                      <Button variant="outline" size="sm" onClick={addSecret} className="gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Add Secret
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Sensitive values like API keys and tokens (stored encrypted)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visibleSecrets.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No secrets defined. Click &quot;Add Secret&quot; to create one.
                    </div>
                  ) : (
                    visibleSecrets.map((secret) => (
                      <div key={secret.id} className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Key</Label>
                            <Input
                              value={secret.key}
                              onChange={(e) => updateSecret(secret.id, "key", e.target.value)}
                              placeholder="SECRET_NAME"
                              className="font-mono text-sm"
                              disabled={!isEditing}
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
                                disabled={!isEditing}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleSecretVisibility(secret.id)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                disabled={!isEditing}
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
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSecret(secret.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive mt-5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {isEditing && (
                <Card className="border-destructive/30 shadow-soft">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible actions for this environment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Delete environment</Label>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete this environment
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Delete environment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
