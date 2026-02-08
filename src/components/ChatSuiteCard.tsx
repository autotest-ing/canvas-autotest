import { Layers, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatSuiteCardProps {
  suiteId: string;
  suiteName: string;
  testCaseCount?: number;
  description?: string;
}

export function ChatSuiteCard({
  suiteId,
  suiteName,
  testCaseCount,
  description,
}: ChatSuiteCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/suites/${suiteId}`)}
      className="group bg-card rounded-xl p-4 shadow-soft transition-all duration-200 cursor-pointer hover:shadow-hover hover:scale-[1.01] w-full"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
          <Layers className="w-5 h-5 text-accent-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{suiteName}</h4>
          {testCaseCount !== undefined && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {testCaseCount} test case{testCaseCount !== 1 ? "s" : ""}
            </p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
          <span className="hidden sm:inline">Open suite</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
