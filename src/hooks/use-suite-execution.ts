import { useCallback, useEffect, useRef, useState } from "react";
import { getSuiteExecutionWsUrl } from "@/lib/api/suites";
import type { RunTestCase, RunTestStep } from "@/components/RunTestCaseList";

// ============== WebSocket Event Types ==============

interface SuiteStartedEvent {
  event: "suite_started";
  run_id: string;
  suite_id: string;
  suite_name: string;
  total_cases: number;
  timestamp: string;
}

interface CaseStartedEvent {
  event: "case_started";
  case_id: string;
  case_result_id: string;
  case_name: string;
  total_steps: number;
  timestamp: string;
}

interface StepStartedEvent {
  event: "step_started";
  step_id: string;
  step_result_id: string;
  step_name: string;
  case_id: string;
  method: string | null;
  endpoint: string | null;
  timestamp: string;
}

interface StepCompletedEvent {
  event: "step_completed";
  step_id: string;
  step_result_id: string;
  step_name: string;
  case_id: string;
  status: "success" | "failed";
  method: string | null;
  endpoint: string | null;
  assertion_results: Array<{
    status: string;
    message: string;
    actual?: unknown;
    expected?: unknown;
  }>;
  passed_assertions: number;
  failed_assertions: number;
  total_assertions: number;
  response: { status_code: number; duration_ms: number } | null;
  error: string | null;
  timestamp: string;
}

interface CaseCompletedEvent {
  event: "case_completed";
  case_id: string;
  case_result_id: string;
  status: "success" | "failed";
  passed_steps: number;
  failed_steps: number;
  total_steps: number;
  passed_assertions: number;
  failed_assertions: number;
  total_assertions: number;
  timestamp: string;
}

interface SuiteCompletedEvent {
  event: "suite_completed";
  run_id: string;
  suite_id: string;
  status: "success" | "failed";
  summary: Record<string, number>;
  timestamp: string;
}

interface ErrorEvent {
  event: "error";
  message: string;
  timestamp?: string;
}

type WsEvent =
  | SuiteStartedEvent
  | CaseStartedEvent
  | StepStartedEvent
  | StepCompletedEvent
  | CaseCompletedEvent
  | SuiteCompletedEvent
  | ErrorEvent;

// ============== Hook State ==============

export interface SuiteExecutionState {
  testCases: RunTestCase[];
  suiteName: string;
  suiteStatus: "pass" | "fail" | "pending" | "running" | "mixed";
  runId: string | null;
  isRunning: boolean;
  isConnected: boolean;
  error: string | null;
}

interface UseSuiteExecutionOptions {
  token: string | null;
  suiteId: string | undefined;
  environmentId?: string;
  variables?: Record<string, unknown>;
}

export function useSuiteExecution({
  token,
  suiteId,
  environmentId,
  variables,
}: UseSuiteExecutionOptions) {
  const [state, setState] = useState<SuiteExecutionState>({
    testCases: [],
    suiteName: "",
    suiteStatus: "pending",
    runId: null,
    isRunning: false,
    isConnected: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const testCasesRef = useRef<RunTestCase[]>([]);

  // Keep ref in sync for use inside WS callbacks
  const updateTestCases = useCallback((updater: (prev: RunTestCase[]) => RunTestCase[]) => {
    testCasesRef.current = updater(testCasesRef.current);
    setState((prev) => ({ ...prev, testCases: [...testCasesRef.current] }));
  }, []);

  const handleEvent = useCallback(
    (event: WsEvent) => {
      switch (event.event) {
        case "suite_started": {
          testCasesRef.current = [];
          setState((prev) => ({
            ...prev,
            suiteName: event.suite_name,
            suiteStatus: "running",
            runId: event.run_id,
            isRunning: true,
            testCases: [],
            error: null,
          }));
          break;
        }

        case "case_started": {
          const newCase: RunTestCase = {
            id: event.case_id,
            name: event.case_name,
            status: "running",
            steps: [],
            duration: undefined,
          };
          updateTestCases((prev) => [...prev, newCase]);
          break;
        }

        case "step_started": {
          const newStep: RunTestStep = {
            id: event.step_id,
            name: event.step_name,
            method: (event.method as RunTestStep["method"]) || "GET",
            endpoint: event.endpoint || "",
            status: "running",
            duration: undefined,
            assertionsPassed: 0,
            assertionsTotal: 0,
            stepResultId: event.step_result_id,
          };
          updateTestCases((prev) =>
            prev.map((tc) =>
              tc.id === event.case_id
                ? { ...tc, steps: [...tc.steps, newStep] }
                : tc
            )
          );
          break;
        }

        case "step_completed": {
          const stepStatus: RunTestStep["status"] = event.status === "success" ? "pass" : "fail";
          const durationMs = event.response?.duration_ms;
          const durationStr = durationMs != null ? `${(durationMs / 1000).toFixed(1)}s` : undefined;

          updateTestCases((prev) =>
            prev.map((tc) =>
              tc.id === event.case_id
                ? {
                    ...tc,
                    steps: tc.steps.map((step) =>
                      step.id === event.step_id
                        ? {
                            ...step,
                            status: stepStatus,
                            duration: durationStr,
                            method: (event.method as RunTestStep["method"]) || step.method,
                            endpoint: event.endpoint || step.endpoint,
                            assertionsPassed: event.passed_assertions,
                            assertionsTotal: event.total_assertions,
                            stepResultId: event.step_result_id,
                            assertionResults: event.assertion_results,
                          }
                        : step
                    ),
                  }
                : tc
            )
          );
          break;
        }

        case "case_completed": {
          const caseStatus: RunTestCase["status"] =
            event.status === "success" ? "pass" : "fail";

          updateTestCases((prev) =>
            prev.map((tc) =>
              tc.id === event.case_id
                ? { ...tc, status: caseStatus }
                : tc
            )
          );
          break;
        }

        case "suite_completed": {
          const suiteStatus = event.status === "success" ? "pass" : "fail";
          setState((prev) => ({
            ...prev,
            suiteStatus: suiteStatus as SuiteExecutionState["suiteStatus"],
            isRunning: false,
            runId: event.run_id,
          }));
          break;
        }

        case "error": {
          setState((prev) => ({
            ...prev,
            error: event.message,
            isRunning: false,
            suiteStatus: "fail",
          }));
          break;
        }
      }
    },
    [updateTestCases]
  );

  const startExecution = useCallback(() => {
    if (!token || !suiteId) return;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Reset state
    testCasesRef.current = [];
    setState({
      testCases: [],
      suiteName: "",
      suiteStatus: "pending",
      runId: null,
      isRunning: false,
      isConnected: false,
      error: null,
    });

    const ws = new WebSocket(getSuiteExecutionWsUrl(token));
    wsRef.current = ws;

    ws.onopen = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
      // Send the execution request
      ws.send(
        JSON.stringify({
          suite_id: suiteId,
          environment_id: environmentId ?? null,
          variables: variables ?? {},
        })
      );
    };

    ws.onmessage = (msgEvent) => {
      try {
        const data = JSON.parse(msgEvent.data as string) as WsEvent;
        handleEvent(data);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      setState((prev) => ({
        ...prev,
        error: "WebSocket connection error",
        isRunning: false,
        isConnected: false,
      }));
    };

    ws.onclose = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
      wsRef.current = null;
    };
  }, [token, suiteId, environmentId, variables, handleEvent]);

  const stopExecution = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState((prev) => ({ ...prev, isRunning: false, isConnected: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    startExecution,
    stopExecution,
  };
}
