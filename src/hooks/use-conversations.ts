import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchConversations,
  deleteConversation as apiDeleteConversation,
  renameConversation as apiRenameConversation,
  type Conversation,
} from "@/lib/api/chat";

export type UseConversations = {
  conversations: Conversation[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  addOrUpdate: (conv: Partial<Conversation> & { id: string }) => void;
};

export function useConversations(): UseConversations {
  const { token, currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const accountId = currentUser?.default_account_id;

  const refresh = useCallback(async () => {
    if (!token || !accountId) return;
    setIsLoading(true);
    try {
      const { items } = await fetchConversations(token, accountId);
      setConversations(items);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [token, accountId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!token) return;
      await apiDeleteConversation(token, id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    },
    [token],
  );

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      if (!token) return;
      const updated = await apiRenameConversation(token, id, title);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      );
    },
    [token],
  );

  const addOrUpdate = useCallback(
    (conv: Partial<Conversation> & { id: string }) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conv.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...conv };
          return updated;
        }
        // Add to the top
        return [conv as Conversation, ...prev];
      });
    },
    [],
  );

  return {
    conversations,
    isLoading,
    refresh,
    deleteConversation,
    renameConversation,
    addOrUpdate,
  };
}
