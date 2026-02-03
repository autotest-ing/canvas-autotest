import { useState, useEffect, useCallback } from "react";
import { useBlocker } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type EnvironmentName = "production" | "development" | "staging";

const initialEnvironments: Record<EnvironmentName, Environment> = {
  production: {
    baseUrl: "https://api.example.com",
    variables: [
      { id: "p1", key: "API_VERSION", value: "v1" },
      { id: "p2", key: "TIMEOUT_MS", value: "10000" },
      { id: "p3", key: "MAX_RETRIES", value: "5" },
    ],
    secrets: [
      { id: "p1", key: "API_KEY", value: "sk-prod-xxxx-xxxx", isRevealed: false },
      { id: "p2", key: "AUTH_TOKEN", value: "Bearer prod-eyJhbGc...", isRevealed: false },
    ],
    hasChanges: false,
  },
  development: {
    baseUrl: "https://api.dev.example.com",
    variables: [
      { id: "d1", key: "API_VERSION", value: "v2" },
      { id: "d2", key: "TIMEOUT_MS", value: "3000" },
      { id: "d3", key: "DEBUG_MODE", value: "true" },
    ],
    secrets: [
      { id: "d1", key: "API_KEY", value: "sk-dev-xxxx-xxxx", isRevealed: false },
    ],
    hasChanges: false,
  },
  staging: {
    baseUrl: "https://api.staging.example.com",
    variables: [
      { id: "s1", key: "API_VERSION", value: "v2" },
      { id: "s2", key: "TIMEOUT_MS", value: "5000" },
      { id: "s3", key: "MAX_RETRIES", value: "3" },
    ],
    secrets: [
      { id: "s1", key: "API_KEY", value: "sk-staging-xxxx-xxxx", isRevealed: false },
      { id: "s2", key: "AUTH_TOKEN", value: "Bearer staging-eyJhbGc...", isRevealed: false },
    ],
    hasChanges: false,
  },
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

export function EnvironmentsView() {
  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentName>("development");
  const [environments, setEnvironments] = useState<Record<EnvironmentName, Environment>>(initialEnvironments);
  const [suggestions] = useState<AISuggestion[]>(mockSuggestions);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingEnvironment, setPendingEnvironment] = useState<EnvironmentName | null>(null);

  const currentEnv = environments[activeEnvironment];
  const { baseUrl, variables, secrets, hasChanges } = currentEnv;

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges && currentLocation.pathname !== nextLocation.pathname
  );

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

  // Show dialog when blocker is active
  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowUnsavedDialog(true);
      setPendingEnvironment(null);
    }
  }, [blocker.state]);

  const handleTabChange = (value: string) => {
    const newEnv = value as EnvironmentName;
    if (newEnv === activeEnvironment) return;
    
    if (hasChanges) {
      setPendingEnvironment(newEnv);
      setShowUnsavedDialog(true);
    } else {
      setActiveEnvironment(newEnv);
    }
  };

  const handleDiscard = useCallback(() => {
    // Reset current environment to initial state
    setEnvironments(prev => ({
      ...prev,
      [activeEnvironment]: initialEnvironments[activeEnvironment],
    }));
    
    // Proceed with pending action
    if (pendingEnvironment) {
      setActiveEnvironment(pendingEnvironment);
      setPendingEnvironment(null);
    } else if (blocker.state === "blocked") {
      blocker.proceed();
    }
    setShowUnsavedDialog(false);
  }, [activeEnvironment, pendingEnvironment, blocker]);

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
      description: `Your ${activeEnvironment} environment configuration has been updated.`,
    });
    
    setEnvironments(prev => ({
      ...prev,
      [activeEnvironment]: { ...prev[activeEnvironment], hasChanges: false },
    }));

    // Proceed with pending action
    if (pendingEnvironment) {
      setActiveEnvironment(pendingEnvironment);
      setPendingEnvironment(null);
    } else if (blocker.state === "blocked") {
      blocker.proceed();
    }
    setShowUnsavedDialog(false);
  }, [activeEnvironment, pendingEnvironment, blocker, variables, secrets]);

  const handleCancelDialog = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingEnvironment(null);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  const handleCancelChanges = () => {
    setEnvironments(prev => ({
      ...prev,
      [activeEnvironment]: initialEnvironments[activeEnvironment],
    }));
    toast.info("Changes discarded", {
      description: `Your ${activeEnvironment} environment has been reset.`,
    });
  };

  const updateCurrentEnv = (updates: Partial<Environment>) => {
    setEnvironments(prev => ({
      ...prev,
      [activeEnvironment]: { ...prev[activeEnvironment], ...updates, hasChanges: true },
    }));
  };

  const handleBaseUrlChange = (value: string) => {
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
      description: `Your ${activeEnvironment} environment configuration has been updated.`,
    });
    setEnvironments(prev => ({
      ...prev,
      [activeEnvironment]: { ...prev[activeEnvironment], hasChanges: false },
    }));
  };

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
          <Tabs value={activeEnvironment} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="production" className="flex-1 sm:flex-none">Production</TabsTrigger>
              <TabsTrigger value="development" className="flex-1 sm:flex-none">Development</TabsTrigger>
              <TabsTrigger value="staging" className="flex-1 sm:flex-none">Staging</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Content */}
          <div className="space-y-6">
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
            <CardContent>
              <Input
                value={baseUrl}
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
                    {variables.length}
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
              {variables.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No variables defined. Click "Add Variable" to create one.
                </div>
              ) : (
                variables.map((variable) => (
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
                  No secrets defined. Click "Add Secret" to create one.
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
              You have unsaved changes to the {activeEnvironment.charAt(0).toUpperCase() + activeEnvironment.slice(1)} environment. 
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
