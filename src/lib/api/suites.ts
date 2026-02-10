const BASE_API_URL = "https://internal-api.autotest.ing";
const WS_BASE_URL = "wss://internal-api.autotest.ing";

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

// ============== Collections API ==============

export type CollectionSourceType = "Postman" | "OpenAPI" | "swagger";

export interface CollectionItem {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
  source_type: CollectionSourceType;
  requests_count: number;
}

export async function fetchCollections(
  accountId: string,
  token: string
): Promise<CollectionItem[]> {
  const res = await fetch(
    `${BASE_API_URL}/v1.0/collections?account_id=${encodeURIComponent(accountId)}`,
    { headers: getAuthHeaders(token) }
  );
  if (!res.ok) throw new Error(`Failed to fetch collections: ${res.status}`);
  return res.json();
}

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

export type AssertionDetailResponse = AssertionNested & {
  created_at: string;
  updated_at: string;
};

export type UpdateAssertionPayload = Partial<
  Pick<CreateAssertionPayload, "name" | "assertion_type" | "operator" | "extractor" | "expected" | "expected_template" | "is_enabled">
>;

export type RequestPayload = {
  method?: string | null;
  url?: string | null;
  full_url?: string | null;
  headers?: Record<string, unknown> | null;
  path_params?: Record<string, unknown> | null;
  payload?: unknown;
};

export type RequestListItem = {
  id: string;
  request?: RequestPayload | null;
  method?: string | null;
  url?: string | null;
  full_url?: string | null;
  created_at: string;
  updated_at: string;
  is_assigned_to_test_step: boolean;
};

export type RequestListResponse = {
  items: RequestListItem[];
  next_cursor: string | null;
  total: number;
};

export type FetchRequestsParams = {
  search?: string;
  limit?: number;
  cursor?: string;
};

export type TestCaseTableStatus = "passed" | "failed" | "running" | "pending";

export type TestCaseTableItem = {
  id: string;
  suite_id: string;
  suite_name: string;
  name: string;
  step_count: number;
  status: TestCaseTableStatus;
  last_run: string | null;
};

export type TestCaseTableResponse = {
  items: TestCaseTableItem[];
  next_cursor: string | null;
  total: number;
};

export type FetchTestCasesTableParams = {
  search?: string;
  status?: TestCaseTableStatus;
  limit?: number;
  cursor?: string;
};

