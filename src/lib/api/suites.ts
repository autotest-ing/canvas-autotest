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
  assertion_type: string;
  extractor?: Record<string, unknown> | null;
  operator: string;
  expected?: unknown;
  severity: string;
  is_enabled: boolean;
  sort_order: number;
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
