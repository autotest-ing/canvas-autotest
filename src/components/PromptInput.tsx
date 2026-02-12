import { useRef, useState, useEffect, useCallback } from "react";
import { Paperclip, Sparkles, Play, X, FileJson, Loader2, FolderPlus, TestTube, Footprints, Import, ChevronRight, FileCode, FileType, Braces, ClipboardList, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SlashCommand {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  prompt?: string;
  action?: string;
  children?: SlashCommand[];
}

const slashCommands: SlashCommand[] = [
  {
    id: "agent-mode",
    label: "Agent mode",
    description: "Auto-create assertions & exports after each step run",
    icon: Bot,
    action: "toggle_agent_mode",
  },
  {
    id: "create-test-plan",
    label: "Create test plan",
    description: "Generate a comprehensive test plan",
    icon: ClipboardList,
    prompt: "Create a test plan for ",
  },
  {
    id: "suites",
    label: "Suites",
    icon: FolderPlus,
    children: [
      {
        id: "create-suite",
        label: "Create Suite",
        description: "Create a new test suite for organizing test cases",
        icon: FolderPlus,
        prompt: "Create a new test suite called ",
      },
      {
        id: "update-suite",
        label: "Update Suite",
        description: "Update an existing test suite",
        icon: FolderPlus,
        prompt: "Update the test suite ",
      },
    ],
  },
  {
    id: "test-cases",
    label: "Test Cases",
    icon: TestTube,
    children: [
      {
        id: "create-test-case",
        label: "Create Test Case",
        description: "Create a new test case within a test suite",
        icon: TestTube,
        prompt: "Create a new test case for ",
      },
    ],
  },
  {
    id: "test-steps",
    label: "Test Steps",
    icon: Footprints,
    children: [
      {
        id: "create-test-step",
        label: "Create Test Step",
        description: "Create a new test step within a test case. A step represents a single HTTP request.",
        icon: Footprints,
        prompt: "Create a new test step that ",
      },
    ],
  },
  {
    id: "import",
    label: "Import",
    icon: Import,
    children: [
      {
        id: "import-curl",
        label: "cURL",
        description: "Import from a cURL command",
        icon: FileCode,
        prompt: "Import from cURL: ",
      },
      {
        id: "import-postman",
        label: "Postman",
        description: "Import from Postman collection",
        icon: FileJson,
        prompt: "Import my Postman collection ",
      },
      {
        id: "import-openapi",
        label: "OpenAPI",
        description: "Import from OpenAPI specification",
        icon: Braces,
        prompt: "Import from OpenAPI spec ",
      },
      {
        id: "import-swagger",
        label: "Swagger",
        description: "Import from Swagger specification",
        icon: FileType,
        prompt: "Import from Swagger spec ",
      },
    ],
  },
];

interface PromptInputProps {
  onSubmit: (prompt: string, attachedFile?: File | null) => void;
  onPlan?: () => void;
  isLoading?: boolean;
  showExamplePrompts?: boolean;
  agentMode?: boolean;
  onAgentModeChange?: (enabled: boolean) => void;
}

export function PromptInput({
  onSubmit,
  onPlan,
  isLoading,
  showExamplePrompts = true,
  agentMode = false,
  onAgentModeChange,
}: PromptInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [slashFilter, setSlashFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuAnchorRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (isLoading) return;
    if (value.trim() || attachedFile) {
      onSubmit(value.trim(), attachedFile);
      setValue("");
      setAttachedFile(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu) {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashMenu(false);
        setActiveSubmenu(null);
        setSlashFilter("");
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !showSlashMenu) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Check if "/" was just typed at start or after space
    const cursorPos = e.target.selectionStart;
    const charBefore = newValue[cursorPos - 2];
    const charTyped = newValue[cursorPos - 1];

    if (charTyped === "/" && (cursorPos === 1 || charBefore === " " || charBefore === "\n")) {
      setShowSlashMenu(true);
      setSlashFilter("");
      setActiveSubmenu(null);
    } else if (showSlashMenu) {
      // Extract filter text after the slash
      const slashIndex = newValue.lastIndexOf("/");
      if (slashIndex !== -1) {
        const filterText = newValue.slice(slashIndex + 1);
        if (filterText.includes(" ") || filterText.includes("\n")) {
          setShowSlashMenu(false);
          setActiveSubmenu(null);
          setSlashFilter("");
        } else {
          setSlashFilter(filterText);
        }
      }
    }
  };

  const handleCommandSelect = useCallback((command: SlashCommand) => {
    if (command.children) {
      setActiveSubmenu(command.id);
      return;
    }

    if (command.action === "toggle_agent_mode") {
      onAgentModeChange?.(!agentMode);
      // Remove the slash text
      const slashIndex = value.lastIndexOf("/");
      const newValue = slashIndex !== -1 ? value.slice(0, slashIndex) : value;
      setValue(newValue);
      setShowSlashMenu(false);
      setActiveSubmenu(null);
      setSlashFilter("");
      setTimeout(() => textareaRef.current?.focus(), 0);
      return;
    }

    if (command.prompt) {
      // Remove the slash and any filter text, then insert the prompt
      const slashIndex = value.lastIndexOf("/");
      const newValue = slashIndex !== -1
        ? value.slice(0, slashIndex) + command.prompt
        : command.prompt;
      setValue(newValue);
      setShowSlashMenu(false);
      setActiveSubmenu(null);
      setSlashFilter("");

      // Focus textarea and move cursor to end
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newValue.length, newValue.length);
      }, 0);
    }
  }, [value, agentMode, onAgentModeChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSlashMenu && !menuAnchorRef.current?.contains(e.target as Node)) {
        setShowSlashMenu(false);
        setActiveSubmenu(null);
        setSlashFilter("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSlashMenu]);

  const filteredCommands = slashCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
    cmd.children?.some(child => child.label.toLowerCase().includes(slashFilter.toLowerCase()))
  );

  const activeParent = slashCommands.find(c => c.id === activeSubmenu);

  const placeholders = [
    "Import my Postman collection and create regression tests",
    "Generate API tests from this OpenAPI spec",
    "Run all suites on staging and fix failures",
  ];

  const canSubmit = (value.trim() || attachedFile) && !isLoading;

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto transition-all duration-300",
        isFocused && "scale-[1.01]"
      )}
    >
      <div
        className={cn(
          "relative bg-card rounded-2xl shadow-soft transition-all duration-300",
          isFocused && "shadow-prompt ring-2 ring-primary/20"
        )}
        ref={menuAnchorRef}
      >
        {/* Attached file indicator */}
        {attachedFile && (
          <div className="px-4 pt-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm">
              <FileJson className="w-4 h-4" />
              <span className="truncate max-w-[200px]">{attachedFile.name}</span>
              <button
                onClick={removeFile}
                className="hover:bg-accent-foreground/10 rounded p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="p-4 pb-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[0]}
            rows={2}
            disabled={isLoading}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed disabled:opacity-50"
          />
        </div>

        {/* Slash command menu */}
        {showSlashMenu && (
          <div className="absolute bottom-full left-4 mb-2 z-50 flex gap-1">
            {/* Main menu */}
            <div className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[220px]">
              <Command className="bg-transparent">
                <CommandList>
                  <CommandEmpty>No commands found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCommands.map((command) => (
                      <CommandItem
                        key={command.id}
                        value={command.label}
                        onSelect={() => handleCommandSelect(command)}
                        onMouseEnter={() => command.children && setActiveSubmenu(command.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 cursor-pointer",
                          activeSubmenu === command.id && "bg-accent",
                          command.action === "toggle_agent_mode" && agentMode && "bg-primary/10"
                        )}
                      >
                        <command.icon className={cn(
                          "w-4 h-4",
                          command.action === "toggle_agent_mode" && agentMode
                            ? "text-primary"
                            : "text-muted-foreground"
                        )} />
                        <span className="flex-1">{command.label}</span>
                        {command.action === "toggle_agent_mode" && (
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full font-medium",
                            agentMode
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {agentMode ? "ON" : "OFF"}
                          </span>
                        )}
                        {command.children && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>

            {/* Submenu */}
            {activeParent?.children && (
              <div className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[280px]">
                <Command className="bg-transparent">
                  <CommandList>
                    <CommandGroup>
                      {activeParent.children.map((child) => (
                        <CommandItem
                          key={child.id}
                          value={child.label}
                          onSelect={() => handleCommandSelect(child)}
                          className="flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <child.icon className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{child.label}</span>
                          </div>
                          {child.description && (
                            <span className="text-xs text-muted-foreground pl-6">
                              {child.description}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <Paperclip className="w-4 h-4" />
              <span>Attach</span>
            </button>
            <button
              onClick={() => onAgentModeChange?.(!agentMode)}
              disabled={isLoading}
              title={agentMode ? "Agent mode: ON — auto-creates assertions & exports" : "Agent mode: OFF"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50",
                agentMode
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Bot className="w-4 h-4" />
              <span>Agent</span>
            </button>
            {onPlan && (
              <button
                onClick={onPlan}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Plan</span>
              </button>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200",
              canSubmit
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-soft"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example prompts (only shown when not loading) */}
      {!isLoading && showExamplePrompts && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {placeholders.slice(0).map((prompt, i) => (
            <button
              key={i}
              onClick={() => setValue(prompt)}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full bg-card/50 hover:bg-card transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
