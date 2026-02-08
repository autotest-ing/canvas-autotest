import { Play, Plus, Settings, ArrowRight } from "lucide-react";
import type { HintButton } from "@/lib/api/chat";

interface ChatHintButtonsProps {
  buttons: HintButton[];
  onAction: (button: HintButton) => void;
}

const ICON_MAP: Record<string, typeof Play> = {
  run_suite: Play,
  add_assertions: Plus,
  add_variables: Settings,
};

export function ChatHintButtons({ buttons, onAction }: ChatHintButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {buttons.map((button, i) => {
        const Icon = ICON_MAP[button.action] || ArrowRight;

        return (
          <button
            key={i}
            onClick={() => onAction(button)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Icon className="w-3.5 h-3.5" />
            {button.label}
          </button>
        );
      })}
    </div>
  );
}
