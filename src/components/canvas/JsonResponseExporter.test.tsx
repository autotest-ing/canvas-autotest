import { fireEvent, render, screen } from "@testing-library/react";
import { useContext, useState, createContext, cloneElement, isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { JsonResponseExporter } from "@/components/canvas/JsonResponseExporter";

const DropdownMenuContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({
    children,
    open,
    onOpenChange,
  }: {
    children: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = typeof open === "boolean";
    const currentOpen = isControlled ? open : internalOpen;
    const setOpen = (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };

    return (
      <DropdownMenuContext.Provider value={{ open: currentOpen, setOpen }}>
        {children}
      </DropdownMenuContext.Provider>
    );
  },
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => {
    const ctx = useContext(DropdownMenuContext);
    if (!ctx || !isValidElement(children)) {
      return <>{children}</>;
    }
    return cloneElement(children, {
      onClick: (event: unknown) => {
        const originalOnClick = (children.props as { onClick?: (event: unknown) => void }).onClick;
        originalOnClick?.(event);
        ctx.setOpen(!ctx.open);
      },
      "aria-expanded": ctx.open,
      "aria-haspopup": "menu",
    });
  },
  DropdownMenuContent: ({ children }: { children: ReactNode }) => {
    const ctx = useContext(DropdownMenuContext);
    if (!ctx?.open) {
      return null;
    }
    return <div role="menu">{children}</div>;
  },
  DropdownMenuItem: ({
    children,
    disabled,
    className,
  }: {
    children: ReactNode;
    disabled?: boolean;
    className?: string;
  }) => (
    <button type="button" role="menuitem" disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    token: "jwt-token",
    currentUser: { default_account_id: "account-1" },
  }),
}));

describe("JsonResponseExporter", () => {
  const openVarDropdown = () => {
    const trigger = screen.getByTitle("Add variable");
    fireEvent.click(trigger);
  };

  it("shows existing exports in dropdown for displayExisting mode", async () => {
    render(
      <JsonResponseExporter
        body={{ token: "abc" }}
        testStepId="step-1"
        mode="displayExisting"
        existingExports={[
          {
            id: "exp-z",
            test_step: { name: "Step Z" },
            key: "ZETA_KEY",
            extractor: { type: "jsonpath", path: "$.zeta" },
            is_secret: false,
          },
          {
            id: "exp-a",
            test_step: { name: "Step A" },
            key: "ALPHA_KEY",
            extractor: { type: "jsonpath", path: "$.alpha" },
            is_secret: false,
          },
        ]}
      />
    );

    openVarDropdown();

    expect(await screen.findByText("ALPHA_KEY")).toBeInTheDocument();
    expect(screen.getByText("Step A")).toBeInTheDocument();
    expect(screen.getByText("$.alpha")).toBeInTheDocument();
    expect(screen.getByText("ZETA_KEY")).toBeInTheDocument();
  });

  it("shows loading state in displayExisting mode dropdown", async () => {
    render(
      <JsonResponseExporter
        body={{ token: "abc" }}
        testStepId="step-1"
        mode="displayExisting"
        existingExportsLoading
      />
    );

    openVarDropdown();
    expect(await screen.findByText("Loading extracted variables...")).toBeInTheDocument();
  });

  it("shows error state in displayExisting mode dropdown", async () => {
    render(
      <JsonResponseExporter
        body={{ token: "abc" }}
        testStepId="step-1"
        mode="displayExisting"
        existingExportsError="failed"
      />
    );

    openVarDropdown();
    expect(await screen.findByText("Failed to load extracted variables")).toBeInTheDocument();
  });

  it("keeps create mode behavior and shows inline input on + var click", async () => {
    render(<JsonResponseExporter body={{ token: "abc" }} testStepId="step-1" />);

    fireEvent.click(screen.getByTitle("Add variable"));

    expect(await screen.findByDisplayValue("TOKEN")).toBeInTheDocument();
    expect(screen.queryByText("No extracted variables")).not.toBeInTheDocument();
  });
});