export type TestStepNested = {
  id: string;
  test_case_id: string;
  name: string;
  step_type: string;
  method?: string | null;
  url?: string | null;
  endpoint?: string | null;
  full_url?: string | null;
  request?: RequestPayload | null;
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

export type EnvironmentDetailVariable = {
  id?: string | number;
  key: string;
  value: string;
  is_overridable?: boolean;
  isOverridable?: boolean;
};

export type EnvironmentDetailResponse = {
  id: string;
  name: string;
  base_url?: string;
  baseUrl?: string;
  variables?: EnvironmentDetailVariable[];
};

export type CreateTestStepPayload = {
  test_case_id: string;
  name: string;
  step_type: "request";
  request_id: string;
  sort_order: number;
  config: {
    timeout: number;
    retries: number;
  };
};

export type CreateTestStepResponse = {
  id: string;
  test_case_id: string;
  name: string;
  step_type: string;
  request_id: string | null;
  collection_id: string | null;
  sort_order: number;
  config: Record<string, unknown>;
  created_at: string;
};

export type CreateTestCasePayload = {
  suite_id: string;
  name: string;
  description?: string;
  tags: string[];
  is_enabled: boolean;
  sort_order: number;
};

export type CreateTestCaseResponse = {
  id: string;
  suite_id: string;
  name: string;
  description?: string | null;
  tags: string[];
  is_enabled: boolean;
  sort_order: number;
  steps?: TestStepNested[];
  created_at?: string;
  updated_at?: string;
};

// ============== All Runs Types ==============

export type RunStatus = "running" | "success" | "failed" | "canceled";

export type AllRunsItem = {
  id: string;
  suite_id: string;
  suite_name: string;
  environment_id: string | null;
  status: RunStatus;
  started_at: string;
  finished_at: string | null;
  summary: {
    total_cases?: number;
    passed_cases?: number;
    failed_cases?: number;
    skipped_cases?: number;
    total_steps?: number;
    passed_steps?: number;
    failed_steps?: number;
    total_assertions?: number;
    passed_assertions?: number;
    failed_assertions?: number;
  };
  created_at: string;
  created_by: string | null;
};

export type AllRunsListResponse = {
  items: AllRunsItem[];
  total: number;
  next_cursor: string | null;
};

export type FetchAllRunsParams = {
  search?: string;
  status?: RunStatus;
  sort_by?: "started_at" | "finished_at" | "status" | "created_at";
  sort_desc?: boolean;
  limit?: number;
  cursor?: string;
};

// ============== Step Result Detail Types ==============

export type StepResultHttpRequest = {
  method: string | null;
  url: string | null;
  headers: Record<string, unknown> | null;
  body: unknown;
};

export type StepResultHttpResponse = {
  status_code: number | null;
  headers: Record<string, unknown> | null;
  body: unknown;
  raw_body: string | null;
  duration_ms: number | null;
};

export type StepResultAssertionResult = {
  id: string;
  step_result_id: string;
  assertion_id: string;
  status: string;
  actual: unknown;
  expected: unknown;
  message: string | null;
  created_at: string;
};

export type StepResultFullDetail = {
  id: string;
  case_result_id: string;
  test_step_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  error: string | null;
  request: StepResultHttpRequest | null;
  response: StepResultHttpResponse | null;
  assertion_results: StepResultAssertionResult[];
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

export async function fetchEnvironmentDetail(
  envId: string,
  token: string
): Promise<EnvironmentDetailResponse> {
  const response = await fetch(`${BASE_API_URL}/v1.0/environments/${envId}`, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to load environment details");
  }

  return (await response.json()) as EnvironmentDetailResponse;
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

export async function fetchRequests(
  accountId: string,
  token: string,
  params?: FetchRequestsParams
): Promise<RequestListResponse> {
  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  const url = new URL(`${BASE_API_URL}/v1.0/requests`);
  url.searchParams.set("account_id", accountId);
  url.searchParams.set("limit", String(limit));

  if (params?.search?.trim()) {
    url.searchParams.set("search", params.search.trim());
  }

  if (params?.cursor?.trim()) {
    url.searchParams.set("cursor", params.cursor.trim());
  }

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to load requests");
  }

  const data = (await response.json()) as Partial<RequestListResponse>;
  const rawItems = Array.isArray(data.items) ? data.items : [];

  return {
    items: rawItems
      .map((item) => normalizeRequestListItem(item))
      .filter((item): item is RequestListItem => item !== null),
    next_cursor: typeof data.next_cursor === "string" ? data.next_cursor : null,
    total: typeof data.total === "number" ? data.total : 0,
  };
}

export async function fetchTestCasesTable(
  accountId: string,
  token: string,
  params?: FetchTestCasesTableParams
): Promise<TestCaseTableResponse> {
  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  const url = new URL(`${BASE_API_URL}/v1.0/test-cases/table`);
  url.searchParams.set("account_id", accountId);
  url.searchParams.set("limit", String(limit));

  if (params?.search?.trim()) {
    url.searchParams.set("search", params.search.trim());
  }

  if (params?.cursor?.trim()) {
    url.searchParams.set("cursor", params.cursor.trim());
  }

  if (params?.status) {
    url.searchParams.set("status", params.status);
  }

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to load test cases");
  }

  const data = (await response.json()) as Partial<TestCaseTableResponse>;
  const rawItems = Array.isArray(data.items) ? data.items : [];

  return {
    items: rawItems
      .map((item) => normalizeTestCaseTableItem(item))
      .filter((item): item is TestCaseTableItem => item !== null),
    next_cursor: typeof data.next_cursor === "string" ? data.next_cursor : null,
    total: typeof data.total === "number" ? data.total : 0,
  };
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

export async function createTestStep(
  payload: CreateTestStepPayload,
  token: string
): Promise<CreateTestStepResponse> {
  const response = await fetch(`${BASE_API_URL}/v1.0/test-steps`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status !== 201 && !response.ok) {
    throw await buildApiError(response, "Failed to create test step");
  }

  return (await response.json()) as CreateTestStepResponse;
}

export async function createTestCase(
  payload: CreateTestCasePayload,
  token: string
): Promise<CreateTestCaseResponse> {
  const response = await fetch(`${BASE_API_URL}/v1.0/test-cases`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status !== 201 && !response.ok) {
    throw await buildApiError(response, "Failed to create test case");
  }

  return (await response.json()) as CreateTestCaseResponse;
}

export async function updateTestStep(
  stepId: string,
  payload: { sort_order?: number },
  token: string
): Promise<void> {
  const response = await fetch(`${BASE_API_URL}/v1.0/test-steps/${stepId}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to update test step");
  }
}

export async function reorderTestSteps(
  testCaseId: string,
  stepIds: string[],
  token: string
): Promise<void> {
  const response = await fetch(`${BASE_API_URL}/v1.0/test-steps/reorder`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ test_case_id: testCaseId, step_ids: stepIds }),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to reorder test steps");
  }
}

export async function deleteTestStep(stepId: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_API_URL}/v1.0/test-steps/${stepId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to delete test step");
  }
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
    throw await buildApiError(response, "Failed to create assertion");
  }

  return (await response.json()) as CreateAssertionResponse;
}

export async function getAssertion(assertionId: string, token: string): Promise<AssertionDetailResponse> {
  const response = await fetch(`${BASE_API_URL}/v1.0/assertions/${assertionId}`, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to load assertion");
  }

  return (await response.json()) as AssertionDetailResponse;
}

export async function updateAssertion(
  assertionId: string,
  payload: UpdateAssertionPayload,
  token: string
): Promise<AssertionDetailResponse> {
  const response = await fetch(`${BASE_API_URL}/v1.0/assertions/${assertionId}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to update assertion");
  }

  return (await response.json()) as AssertionDetailResponse;
}

export async function deleteAssertion(assertionId: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_API_URL}/v1.0/assertions/${assertionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to delete assertion");
  }
}

export async function applyAssertionActualValue(
  assertionId: string,
  actualValue: unknown,
  token: string
): Promise<AssertionDetailResponse> {
  const response = await fetch(`${BASE_API_URL}/v1.0/assertions/${assertionId}/apply-actual`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ actual_value: actualValue }),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to apply actual value to assertion");
  }

  return (await response.json()) as AssertionDetailResponse;
}

