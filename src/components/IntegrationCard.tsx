import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface IntegrationCardProps {
  id: string;
  name: string;
  icon: string;
  isConnected: boolean;
  onClick?: () => void;
}

export function IntegrationCard({ id, name, icon, isConnected, onClick }: IntegrationCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      toast({
        title: isConnected ? "Manage Integration" : "Connect Integration",
        description: `${name} integration settings would open here.`,
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card",
        "transition-all duration-200 hover:shadow-md hover:border-primary/20",
        "focus:outline-none focus:ring-2 focus:ring-primary/20"
      )}
    >
      {/* Connected indicator dot */}
      {isConnected && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500" />
      )}

      {/* Icon */}
      <span className="text-3xl">{icon}</span>

      {/* Name */}
      <span className="text-sm font-medium text-foreground">{name}</span>

      {/* Status badge */}
      <Badge
        variant={isConnected ? "default" : "outline"}
        className={cn(
          "text-[10px] px-2 py-0.5",
          isConnected && "bg-green-600 hover:bg-green-600"
        )}
      >
        {isConnected ? "Connected" : "Not connected"}
      </Badge>
    </button>
  );
}
