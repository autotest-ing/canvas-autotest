import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  AlertTriangle
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

const mockVariables: KeyValuePair[] = [
  { id: "1", key: "API_VERSION", value: "v2" },
  { id: "2", key: "TIMEOUT_MS", value: "5000" },
  { id: "3", key: "MAX_RETRIES", value: "3" },
];

const mockSecrets: SecretPair[] = [
  { id: "1", key: "API_KEY", value: "sk-xxxx-xxxx-xxxx", isRevealed: false },
  { id: "2", key: "AUTH_TOKEN", value: "Bearer eyJhbGc...", isRevealed: false },
];

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
  const [baseUrl, setBaseUrl] = useState("https://api.staging.example.com");
  const [variables, setVariables] = useState<KeyValuePair[]>(mockVariables);
  const [secrets, setSecrets] = useState<SecretPair[]>(mockSecrets);
  const [suggestions] = useState<AISuggestion[]>(mockSuggestions);
  const [hasChanges, setHasChanges] = useState(false);

  const handleBaseUrlChange = (value: string) => {
    setBaseUrl(value);
    setHasChanges(true);
  };

  const addVariable = () => {
    setVariables([...variables, { id: String(Date.now()), key: "", value: "" }]);
    setHasChanges(true);
  };

  const updateVariable = (id: string, field: "key" | "value", value: string) => {
    setVariables(variables.map(v => v.id === id ? { ...v, [field]: value } : v));
    setHasChanges(true);
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
    setHasChanges(true);
  };

  const addSecret = () => {
    setSecrets([...secrets, { id: String(Date.now()), key: "", value: "", isRevealed: true }]);
    setHasChanges(true);
  };

  const updateSecret = (id: string, field: "key" | "value", value: string) => {
    setSecrets(secrets.map(s => s.id === id ? { ...s, [field]: value } : s));
    setHasChanges(true);
  };

  const removeSecret = (id: string) => {
    setSecrets(secrets.filter(s => s.id !== id));
    setHasChanges(true);
  };

  const toggleSecretVisibility = (id: string) => {
    setSecrets(secrets.map(s => s.id === id ? { ...s, isRevealed: !s.isRevealed } : s));
  };

  const addSuggestedVariable = (variable: string) => {
    setVariables([...variables, { id: String(Date.now()), key: variable, value: "" }]);
    setHasChanges(true);
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
      description: "Your environment configuration has been updated.",
    });
    setHasChanges(false);
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
            <Button onClick={handleSave} disabled={!hasChanges} className="gap-2 w-full sm:w-auto">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-6">
          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={cn(
                    "p-4 rounded-xl border flex items-start gap-3 animate-fade-in",
                    suggestion.type === "missing"
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-primary/5 border-primary/20"
                  )}
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
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
          <Card className="border-border/50 shadow-soft animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
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
          <Card className="border-border/50 shadow-soft animate-fade-in" style={{ animationDelay: '180ms', animationFillMode: 'backwards' }}>
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
          <Card className="border-border/50 shadow-soft animate-fade-in" style={{ animationDelay: '260ms', animationFillMode: 'backwards' }}>
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
    </div>
  );
}