// ============== Step Exports (Variable Extraction) ==============

export type StepExportPayload = {
  test_step_id: string;
  var_key: string;
  extractor: { type: string; path?: string; source?: string };
  is_secret?: boolean;
};

export type StepExportResponse = {
  id: string;
  test_step_id: string;
  var_key: string;
  extractor: Record<string, unknown>;
  is_secret: boolean;
};

export type TestStepExportCompactResponse = {
  id: string;
  test_step: { name: string };
  key: string;
  extractor: Record<string, unknown>;
  is_secret: boolean;
};

export type ApplyStepExportResponse = {
  ok: boolean;
  request_id: string;
  path?: string;
  var_key: string;
  new_payload?: unknown;
  new_url?: string;
  new_full_url?: string;
};

export type FetchStepExportsByAccountParams = Record<string, never>;

export async function createStepExport(
  stepId: string,
  payload: StepExportPayload,
  token: string
): Promise<StepExportResponse> {
  const response = await fetch(`${BASE_API_URL}/v1.0/test-steps/${stepId}/exports`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to create step export");
  }

  return (await response.json()) as StepExportResponse;
}

export async function applyStepExport(
  stepId: string,
  exportId: string,
  token: string,
  path?: string
): Promise<ApplyStepExportResponse> {
  const response = await fetch(
    `${BASE_API_URL}/v1.0/test-steps/${stepId}/exports/${exportId}/apply`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    }
  );

  if (!response.ok) {
    throw await buildApiError(response, "Failed to apply step export");
  }

  return (await response.json()) as ApplyStepExportResponse;
}

export async function applyStepExportToUrl(
  stepId: string,
  exportId: string,
  token: string,
  currentValue: string
): Promise<ApplyStepExportResponse> {
  const response = await fetch(
    `${BASE_API_URL}/v1.0/test-steps/${stepId}/exports/${exportId}/apply-url`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ current_value: currentValue }),
    }
  );

  if (!response.ok) {
    throw await buildApiError(response, "Failed to apply step export to URL");
  }

  return (await response.json()) as ApplyStepExportResponse;
}

export type ApplyEnvironmentVariableResponse = {
  ok: boolean;
  request_id: string;
  path?: string;
  var_key: string;
  new_payload?: unknown;
  new_url?: string;
  new_full_url?: string;
};

