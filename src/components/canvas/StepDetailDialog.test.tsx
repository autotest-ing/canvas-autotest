import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StepDetailDialog } from "@/components/canvas/StepDetailDialog";
import type { RunTestStep } from "@/components/RunTestCaseList";

const {
  fetchStepResultDetailsMock,
  fetchStepExportsByAccountMock,
  jsonResponseExporterMock,
} = vi.hoisted(() => ({
  fetchStepResultDetailsMock: vi.fn(),
  fetchStepExportsByAccountMock: vi.fn(),
  jsonResponseExporterMock: vi.fn(),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  TabsContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    token: "jwt-token",
    currentUser: { default_account_id: "account-1" },
  }),
}));

vi.mock("@/lib/api/suites", () => ({
  fetchStepResultDetails: fetchStepResultDetailsMock,
  fetchStepExportsByAccount: fetchStepExportsByAccountMock,
}));

vi.mock("@/components/canvas/JsonResponseExporter", () => ({
  JsonResponseExporter: (props: {
    mode?: "create" | "displayExisting";
    existingExports?: unknown[];
  }) => {
    jsonResponseExporterMock(props);
    const mode = props.mode ?? "create";
    const exportCount = Array.isArray(props.existingExports) ? props.existingExports.length : 0;
    return <div data-testid={`json-exporter-${mode}`}>{exportCount}</div>;
  },
}));

describe("StepDetailDialog", () => {
  const step: RunTestStep = {
    id: "step-1",
    name: "Login step",
    method: "POST",
    endpoint: "/v1.0/signin",
    status: "pass",
    assertionsPassed: 1,
    assertionsTotal: 1,
    stepResultId: "step-result-1",
    assertionResults: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    fetchStepResultDetailsMock.mockResolvedValue({
      id: "step-result-1",
      case_result_id: "case-result-1",
      test_step_id: "step-1",
      status: "pass",
      started_at: "2026-02-10T10:00:00.000Z",
      finished_at: "2026-02-10T10:00:01.000Z",
      error: null,
      request: {
        method: "POST",
        url: "/v1.0/signin",
        headers: null,
        body: { email: "user@example.com" },
      },
      response: {
        status_code: 200,
        headers: null,
        body: { response_token: "abc" },
        raw_body: null,
        duration_ms: 130,
      },
      assertion_results: [],
    });

    fetchStepExportsByAccountMock.mockResolvedValue([
      {
        id: "exp-1",
        test_step: { name: "Login step" },
        key: "ACCESS_TOKEN",
        extractor: { type: "jsonpath", path: "$.access_token" },
        is_secret: true,
      },
    ]);
  });

  it("wires suite-scoped exports to request mode while response stays in create mode", async () => {
    render(
      <StepDetailDialog
        step={step}
        suiteId="suite-1"
        open
        onOpenChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(fetchStepResultDetailsMock).toHaveBeenCalledWith(
        "step-result-1",
        "jwt-token"
      );
    });

    await waitFor(() => {
      expect(fetchStepExportsByAccountMock).toHaveBeenCalledWith(
        "account-1",
        "jwt-token",
        { testSuiteId: "suite-1" }
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("json-exporter-displayExisting")).toHaveTextContent("1");
      expect(screen.getByTestId("json-exporter-create")).toBeInTheDocument();
    });

    const exporterCalls = jsonResponseExporterMock.mock.calls.map(([props]) => props);
    expect(
      exporterCalls.some(
        (props) =>
          props.mode === "displayExisting" &&
          Array.isArray(props.existingExports) &&
          props.existingExports.some((exp: { key?: string }) => exp.key === "ACCESS_TOKEN")
      )
    ).toBe(true);
    expect(
      exporterCalls.some((props) => !("mode" in props))
    ).toBe(true);
  });
});
