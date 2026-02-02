import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MobileBottomSpacer } from "./LeftRail";
import { 
  Sun, 
  Moon, 
  Monitor, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Save,
  Mail,
  Building,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ThemeOption {
  value: "light" | "dark" | "system";
  label: string;
  icon: typeof Sun;
}

const themeOptions: ThemeOption[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [hasChanges, setHasChanges] = useState(false);
  
  // Account settings
  const [name, setName] = useState("Alex Johnson");
  const [email, setEmail] = useState("alex@example.com");
  const [company, setCompany] = useState("Acme Inc.");
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [failureAlerts, setFailureAlerts] = useState(true);
  const [syncUpdates, setSyncUpdates] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleSave = () => {
    toast.success("Settings saved", {
      description: "Your preferences have been updated.",
    });
    setHasChanges(false);
  };

  const handleChange = () => {
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges} className="gap-2 w-full sm:w-auto">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 max-w-3xl space-y-6">
          {/* Account */}
          <Card className="border-border/50 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base">Account</CardTitle>
              </div>
              <CardDescription>
                Your personal account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="text-lg">AJ</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Change avatar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); handleChange(); }}
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); handleChange(); }}
                  placeholder="your@email.com"
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  Company
                </Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => { setCompany(e.target.value); handleChange(); }}
                  placeholder="Your company"
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card className="border-border/50 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base">Appearance</CardTitle>
              </div>
              <CardDescription>
                Choose how Autotest.ing looks to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-accent/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <Icon className={cn(
                        "w-6 h-6",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-border/50 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base">Notifications</CardTitle>
              </div>
              <CardDescription>
                Configure how you receive updates and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={(checked) => { setEmailNotifications(checked); handleChange(); }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Test Failure Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when tests fail
                  </p>
                </div>
                <Switch
                  checked={failureAlerts}
                  onCheckedChange={(checked) => { setFailureAlerts(checked); handleChange(); }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sync Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when sources finish syncing
                  </p>
                </div>
                <Switch
                  checked={syncUpdates}
                  onCheckedChange={(checked) => { setSyncUpdates(checked); handleChange(); }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive AI-powered improvement suggestions
                  </p>
                </div>
                <Switch
                  checked={aiSuggestions}
                  onCheckedChange={(checked) => { setAiSuggestions(checked); handleChange(); }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Get a summary of your test results weekly
                  </p>
                </div>
                <Switch
                  checked={weeklyDigest}
                  onCheckedChange={(checked) => { setWeeklyDigest(checked); handleChange(); }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-border/50 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base">Security</CardTitle>
              </div>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Password</Label>
                  <p className="text-sm text-muted-foreground">
                    Last changed 3 months ago
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enable 2FA
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Keys</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage keys for CI/CD integrations
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Manage Keys
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
          <MobileBottomSpacer />
        </div>
      </ScrollArea>
    </div>
  );
}