export async function applyEnvironmentVariable(
  stepId: string,
  envVarId: string | number,
  token: string,
  path: string
): Promise<ApplyEnvironmentVariableResponse> {
  const response = await fetch(
    `${BASE_API_URL}/v1.0/test-steps/${stepId}/variables/${envVarId}/apply`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    }
  );

  if (!response.ok) {
    throw await buildApiError(response, "Failed to apply environment variable");
  }

  return (await response.json()) as ApplyEnvironmentVariableResponse;
}

export async function applyEnvironmentVariableToUrl(
  stepId: string,
  envVarId: string | number,
  token: string,
  currentValue: string
): Promise<ApplyEnvironmentVariableResponse> {
  const response = await fetch(
    `${BASE_API_URL}/v1.0/test-steps/${stepId}/variables/${envVarId}/apply-url`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ current_value: currentValue }),
    }
  );

  if (!response.ok) {
    throw await buildApiError(response, "Failed to apply environment variable to URL");
  }

  return (await response.json()) as ApplyEnvironmentVariableResponse;
}

export async function fetchStepExportsByAccount(
  accountId: string,
  token: string,
  params?: FetchStepExportsByAccountParams
): Promise<TestStepExportCompactResponse[]> {
  const url = new URL(`${BASE_API_URL}/v1.0/test-steps/exports`);
  url.searchParams.set("account_id", accountId);

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to load step exports");
  }

  const data = (await response.json()) as unknown;
  const rawItems = Array.isArray(data) ? data : [];

  return rawItems
    .map((item) => normalizeStepExportCompactResponse(item))
    .filter((item): item is TestStepExportCompactResponse => item !== null);
}

export async function fetchStepResultDetails(
  stepResultId: string,
  token: string
): Promise<StepResultFullDetail> {
  const response = await fetch(
    `${BASE_API_URL}/v1.0/executions/step-results/${stepResultId}/details`,
    { headers: getAuthHeaders(token) }
  );

  if (!response.ok) {
    throw await buildApiError(response, "Failed to load step result details");
  }

  return (await response.json()) as StepResultFullDetail;
}

export async function fetchLatestStepResult(
  testStepId: string,
  token: string
): Promise<StepResultFullDetail | null> {
  const response = await fetch(
    `${BASE_API_URL}/v1.0/executions/steps/${testStepId}/latest-result`,
    { headers: getAuthHeaders(token) }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw await buildApiError(response, "Failed to load latest step result");
  }

  return (await response.json()) as StepResultFullDetail;
}

export async function fetchAllRuns(
  accountId: string,
  token: string,
  params?: FetchAllRunsParams
): Promise<AllRunsListResponse> {
  const url = new URL(`${BASE_API_URL}/v1.0/executions/runs/all`);
  url.searchParams.set("account_id", accountId);

  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  url.searchParams.set("limit", String(limit));

  if (params?.search?.trim()) {
    url.searchParams.set("search", params.search.trim());
  }
  if (params?.status) {
    url.searchParams.set("status", params.status);
  }
  if (params?.sort_by) {
    url.searchParams.set("sort_by", params.sort_by);
  }
  if (params?.sort_desc !== undefined) {
    url.searchParams.set("sort_desc", String(params.sort_desc));
  }
  if (params?.cursor?.trim()) {
    url.searchParams.set("cursor", params.cursor.trim());
  }

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw await buildApiError(response, "Failed to load runs");
  }

  return (await response.json()) as AllRunsListResponse;
}

