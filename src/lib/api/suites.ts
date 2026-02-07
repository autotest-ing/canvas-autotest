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
