import { useState, useCallback } from "react";
import { useKeyboardShortcuts, useSequenceShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  // Register keyboard shortcuts
  useKeyboardShortcuts({ onOpenShortcutsDialog: handleOpenDialog });
  useSequenceShortcuts();

  return (
    <>
      {children}
      <KeyboardShortcutsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