async function buildApiError(response: Response, prefix: string): Promise<Error> {
  let message = prefix;
  try {
    const data = (await response.json()) as { message?: string; detail?: string };
    if (typeof data?.message === "string" && data.message.trim()) {
      message = `${prefix}: ${data.message}`;
    } else if (typeof data?.detail === "string" && data.detail.trim()) {
      message = `${prefix}: ${data.detail}`;
    }
  } catch {
    // Keep default fallback error message.
  }

  return new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function pickNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isTestCaseTableStatus(value: unknown): value is TestCaseTableStatus {
  return value === "passed" || value === "failed" || value === "running" || value === "pending";
}

function normalizeRequestPayload(item: Record<string, unknown>): RequestPayload {
  const nestedRequest = isRecord(item.request) ? item.request : {};
  const nestedHeaders = nestedRequest.headers;
  const nestedPathParams = nestedRequest.path_params;

  return {
    method: pickString(nestedRequest.method) ?? pickString(item.method),
    url: pickString(nestedRequest.url) ?? pickString(item.url),
    full_url: pickString(nestedRequest.full_url) ?? pickString(item.full_url),
    headers: isRecord(nestedHeaders) ? nestedHeaders : null,
    path_params: isRecord(nestedPathParams) ? nestedPathParams : null,
    payload: nestedRequest.payload ?? null,
  };
}

function normalizeRequestListItem(rawItem: unknown): RequestListItem | null {
  if (!isRecord(rawItem)) {
    return null;
  }

  const id = pickString(rawItem.id);
  if (!id) {
    return null;
  }

  const method = pickString(rawItem.method);
  const url = pickString(rawItem.url);
  const fullUrl = pickString(rawItem.full_url);

  return {
    id,
    request: normalizeRequestPayload(rawItem),
    ...(method ? { method } : {}),
    ...(url ? { url } : {}),
    ...(fullUrl ? { full_url: fullUrl } : {}),
    created_at: pickString(rawItem.created_at) ?? "",
    updated_at: pickString(rawItem.updated_at) ?? "",
    is_assigned_to_test_step: Boolean(rawItem.is_assigned_to_test_step),
  };
}

function normalizeTestCaseTableItem(rawItem: unknown): TestCaseTableItem | null {
  if (!isRecord(rawItem)) {
    return null;
  }

  const suiteRecord = isRecord(rawItem.suite) ? rawItem.suite : null;

  const id = pickString(rawItem.id) ?? pickString(rawItem.test_case_id);
  if (!id) {
    return null;
  }

  const suiteId =
    pickString(rawItem.suite_id) ?? pickString(rawItem.test_suite_id) ?? pickString(suiteRecord?.id) ?? "";
  const suiteName =
    pickString(rawItem.suite_name) ??
    pickString(rawItem.test_suite_name) ??
    pickString(suiteRecord?.name) ??
    "Unknown suite";

  const statusValue = pickString(rawItem.status);
  const stepCount =
    pickNumber(rawItem.step_count) ??
    pickNumber(rawItem.steps_count) ??
    pickNumber(rawItem.total_steps) ??
    (Array.isArray(rawItem.steps) ? rawItem.steps.length : 0);

  return {
    id,
    suite_id: suiteId,
    suite_name: suiteName,
    name: pickString(rawItem.name) ?? pickString(rawItem.test_case_name) ?? "Untitled test case",
    step_count: stepCount,
    status: isTestCaseTableStatus(statusValue) ? statusValue : "pending",
    last_run:
      pickString(rawItem.last_run) ??
      pickString(rawItem.last_run_at) ??
      pickString(rawItem.last_executed_at) ??
      pickString(rawItem.updated_at),
  };
}

function normalizeStepExportCompactResponse(rawItem: unknown): TestStepExportCompactResponse | null {
  if (!isRecord(rawItem)) {
    return null;
  }

  const id = pickString(rawItem.id);
  const key = pickString(rawItem.key);
  const extractor = isRecord(rawItem.extractor) ? rawItem.extractor : null;
  const testStepRecord = isRecord(rawItem.test_step) ? rawItem.test_step : null;
  const stepName = pickString(testStepRecord?.name);

  if (!id || !key || !extractor) {
    return null;
  }

  return {
    id,
    key,
    extractor,
    is_secret: Boolean(rawItem.is_secret),
    test_step: {
      name: stepName ?? "",
    },
  };
}

// ============== Schedule Types ==============

export type ScheduleFrequency = "once" | "hourly" | "daily" | "weekly" | "cron";

export type ScheduleConfig = {
  frequency: ScheduleFrequency;
  start_time?: string;
  hour?: number;
  minute?: number;
  days_of_week?: number[];
  cron_expression?: string;
};

export type Schedule = {
  id: string;
  account_id: string;
  suite_id: string;
  suite_name: string;
  environment_id: string | null;
  name: string;
  config: ScheduleConfig;
  is_enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_run_status: RunStatus | null;
  created_at: string;
  updated_at: string;
};

export type CreateSchedulePayload = {
  suite_id: string;
  environment_id?: string | null;
  name: string;
  config: ScheduleConfig;
  is_enabled: boolean;
};

// ============== Mock Schedules Data ==============

const mockSchedules: Schedule[] = [
  {
    id: "sched-1",
    account_id: "acc-1",
    suite_id: "suite-1",
    suite_name: "Auth Suite",
    environment_id: "env-1",
    name: "Daily Auth Tests",
    config: { frequency: "daily", hour: 9, minute: 0 },
    is_enabled: true,
    next_run_at: "2026-02-08T09:00:00Z",
    last_run_at: "2026-02-07T09:00:00Z",
    last_run_status: "success",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-07T09:00:00Z",
  },
  {
    id: "sched-2",
    account_id: "acc-1",
    suite_id: "suite-2",
    suite_name: "Payment Suite",
    environment_id: null,
    name: "Hourly Payment Checks",
    config: { frequency: "hourly", minute: 30 },
    is_enabled: true,
    next_run_at: "2026-02-07T14:30:00Z",
    last_run_at: "2026-02-07T13:30:00Z",
    last_run_status: "failed",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-02-07T13:30:00Z",
  },
  {
    id: "sched-3",
    account_id: "acc-1",
    suite_id: "suite-3",
    suite_name: "User API Suite",
    environment_id: "env-2",
    name: "Weekly Regression",
    config: { frequency: "weekly", days_of_week: [1, 3, 5], hour: 6, minute: 0 },
    is_enabled: false,
    next_run_at: null,
    last_run_at: "2026-02-05T06:00:00Z",
    last_run_status: "success",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-02-05T06:00:00Z",
  },
  {
    id: "sched-4",
    account_id: "acc-1",
    suite_id: "suite-1",
    suite_name: "Auth Suite",
    environment_id: null,
    name: "One-time Deploy Test",
    config: { frequency: "once", start_time: "2026-02-10T15:00:00Z" },
    is_enabled: true,
    next_run_at: "2026-02-10T15:00:00Z",
    last_run_at: null,
    last_run_status: null,
    created_at: "2026-02-06T00:00:00Z",
    updated_at: "2026-02-06T00:00:00Z",
  },
];

// ============== Schedule API Functions ==============

export async function fetchSchedules(accountId: string, _token: string): Promise<Schedule[]> {
  // Mock implementation - returns schedules for the account
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockSchedules.filter((s) => s.account_id === accountId || accountId === "acc-1");
}

export async function createSchedule(
  payload: CreateSchedulePayload,
  _token: string
): Promise<Schedule> {
  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newSchedule: Schedule = {
    id: `sched-${Date.now()}`,
    account_id: "acc-1",
    suite_id: payload.suite_id,
    suite_name: "New Suite",
    environment_id: payload.environment_id ?? null,
    name: payload.name,
    config: payload.config,
    is_enabled: payload.is_enabled,
    next_run_at: payload.config.frequency === "once" ? payload.config.start_time ?? null : new Date().toISOString(),
    last_run_at: null,
    last_run_status: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockSchedules.push(newSchedule);
  return newSchedule;
}

export async function updateSchedule(
  scheduleId: string,
  payload: Partial<CreateSchedulePayload>,
  _token: string
): Promise<Schedule> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const index = mockSchedules.findIndex((s) => s.id === scheduleId);
  if (index === -1) {
    throw new Error("Schedule not found");
  }

  const updated: Schedule = {
    ...mockSchedules[index],
    ...payload,
    environment_id: payload.environment_id ?? mockSchedules[index].environment_id,
    updated_at: new Date().toISOString(),
  };

  mockSchedules[index] = updated;
  return updated;
}

export async function deleteSchedule(scheduleId: string, _token: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const index = mockSchedules.findIndex((s) => s.id === scheduleId);
  if (index === -1) {
    throw new Error("Schedule not found");
  }

  mockSchedules.splice(index, 1);
}

export async function toggleScheduleEnabled(
  scheduleId: string,
  isEnabled: boolean,
  _token: string
): Promise<Schedule> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const index = mockSchedules.findIndex((s) => s.id === scheduleId);
  if (index === -1) {
    throw new Error("Schedule not found");
  }

  mockSchedules[index] = {
    ...mockSchedules[index],
    is_enabled: isEnabled,
    updated_at: new Date().toISOString(),
  };

  return mockSchedules[index];
}
