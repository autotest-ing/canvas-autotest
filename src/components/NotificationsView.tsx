import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MobileBottomSpacer } from "./LeftRail";
import { PageTitle } from "./PageTitle";
import { 
  Bell, 
  XCircle, 
  RefreshCw, 
  Sparkles, 
  Check, 
  Trash2,
  CheckCheck,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type NotificationType = "failure" | "sync" | "suggestion";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionPath?: string;
  meta?: {
    suiteName?: string;
    runId?: string;
    sourceName?: string;
  };
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "failure",
    title: "2 tests failed in Orders API",
    description: "POST /orders and GET /orders/{id} returned unexpected responses after your last deploy.",
    timestamp: "5 minutes ago",
    isRead: false,
    actionLabel: "View Run",
    actionPath: "/runs?id=run-42",
    meta: { suiteName: "Orders API", runId: "run-42" },
  },
  {
    id: "2",
    type: "suggestion",
    title: "New assertion recommended",
    description: "Based on recent responses, I suggest adding a schema validation assertion for the /users endpoint.",
    timestamp: "15 minutes ago",
    isRead: false,
    actionLabel: "Review",
    actionPath: "/suites?id=users-suite",
  },
  {
    id: "3",
    type: "sync",
    title: "E-Commerce API synced successfully",
    description: "45 requests imported. 3 new endpoints detected since last sync.",
    timestamp: "1 hour ago",
    isRead: false,
    actionLabel: "View Source",
    actionPath: "/sources",
    meta: { sourceName: "E-Commerce API" },
  },
  {
    id: "4",
    type: "failure",
    title: "Auth Suite regression detected",
    description: "The login endpoint is returning 401 errors intermittently. This may indicate a token issue.",
    timestamp: "2 hours ago",
    isRead: true,
    actionLabel: "Fix with AI",
    actionPath: "/runs?id=run-41",
    meta: { suiteName: "Auth Suite", runId: "run-41" },
  },
  {
    id: "5",
    type: "suggestion",
    title: "Consider adding rate limit tests",
    description: "Your API returned 429 responses 12 times last week. Adding rate limit assertions could help catch issues early.",
    timestamp: "3 hours ago",
    isRead: true,
  },
  {
    id: "6",
    type: "sync",
    title: "Payment Gateway sync failed",
    description: "Unable to fetch latest OpenAPI spec. The URL may be incorrect or the server is unavailable.",
    timestamp: "5 hours ago",
    isRead: true,
    actionLabel: "Retry",
    actionPath: "/sources",
    meta: { sourceName: "Payment Gateway" },
  },
  {
    id: "7",
    type: "suggestion",
    title: "Missing environment variable",
    description: "The WEBHOOK_SECRET variable is used in 3 requests but not defined in your environment.",
    timestamp: "1 day ago",
    isRead: true,
    actionLabel: "Add Variable",
    actionPath: "/environments",
  },
];

const typeConfig: Record<NotificationType, { icon: typeof XCircle; color: string; bgColor: string }> = {
  failure: {
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  sync: {
    icon: RefreshCw,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  suggestion: {
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
};

export function NotificationsView() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success("Notification dismissed");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const handleAction = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollArea className="flex-1">
        <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border/50 mb-6">
            <div className="flex items-center gap-3">
              <PageTitle>Notifications</PageTitle>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2 flex-1 sm:flex-none">
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark all read</span>
                  <span className="sm:hidden">Read all</span>
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearAll} className="gap-2 flex-1 sm:flex-none">
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear all</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                All caught up!
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                You have no notifications. We'll let you know when something needs your attention.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-200",
                      notification.isRead
                        ? "bg-card/50 border-border/30"
                        : "bg-card border-border/50 shadow-soft"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        config.bgColor
                      )}>
                        <Icon className={cn("w-5 h-5", config.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              "font-medium",
                              notification.isRead ? "text-muted-foreground" : "text-foreground"
                            )}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp}
                            </span>
                          </div>
                        </div>
                        <p className={cn(
                          "text-sm mt-1",
                          notification.isRead ? "text-muted-foreground/70" : "text-muted-foreground"
                        )}>
                          {notification.description}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          {notification.actionLabel && (
                            <Button
                              size="sm"
                              variant={notification.isRead ? "outline" : "default"}
                              onClick={() => handleAction(notification)}
                              className="h-8"
                            >
                              {notification.actionLabel}
                            </Button>
                          )}
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Mark read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <MobileBottomSpacer />
        </div>
      </ScrollArea>
    </div>
  );
}
