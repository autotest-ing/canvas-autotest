import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-accent"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium px-1.5 py-0.5">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
