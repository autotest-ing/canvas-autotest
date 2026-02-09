import { useState } from "react";
import {
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/api/chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHistorySidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function ChatHistorySidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
}: ChatHistorySidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const submitRename = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  // Group conversations by date
  const groups = groupByDate(conversations);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Chat History</span>
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title="New chat"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-4">
        {groups.map(({ label, items }) => (
          <div key={label}>
            <div className="px-2 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </div>
            <div className="space-y-0.5">
              {items.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  isEditing={conv.id === editingId}
                  editTitle={editTitle}
                  onSelect={() => onSelect(conv.id)}
                  onStartRename={() => startRename(conv)}
                  onDelete={() => onDelete(conv.id)}
                  onEditChange={setEditTitle}
                  onEditSubmit={submitRename}
                  onEditCancel={cancelRename}
                />
              ))}
            </div>
          </div>
        ))}

        {conversations.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onStartRename,
  onDelete,
  onEditChange,
  onEditSubmit,
  onEditCancel,
}: {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onStartRename: () => void;
  onDelete: () => void;
  onEditChange: (val: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
}) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-accent">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEditSubmit();
            if (e.key === "Escape") onEditCancel();
          }}
          className="flex-1 text-sm bg-transparent border-none outline-none text-foreground min-w-0"
          autoFocus
        />
        <button onClick={onEditSubmit} className="p-1 hover:bg-background rounded">
          <Check className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={onEditCancel} className="p-1 hover:bg-background rounded">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent"
      )}
      onClick={onSelect}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
      <span className="flex-1 text-sm truncate text-foreground">
        {conversation.title}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-background transition-opacity"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
          >
            <Pencil className="w-3.5 h-3.5 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type DateGroup = { label: string; items: Conversation[] };

function groupByDate(conversations: Conversation[]): DateGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7 = new Date(today);
  last7.setDate(last7.getDate() - 7);
  const last30 = new Date(today);
  last30.setDate(last30.getDate() - 30);

  const groups: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    "Previous 30 days": [],
    Older: [],
  };

  for (const conv of conversations) {
    const d = new Date(conv.updated_at);
    if (d >= today) {
      groups["Today"].push(conv);
    } else if (d >= yesterday) {
      groups["Yesterday"].push(conv);
    } else if (d >= last7) {
      groups["Previous 7 days"].push(conv);
    } else if (d >= last30) {
      groups["Previous 30 days"].push(conv);
    } else {
      groups["Older"].push(conv);
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}
