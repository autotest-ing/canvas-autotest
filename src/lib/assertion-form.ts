import type { AssertionType, CreateAssertionPayload } from "@/lib/api/suites";

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
};

export type BuildAssertionPayloadResult =
  | { ok: true; payload: CreateAssertionPayload }
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

export function buildCreateAssertionPayload(params: {
  testStepId: string;
  formValues: AddAssertionFormValues;
  existingAssertions: AssertionWithSortOrder[];
}): BuildAssertionPayloadResult {
  const { testStepId, formValues, existingAssertions } = params;
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
    payload: {
      test_step_id: testStepId,
      name,
      assertion_type: formValues.assertionType,
      operator,
      extractor,
      expected,
      expected_template: null,
      severity: "error",
      is_enabled: true,
      sort_order: getNextSortOrder(existingAssertions),
    },
  };
}
