import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RunWithOverridesDialog, type OverrideVariableRow } from "@/components/RunWithOverridesDialog";

describe("RunWithOverridesDialog", () => {
  const variables: OverrideVariableRow[] = [
    { id: "1", key: "BASE_URL", value: "https://api.example.com" },
    { id: "2", key: "TOKEN", value: "abc123" },
  ];

  it("renders skeleton rows while loading", () => {
    render(
      <RunWithOverridesDialog
        open
        onOpenChange={vi.fn()}
        variables={[]}
        isLoading
        isSubmitting={false}
        onVariableChange={vi.fn()}
        onRun={vi.fn()}
      />
    );

    expect(screen.queryByDisplayValue("BASE_URL")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run" })).toBeDisabled();
  });

  it("renders editable key/value fields and updates values", () => {
    const onVariableChange = vi.fn();
    render(
      <RunWithOverridesDialog
        open
        onOpenChange={vi.fn()}
        variables={variables}
        isLoading={false}
        isSubmitting={false}
        onVariableChange={onVariableChange}
        onRun={vi.fn()}
      />
    );

    fireEvent.change(screen.getByDisplayValue("BASE_URL"), {
      target: { value: "API_URL" },
    });
    fireEvent.change(screen.getByDisplayValue("abc123"), {
      target: { value: "updated" },
    });

    expect(onVariableChange).toHaveBeenNthCalledWith(1, "1", "key", "API_URL");
    expect(onVariableChange).toHaveBeenNthCalledWith(2, "2", "value", "updated");
  });

  it("calls onRun when run button is clicked", () => {
    const onRun = vi.fn();
    render(
      <RunWithOverridesDialog
        open
        onOpenChange={vi.fn()}
        variables={variables}
        isLoading={false}
        isSubmitting={false}
        onVariableChange={vi.fn()}
        onRun={onRun}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Run" }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange(false) when cancel is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <RunWithOverridesDialog
        open
        onOpenChange={onOpenChange}
        variables={variables}
        isLoading={false}
        isSubmitting={false}
        onVariableChange={vi.fn()}
        onRun={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
