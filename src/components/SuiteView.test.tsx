import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SuiteView } from "@/components/SuiteView";

const navigateMock = vi.fn();

const {
  fetchSuitesFullMock,
  fetchEnvironmentsMock,
  fetchEnvironmentDetailMock,
} = vi.hoisted(() => ({
  fetchSuitesFullMock: vi.fn(),
  fetchEnvironmentsMock: vi.fn(),
  fetchEnvironmentDetailMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    token: "token-123",
    currentUser: { default_account_id: "account-1" },
  }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ResizablePanel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ResizableHandle: () => null,
}));

vi.mock("@/components/TestCaseList", () => ({
  TestCaseList: () => <div>test-cases</div>,
}));

vi.mock("@/components/SuiteCanvas", () => ({
  SuiteCanvas: ({
    onRunWithOverrides,
  }: {
    onRunWithOverrides: () => void;
  }) => (
    <button type="button" onClick={onRunWithOverrides}>
      trigger-run-with-overrides
    </button>
  ),
}));

vi.mock("@/components/AddAssertionDialog", () => ({
  AddAssertionDialog: () => null,
}));

vi.mock("@/components/AddTestStepDialog", () => ({
  AddTestStepDialog: () => null,
}));

vi.mock("@/components/CreateTestCaseDialog", () => ({
  CreateTestCaseDialog: () => null,
}));

vi.mock("@/components/RunWithOverridesDialog", () => ({
  RunWithOverridesDialog: ({
    open,
    variables,
    onRun,
  }: {
    open: boolean;
    variables: Array<{ key: string; value: string }>;
    onRun: () => void;
  }) =>
    open ? (
      <div>
        <pre data-testid="override-variables">{JSON.stringify(variables)}</pre>
        <button type="button" onClick={onRun}>
          dialog-run
        </button>
      </div>
    ) : null,
}));

vi.mock("@/lib/api/suites", () => ({
  createAssertion: vi.fn(),
  createTestCase: vi.fn(),
  createTestStep: vi.fn(),
  deleteAssertion: vi.fn(),
  deleteTestStep: vi.fn(),
  fetchLatestStepResult: vi.fn(),
  fetchSuitesFull: fetchSuitesFullMock,
  fetchSuites: vi.fn(),
  fetchEnvironments: fetchEnvironmentsMock,
  fetchEnvironmentDetail: fetchEnvironmentDetailMock,
  getAssertion: vi.fn(),
  updateAssertion: vi.fn(),
  reorderTestSteps: vi.fn(),
}));

describe("SuiteView run with overrides flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    fetchSuitesFullMock.mockResolvedValue({
      id: "c83f224b-b8d3-4fb1-b787-d4be08ec62fb",
      account_id: "account-1",
      name: "Regression Suite",
      description: null,
      tags: [],
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      test_cases: [],
    });
  });

  it("loads selected environment detail and navigates with BASE_URL + variables", async () => {
    fetchEnvironmentsMock
      .mockResolvedValueOnce([{ id: "env-1", name: "QA" }])
      .mockResolvedValueOnce([{ id: "env-1", name: "QA" }]);
    fetchEnvironmentDetailMock.mockResolvedValue({
      id: "env-1",
      name: "QA",
      base_url: "https://api.example.com",
      variables: [{ id: "v1", key: "TOKEN", value: "abc123" }],
    });

    render(<SuiteView suiteId="c83f224b-b8d3-4fb1-b787-d4be08ec62fb" />);

    await waitFor(() => {
      expect(fetchSuitesFullMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "trigger-run-with-overrides" }));

    await waitFor(() => {
      expect(fetchEnvironmentsMock).toHaveBeenCalledTimes(2);
      expect(fetchEnvironmentDetailMock).toHaveBeenCalledWith("env-1", "token-123");
    });

    expect(screen.getByTestId("override-variables")).toHaveTextContent("BASE_URL");
    expect(screen.getByTestId("override-variables")).toHaveTextContent("TOKEN");

    fireEvent.click(screen.getByRole("button", { name: "dialog-run" }));

    expect(navigateMock).toHaveBeenCalledWith(
      "/suites/c83f224b-b8d3-4fb1-b787-d4be08ec62fb/runs/live/canvas?autorun=true&environmentId=env-1",
      {
        state: {
          variables: {
            BASE_URL: "https://api.example.com",
            TOKEN: "abc123",
          },
        },
      }
    );
  });

  it("falls back to first fresh environment when selected environment is no longer present", async () => {
    fetchEnvironmentsMock
      .mockResolvedValueOnce([{ id: "env-old", name: "Old Env" }])
      .mockResolvedValueOnce([{ id: "env-new", name: "New Env" }]);
    fetchEnvironmentDetailMock.mockResolvedValue({
      id: "env-new",
      name: "New Env",
      base_url: "https://new.example.com",
      variables: [],
    });

    render(<SuiteView suiteId="c83f224b-b8d3-4fb1-b787-d4be08ec62fb" />);

    await waitFor(() => {
      expect(fetchSuitesFullMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "trigger-run-with-overrides" }));

    await waitFor(() => {
      expect(fetchEnvironmentDetailMock).toHaveBeenCalledWith("env-new", "token-123");
    });

    fireEvent.click(screen.getByRole("button", { name: "dialog-run" }));

    expect(navigateMock).toHaveBeenCalledWith(
      "/suites/c83f224b-b8d3-4fb1-b787-d4be08ec62fb/runs/live/canvas?autorun=true&environmentId=env-new",
      expect.objectContaining({
        state: expect.objectContaining({
          variables: expect.objectContaining({
            BASE_URL: "https://new.example.com",
          }),
        }),
      })
    );
  });
});
