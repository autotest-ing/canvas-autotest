import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { TestStepCard } from "@/components/TestStepCard";
import type { TestStep } from "@/components/TestCaseList";

const { toastInfo } = vi.hoisted(() => ({
  toastInfo: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    info: toastInfo,
  },
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div role="menu">{children}</div>,
  DropdownMenuItem: ({
    children,
    disabled,
    onClick,
    className,
  }: {
    children: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
  }) => (
    <button type="button" role="menuitem" disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

const baseStep: TestStep = {
  id: "step-1",
  name: "Get current user",
  method: "GET",
  endpoint: "/users/me",
  status: "pending",
  stepType: "request",
  requestId: "request-1",
  collectionId: null,
  sortOrder: 1,
  config: {},
  assertions: [
    {
      id: "assertion-1",
      description: "Status code is 200",
      type: "status",
      status: "pending",
      assertionType: "status_code",
      operator: "equals",
      extractor: null,
      expected: 200,
      expectedTemplate: null,
      severity: "error",
      isEnabled: true,
      sortOrder: 1,
    },
  ],
};

function openStepMenu() {
  const trigger = screen.getByRole("button", { name: "Step actions" });
  fireEvent.click(trigger);
}

describe("TestStepCard", () => {
  it("renders 3-dots trigger and removes inline Delete Step button", () => {
    render(
      <TestStepCard
        step={baseStep}
        stepNumber={1}
        isExpanded
        onDeleteStep={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByRole("button", { name: "Step actions" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Step" })).not.toBeInTheDocument();
  });

  it("shows Edit and Delete menu items", async () => {
    render(
      <TestStepCard
        step={baseStep}
        stepNumber={1}
        onDeleteStep={vi.fn().mockResolvedValue(undefined)}
      />
    );

    openStepMenu();

    expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
  });

  it("shows coming-soon toast on Edit and does not toggle collapse", async () => {
    render(
      <TestStepCard
        step={baseStep}
        stepNumber={1}
        isExpanded={false}
        onDeleteStep={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.queryByText(/^Assertions$/i)).not.toBeInTheDocument();

    openStepMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Edit" }));

    expect(toastInfo).toHaveBeenCalledWith("Edit step is not available yet");
    expect(screen.queryByText(/^Assertions$/i)).not.toBeInTheDocument();
  });

  it("opens delete confirmation and calls onDeleteStep on confirm", async () => {
    const onDeleteStep = vi.fn().mockResolvedValue(undefined);

    render(<TestStepCard step={baseStep} stepNumber={1} onDeleteStep={onDeleteStep} />);

    openStepMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(await screen.findByText("Delete test step?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete Step" }));

    await waitFor(() => {
      expect(onDeleteStep).toHaveBeenCalledWith("step-1");
    });
  });

  it("disables actions and shows deleting state when busy", async () => {
    const onDeleteStep = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <TestStepCard
        step={baseStep}
        stepNumber={1}
        onDeleteStep={onDeleteStep}
        isDeletingStep={false}
      />
    );

    openStepMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(await screen.findByText("Delete test step?")).toBeInTheDocument();

    rerender(
      <TestStepCard
        step={baseStep}
        stepNumber={1}
        onDeleteStep={onDeleteStep}
        isDeletingStep
      />
    );

    expect(screen.getByRole("button", { name: "Step actions", hidden: true })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
  });
});
