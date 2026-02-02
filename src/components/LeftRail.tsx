import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  Layers, 
  Play, 
  Database, 
  Globe, 
  Bell, 
  Settings,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock unread count - in a real app, this would come from a context/store
const UNREAD_NOTIFICATION_COUNT = 3;

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  path: string;
}

const topItems: NavItem[] = [
  { icon: Home, label: "Home", id: "home", path: "/" },
  { icon: Layers, label: "Suites", id: "suites", path: "/suites" },
  { icon: Play, label: "Runs", id: "runs", path: "/runs" },
  { icon: Database, label: "Sources", id: "sources", path: "/sources" },
  { icon: Globe, label: "Environments", id: "environments", path: "/environments" },
];

const bottomItems: NavItem[] = [
  { icon: Bell, label: "Notifications", id: "notifications", path: "/notifications" },
  { icon: Settings, label: "Settings", id: "settings", path: "/settings" },
];

// Mobile bottom nav - show most important items
const mobileNavItems: NavItem[] = [
  { icon: Home, label: "Home", id: "home", path: "/" },
  { icon: Layers, label: "Suites", id: "suites", path: "/suites" },
  { icon: Play, label: "Runs", id: "runs", path: "/runs" },
  { icon: Bell, label: "Alerts", id: "notifications", path: "/notifications" },
];

interface LeftRailProps {
  activeItem?: string;
  onItemClick?: (id: string) => void;
}

export function LeftRail({ activeItem, onItemClick }: LeftRailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const handleNavClick = (item: NavItem) => {
    navigate(item.path);
    onItemClick?.(item.id);
    setMobileMenuOpen(false);
  };

  const NavButton = ({ item, showLabel = false }: { item: NavItem; showLabel?: boolean }) => {
    const isActive = activeItem === item.id || location.pathname === item.path;
    const Icon = item.icon;
    const showBadge = item.id === "notifications" && UNREAD_NOTIFICATION_COUNT > 0;

    const button = (
      <button
        onClick={() => handleNavClick(item)}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-sidebar-accent hover:animate-bounce-subtle",
          "active:animate-bounce-click",
          isActive && "bg-sidebar-accent text-sidebar-primary"
        )}
      >
        <div className="relative flex-shrink-0">
          <Icon className={cn(
            "w-5 h-5 transition-colors",
            isActive ? "text-sidebar-primary" : "text-sidebar-foreground"
          )} />
          {showBadge && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {UNREAD_NOTIFICATION_COUNT > 9 ? "9+" : UNREAD_NOTIFICATION_COUNT}
            </span>
          )}
        </div>
        {(isExpanded || showLabel) && (
          <span className={cn(
            "text-sm font-medium whitespace-nowrap",
            isActive ? "text-sidebar-primary" : "text-sidebar-foreground"
          )}>
            {item.label}
          </span>
        )}
      </button>
    );

    if (isExpanded || showLabel) return button;

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  };

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="right" className="w-72 p-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">A</span>
                </div>
                <span className="font-semibold text-foreground">Autotest</span>
              </div>
            </div>
            <nav className="p-2 space-y-1">
              {topItems.map((item) => (
                <NavButton key={item.id} item={item} showLabel />
              ))}
            </nav>
            <nav className="p-2 space-y-1 border-t border-border">
              {bottomItems.map((item) => (
                <NavButton key={item.id} item={item} showLabel />
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-sidebar border-t border-sidebar-border">
          <div className="flex items-center justify-around h-full px-2">
            {mobileNavItems.map((item) => {
              const isActive = activeItem === item.id || location.pathname === item.path;
              const Icon = item.icon;
              const showBadge = item.id === "notifications" && UNREAD_NOTIFICATION_COUNT > 0;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                    "hover:animate-bounce-subtle active:animate-bounce-click",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                        {UNREAD_NOTIFICATION_COUNT > 9 ? "9+" : UNREAD_NOTIFICATION_COUNT}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-muted-foreground hover:animate-bounce-subtle active:animate-bounce-click"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </nav>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out sticky top-0",
        isExpanded ? "w-52" : "w-16"
      )}
    >
      {/* Logo / Brand */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          {isExpanded && (
            <span className="font-semibold text-foreground animate-fade-in">
              Autotest
            </span>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-2 space-y-1">
        {topItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </nav>

      {/* Bottom nav */}
      <nav className="p-2 space-y-1 border-t border-sidebar-border">
        {bottomItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </nav>

      {/* Expand toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 border-t border-sidebar-border hover:bg-sidebar-accent transition-colors"
      >
        <ChevronRight
          className={cn(
            "w-4 h-4 text-sidebar-foreground mx-auto transition-transform duration-300",
            isExpanded && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}

// Bottom spacer component for mobile pages
export function MobileBottomSpacer() {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  return <div className="h-20" />;
}
