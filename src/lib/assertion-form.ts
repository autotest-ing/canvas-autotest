import type {
  AssertionDetailResponse,
  AssertionType,
  CreateAssertionPayload,
  UpdateAssertionPayload,
} from "@/lib/api/suites";

export type AssertionWithSortOrder = {
  sortOrder: number;
};

export const assertionTypeOptions: Array<{ value: AssertionType; label: string }> = [
  { value: "status_code", label: "Status Code" },
  { value: "header", label: "Header" },
  { value: "jsonpath", label: "JSONPath" },
  { value: "body_contains", label: "Body Contains" },
  { value: "body_equals", label: "Body Equals" },
  { value: "response_time", label: "Response Time" },
  { value: "schema", label: "Schema" },
];

export const defaultOperatorByType: Record<AssertionType, string> = {
  status_code: "equals",
  header: "equals",
  jsonpath: "equals",
  body_contains: "contains",
  body_equals: "equals",
  response_time: "less_than",
  schema: "matches",
  custom: "equals",
};

export const operatorOptionsByType: Record<AssertionType, string[]> = {
  status_code: ["equals", "not_equals", "greater_than", "greater_or_equal", "less_than", "less_or_equal"],
  header: ["equals", "contains", "matches"],
  jsonpath: ["equals", "matches", "is_in", "contains", "does_not_contain"],
  body_contains: ["contains", "does_not_contain"],
  body_equals: ["equals"],
  response_time: ["less_than", "less_or_equal", "greater_than", "greater_or_equal"],
  schema: ["matches"],
  custom: ["equals", "matches", "contains"],
};

export type AddAssertionFormValues = {
  name: string;
  assertionType: AssertionType;
  operator: string;
  headerKey: string;
  jsonPath: string;
  expectedText: string;
  expectedNumber: string;
  expectedJson: string;
  isEnabled: boolean;
};

export type BuildAssertionPayloadResult =
  | { ok: true; payload: CreateAssertionPayload }
  | { ok: false; error: string };

export type BuildUpdateAssertionPayloadResult =
  | { ok: true; payload: UpdateAssertionPayload; hasChanges: boolean }
  | { ok: false; error: string };

export function getDefaultOperator(assertionType: AssertionType): string {
  return defaultOperatorByType[assertionType] ?? "equals";
}

export function getOperatorOptions(assertionType: AssertionType): string[] {
  return operatorOptionsByType[assertionType] ?? ["equals"];
}

export function getNextSortOrder(assertions: AssertionWithSortOrder[]): number {
  if (assertions.length === 0) {
    return 1;
  }

  const maxSort = assertions.reduce((maxValue, assertion) => {
    return assertion.sortOrder > maxValue ? assertion.sortOrder : maxValue;
  }, 0);

  return maxSort + 1;
}

