import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
}

interface UseKeyboardShortcutsOptions {
  onOpenShortcutsDialog?: () => void;
}

export function useKeyboardShortcuts({ onOpenShortcutsDialog }: UseKeyboardShortcutsOptions = {}) {
  const navigate = useNavigate();

  const shortcuts: Shortcut[] = [
    // Navigation shortcuts (g + key for "go to")
    { key: "g h", description: "Go to Home", action: () => navigate("/") },
    { key: "g s", description: "Go to Suites", action: () => navigate("/suites") },
    { key: "g r", description: "Go to Runs", action: () => navigate("/runs") },
    { key: "g o", description: "Go to Sources", action: () => navigate("/sources") },
    { key: "g e", description: "Go to Environments", action: () => navigate("/environments") },
    { key: "g n", description: "Go to Notifications", action: () => navigate("/notifications") },
    { key: "g ,", description: "Go to Settings", action: () => navigate("/settings") },
    // Help
    { key: "?", description: "Show keyboard shortcuts", action: () => onOpenShortcutsDialog?.() },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    // Handle "?" for help
    if (event.key === "?" && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      onOpenShortcutsDialog?.();
      return;
    }
  }, [onOpenShortcutsDialog]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

// Separate hook for two-key sequences like "g h"
export function useSequenceShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;
    const SEQUENCE_TIMEOUT = 500; // ms

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const key = event.key.toLowerCase();

      // Check for sequence
      if (lastKey === "g" && now - lastKeyTime < SEQUENCE_TIMEOUT) {
        event.preventDefault();
        switch (key) {
          case "h":
            navigate("/");
            break;
          case "s":
            navigate("/suites");
            break;
          case "r":
            navigate("/runs");
            break;
          case "o":
            navigate("/sources");
            break;
          case "e":
            navigate("/environments");
            break;
          case "n":
            navigate("/notifications");
            break;
          case ",":
            navigate("/settings");
            break;
        }
        lastKey = "";
        return;
      }

      lastKey = key;
      lastKeyTime = now;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}
