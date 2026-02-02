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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface LeftRailProps {
  activeItem?: string;
  onItemClick?: (id: string) => void;
}

export function LeftRail({ activeItem, onItemClick }: LeftRailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive = activeItem === item.id || location.pathname === item.path;
    const Icon = item.icon;

    const button = (
      <button
        onClick={() => {
          navigate(item.path);
          onItemClick?.(item.id);
        }}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-sidebar-accent",
          isActive && "bg-sidebar-accent text-sidebar-primary"
        )}
      >
        <Icon className={cn(
          "w-5 h-5 flex-shrink-0 transition-colors",
          isActive ? "text-sidebar-primary" : "text-sidebar-foreground"
        )} />
        {isExpanded && (
          <span className={cn(
            "text-sm font-medium whitespace-nowrap animate-fade-in",
            isActive ? "text-sidebar-primary" : "text-sidebar-foreground"
          )}>
            {item.label}
          </span>
        )}
      </button>
    );

    if (isExpanded) return button;

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out",
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