function parseJson(value: string): { ok: true; parsed: unknown } | { ok: false } {
  try {
    return { ok: true, parsed: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
}

function parseNumberValue(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isEqualValue(left: unknown, right: unknown): boolean {
  const normalizedLeft = left === undefined ? null : left;
  const normalizedRight = right === undefined ? null : right;

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  if (
    typeof normalizedLeft === "object" &&
    normalizedLeft !== null &&
    typeof normalizedRight === "object" &&
    normalizedRight !== null
  ) {
    return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
  }

  return false;
}

function formatExpectedAsText(expected: unknown): string {
  if (expected === null || expected === undefined) {
    return "";
  }
  if (typeof expected === "string") {
    return expected;
  }
  return JSON.stringify(expected);
}

function formatExpectedAsJson(expected: unknown): string {
  if (expected === null || expected === undefined) {
    return "";
  }
  if (typeof expected === "string") {
    const parsed = parseJson(expected);
    if (parsed.ok) {
      return JSON.stringify(parsed.parsed, null, 2);
    }
    return expected;
  }
  return JSON.stringify(expected, null, 2);
}

type EditableAssertionFields = {
  name: string;
  assertion_type: AssertionType;
  operator: string;
  extractor: Record<string, unknown> | null;
  expected: unknown;
  is_enabled: boolean;
};

type BuildEditableAssertionFieldsResult =
  | { ok: true; fields: EditableAssertionFields }
  | { ok: false; error: string };

function buildEditableAssertionFields(formValues: AddAssertionFormValues): BuildEditableAssertionFieldsResult {
  const name = formValues.name.trim();
  const operator = formValues.operator.trim();

  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  if (!operator) {
    return { ok: false, error: "Operator is required." };
  }

  let extractor: Record<string, unknown> | null = null;
  let expected: unknown = null;

  switch (formValues.assertionType) {
    case "status_code": {
      const parsed = parseNumberValue(formValues.expectedNumber);
      if (parsed === null) {
        return { ok: false, error: "Expected status code must be a valid number." };
      }
      expected = parsed;
      break;
    }

    case "header": {
      const headerKey = formValues.headerKey.trim();
      if (!headerKey) {
        return { ok: false, error: "Header name is required." };
      }
      const expectedValue = formValues.expectedText.trim();
      if (!expectedValue) {
        return { ok: false, error: "Expected header value is required." };
      }
      extractor = { type: "header", key: headerKey, source: "response_headers" };
      expected = expectedValue;
      break;
    }

    case "jsonpath": {
      const jsonPath = formValues.jsonPath.trim();
      if (!jsonPath) {
        return { ok: false, error: "JSONPath is required." };
      }
      extractor = { type: "jsonpath", path: jsonPath, source: "response_body" };

      if (operator === "is_in") {
        const parsedJson = parseJson(formValues.expectedJson.trim());
        if (!parsedJson.ok || !Array.isArray(parsedJson.parsed)) {
          return { ok: false, error: "Expected value must be a valid JSON array for is_in." };
        }
        expected = parsedJson.parsed;
      } else {
        const expectedValue = formValues.expectedText.trim();
        if (!expectedValue) {
          return { ok: false, error: "Expected value is required." };
        }
        expected = expectedValue;
      }
      break;
    }

    case "body_contains": {
      const expectedValue = formValues.expectedText.trim();
      if (!expectedValue) {
        return { ok: false, error: "Expected body text is required." };
      }
      expected = expectedValue;
      break;
    }

    case "body_equals": {
      const parsedJson = parseJson(formValues.expectedJson.trim());
      if (!parsedJson.ok) {
        return { ok: false, error: "Expected body must be valid JSON." };
      }
      expected = parsedJson.parsed;
      break;
    }

    case "response_time": {
      const parsed = parseNumberValue(formValues.expectedNumber);
      if (parsed === null) {
        return { ok: false, error: "Expected response time must be a valid number." };
      }
      expected = parsed;
      break;
    }

    case "schema": {
      const parsedJson = parseJson(formValues.expectedJson.trim());
      if (
        !parsedJson.ok ||
        typeof parsedJson.parsed !== "object" ||
        parsedJson.parsed === null ||
        Array.isArray(parsedJson.parsed)
      ) {
        return { ok: false, error: "Schema must be a valid JSON object." };
      }
      extractor = { type: "jsonpath", path: "$", source: "response_body" };
      expected = parsedJson.parsed;
      break;
    }

    default: {
      const expectedValue = formValues.expectedText.trim();
      if (!expectedValue) {
        return { ok: false, error: "Expected value is required." };
      }
      expected = expectedValue;
    }
  }

  return {
    ok: true,
    fields: {
      name,
      assertion_type: formValues.assertionType,
      operator,
      extractor,
      expected,
      is_enabled: formValues.isEnabled,
    },
  };
}

export function buildCreateAssertionPayload(params: {
  testStepId: string;
  formValues: AddAssertionFormValues;
  existingAssertions: AssertionWithSortOrder[];
}): BuildAssertionPayloadResult {
  const { testStepId, formValues, existingAssertions } = params;
  const fieldResult = buildEditableAssertionFields(formValues);
  if ("error" in fieldResult) {
    return { ok: false, error: fieldResult.error };
  }

  return {
    ok: true,
    payload: {
      test_step_id: testStepId,
      name: fieldResult.fields.name,
      assertion_type: fieldResult.fields.assertion_type,
      operator: fieldResult.fields.operator,
      extractor: fieldResult.fields.extractor,
      expected: fieldResult.fields.expected,
      expected_template: null,
      severity: "error",
      is_enabled: fieldResult.fields.is_enabled,
      sort_order: getNextSortOrder(existingAssertions),
    },
  };
}

export function mapAssertionToFormValues(assertion: AssertionDetailResponse): AddAssertionFormValues {
  const formValues: AddAssertionFormValues = {
    name: assertion.name ?? "",
    assertionType: assertion.assertion_type,
    operator: assertion.operator || getDefaultOperator(assertion.assertion_type),
    headerKey: "",
    jsonPath: "$.token_type",
    expectedText: "",
    expectedNumber: "",
    expectedJson: "",
    isEnabled: assertion.is_enabled,
  };

  if (assertion.assertion_type === "header") {
    const extractor = (assertion.extractor ?? {}) as Record<string, unknown>;
    formValues.headerKey =
      typeof extractor.key === "string" && extractor.key.trim() ? extractor.key : "";
    formValues.expectedText = formatExpectedAsText(assertion.expected);
    return formValues;
  }

  if (assertion.assertion_type === "jsonpath") {
    const extractor = (assertion.extractor ?? {}) as Record<string, unknown>;
    formValues.jsonPath =
      typeof extractor.path === "string" && extractor.path.trim() ? extractor.path : "$";
    if (assertion.operator === "is_in") {
      formValues.expectedJson = formatExpectedAsJson(assertion.expected);
    } else {
      formValues.expectedText = formatExpectedAsText(assertion.expected);
    }
    return formValues;
  }

  if (assertion.assertion_type === "status_code" || assertion.assertion_type === "response_time") {
    formValues.expectedNumber =
      assertion.expected === null || assertion.expected === undefined ? "" : String(assertion.expected);
    return formValues;
  }

  if (assertion.assertion_type === "body_equals" || assertion.assertion_type === "schema") {
    formValues.expectedJson = formatExpectedAsJson(assertion.expected);
    return formValues;
  }

  formValues.expectedText = formatExpectedAsText(assertion.expected);
  return formValues;
}

export function buildUpdateAssertionPayload(params: {
  originalAssertion: AssertionDetailResponse;
  formValues: AddAssertionFormValues;
}): BuildUpdateAssertionPayloadResult {
  const { originalAssertion, formValues } = params;
  const fieldResult = buildEditableAssertionFields(formValues);
  if ("error" in fieldResult) {
    return { ok: false, error: fieldResult.error };
  }

  const nextFields = fieldResult.fields;
  const payload: UpdateAssertionPayload = {};

  if (nextFields.name !== originalAssertion.name) {
    payload.name = nextFields.name;
  }

  if (nextFields.assertion_type !== originalAssertion.assertion_type) {
    payload.assertion_type = nextFields.assertion_type;
  }

  if (nextFields.operator !== originalAssertion.operator) {
    payload.operator = nextFields.operator;
  }

  if (!isEqualValue(nextFields.extractor, originalAssertion.extractor ?? null)) {
    payload.extractor = nextFields.extractor;
  }

  if (!isEqualValue(nextFields.expected, originalAssertion.expected)) {
    payload.expected = nextFields.expected;
  }

  if (nextFields.is_enabled !== originalAssertion.is_enabled) {
    payload.is_enabled = nextFields.is_enabled;
  }

  return {
    ok: true,
    payload,
    hasChanges: Object.keys(payload).length > 0,
  };
}
