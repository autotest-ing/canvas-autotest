import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SuiteCanvas } from "@/components/SuiteCanvas";

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe("SuiteCanvas split run button", () => {
  it("calls onRunSuite from primary button", () => {
    const onRunSuite = vi.fn();

    render(
      <SuiteCanvas
        suiteName="Suite"
        selectedTestCase={null}
        suiteDescription=""
        suggestions={[]}
        environments={[]}
        selectedEnvironmentId={null}
        onEnvironmentChange={vi.fn()}
        onRunSuite={onRunSuite}
        onRunWithOverrides={vi.fn()}
        onAskAI={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Run Suite" }));
    expect(onRunSuite).toHaveBeenCalledTimes(1);
  });

  it("calls onRunWithOverrides from dropdown action", () => {
    const onRunWithOverrides = vi.fn();

    render(
      <SuiteCanvas
        suiteName="Suite"
        selectedTestCase={null}
        suiteDescription=""
        suggestions={[]}
        environments={[]}
        selectedEnvironmentId={null}
        onEnvironmentChange={vi.fn()}
        onRunSuite={vi.fn()}
        onRunWithOverrides={onRunWithOverrides}
        onAskAI={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Run with Overrides" }));
    expect(onRunWithOverrides).toHaveBeenCalledTimes(1);
  });
});
