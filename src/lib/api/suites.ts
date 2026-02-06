const BASE_API_URL = "https://internal-api.autotest.ing";
const WS_BASE_URL = "wss://internal-api.autotest.ing";

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export function getSuiteExecutionWsUrl(token: string): string {
  return `${WS_BASE_URL}/v1.0/executions/suite_ws?token=${encodeURIComponent(token)}`;
}

// ============== Types matching backend TestSuiteFullResponse ==============

export type AssertionNested = {
  id: string;
  test_step_id: string;
  name: string;
  assertion_type: AssertionType;
  extractor?: Record<string, unknown> | null;
  operator: string;
  expected?: unknown;
  expected_template?: string | null;
  severity: string;
  is_enabled: boolean;
  sort_order: number;
};

export type AssertionType =
  | "status_code"
  | "header"
  | "jsonpath"
  | "body_contains"
  | "body_equals"
  | "response_time"
  | "schema"
  | "custom";

export type CreateAssertionPayload = {
  test_step_id: string;
  name: string;
  assertion_type: AssertionType;
  operator: string;
  extractor?: Record<string, unknown> | null;
  expected?: unknown;
  expected_template?: string | null;
  severity: string;
  is_enabled: boolean;
  sort_order: number;
};

export type CreateAssertionResponse = AssertionNested & {
  expected_template?: string | null;
  created_at?: string;
};

export type TestStepNested = {
  id: string;
  test_case_id: string;
  name: string;
  step_type: string;
  request_id?: string | null;
  collection_id?: string | null;
  sort_order: number;
  config: Record<string, unknown>;
  assertions: AssertionNested[];
};

export type TestCaseNested = {
  id: string;
  suite_id: string;
  name: string;
  description?: string | null;
  tags: string[];
  is_enabled: boolean;
  sort_order: number;
  steps: TestStepNested[];
};

export type TestSuiteFullResponse = {
  id: string;
  account_id: string;
  name: string;
  description?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  test_cases: TestCaseNested[];
};

export type TestSuiteListItem = {
  id: string;
  account_id: string;
  name: string;
  description?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

// ============== Environment types ==============

export type Environment = {
  id: string;
  name: string;
};

// ============== API functions ==============

export async function fetchEnvironments(accountId: string, token: string): Promise<Environment[]> {
  const response = await fetch(`${BASE_API_URL}/v1.0/environments?account_id=${accountId}`, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to load environments");
  }

  const data = (await response.json()) as { items?: Environment[] };
  return data.items ?? [];
}

export async function fetchSuitesFull(suiteId: string, token: string): Promise<TestSuiteFullResponse> {
  const response = await fetch(`${BASE_API_URL}/v1.0/test-suites/${suiteId}/full`, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to load test suite");
  }

  return (await response.json()) as TestSuiteFullResponse;
}

export async function fetchSuites(accountId: string, token: string): Promise<TestSuiteListItem[]> {
  const response = await fetch(`${BASE_API_URL}/v1.0/test-suites?account_id=${accountId}`, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to load test suites");
  }

  const data = (await response.json()) as { items?: TestSuiteListItem[] };
  return data.items ?? [];
}

export async function executeSuite(
  suiteId: string,
  token: string,
  environmentId?: string,
  variables?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await fetch(`${BASE_API_URL}/v1.0/executions/suite`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      suite_id: suiteId,
      environment_id: environmentId ?? null,
      variables: variables ?? {},
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to execute test suite");
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function createAssertion(
  payload: CreateAssertionPayload,
  token: string
): Promise<CreateAssertionResponse> {
  const response = await fetch(`${BASE_API_URL}/v1.0/assertions`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status !== 201 && !response.ok) {
    let message = "Failed to create assertion";
    try {
      const data = (await response.json()) as { message?: string; detail?: string };
      if (typeof data?.message === "string" && data.message.trim()) {
        message = `${message}: ${data.message}`;
      } else if (typeof data?.detail === "string" && data.detail.trim()) {
        message = `${message}: ${data.detail}`;
      }
    } catch {
      // keep default error
    }
    throw new Error(message);
  }

  return (await response.json()) as CreateAssertionResponse;
}
