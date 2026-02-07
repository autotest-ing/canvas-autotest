import { describe, expect, it } from "vitest";
import {
  buildCreateAssertionPayload,
  buildUpdateAssertionPayload,
  getDefaultOperator,
  getNextSortOrder,
  mapAssertionToFormValues,
  type AddAssertionFormValues,
} from "@/lib/assertion-form";

function baseValues(overrides: Partial<AddAssertionFormValues> = {}): AddAssertionFormValues {
  return {
    name: "Assertion name",
    assertionType: "status_code",
    operator: getDefaultOperator("status_code"),
    headerKey: "",
    jsonPath: "$.token_type",
    expectedText: "",
    expectedNumber: "200",
    expectedJson: "",
    isEnabled: true,
    ...overrides,
  };
}

describe("buildCreateAssertionPayload", () => {
  it("builds valid payloads for all supported assertion types", () => {
    const scenarios: AddAssertionFormValues[] = [
      baseValues({
        assertionType: "status_code",
        operator: "equals",
        expectedNumber: "200",
      }),
      baseValues({
        assertionType: "header",
        operator: "equals",
        headerKey: "content-type",
        expectedText: "application/json",
      }),
      baseValues({
        assertionType: "jsonpath",
        operator: "equals",
        jsonPath: "$.token_type",
        expectedText: "bearer",
      }),
      baseValues({
        assertionType: "body_contains",
        operator: "contains",
        expectedText: "access_token",
      }),
      baseValues({
        assertionType: "body_equals",
        operator: "equals",
        expectedJson: '{"access_token":"abc","token_type":"bearer"}',
      }),
      baseValues({
        assertionType: "response_time",
        operator: "less_than",
        expectedNumber: "300",
      }),
      baseValues({
        assertionType: "schema",
        operator: "matches",
        expectedJson: '{"type":"object","required":["access_token"]}',
      }),
    ];

    scenarios.forEach((formValues) => {
      const result = buildCreateAssertionPayload({
        testStepId: "step-1",
        formValues,
        existingAssertions: [{ sortOrder: 2 }],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.payload.test_step_id).toBe("step-1");
        expect(result.payload.sort_order).toBe(3);
        expect(result.payload.severity).toBe("error");
        expect(result.payload.is_enabled).toBe(true);
      }
    });
  });

  it("rejects invalid JSON for body_equals and schema", () => {
    const bodyEqualsResult = buildCreateAssertionPayload({
      testStepId: "step-1",
      formValues: baseValues({
        assertionType: "body_equals",
        operator: "equals",
        expectedJson: "{invalid json}",
      }),
      existingAssertions: [],
    });

    const schemaResult = buildCreateAssertionPayload({
      testStepId: "step-1",
      formValues: baseValues({
        assertionType: "schema",
        operator: "matches",
        expectedJson: "[1,2,3]",
      }),
      existingAssertions: [],
    });

    expect(bodyEqualsResult).toEqual({ ok: false, error: "Expected body must be valid JSON." });
    expect(schemaResult).toEqual({ ok: false, error: "Schema must be a valid JSON object." });
  });

  it("enforces required header and jsonpath fields", () => {
    const missingHeader = buildCreateAssertionPayload({
      testStepId: "step-1",
      formValues: baseValues({
        assertionType: "header",
        operator: "equals",
        headerKey: "",
        expectedText: "application/json",
      }),
      existingAssertions: [],
    });

    const missingPath = buildCreateAssertionPayload({
      testStepId: "step-1",
      formValues: baseValues({
        assertionType: "jsonpath",
        operator: "equals",
        jsonPath: "",
        expectedText: "bearer",
      }),
      existingAssertions: [],
    });

    expect(missingHeader).toEqual({ ok: false, error: "Header name is required." });
    expect(missingPath).toEqual({ ok: false, error: "JSONPath is required." });
  });

  it("enforces numeric expected values for status_code and response_time", () => {
    const invalidStatusCode = buildCreateAssertionPayload({
      testStepId: "step-1",
      formValues: baseValues({
        assertionType: "status_code",
        operator: "equals",
        expectedNumber: "NaN",
      }),
      existingAssertions: [],
    });

    const invalidResponseTime = buildCreateAssertionPayload({
      testStepId: "step-1",
      formValues: baseValues({
        assertionType: "response_time",
        operator: "less_than",
        expectedNumber: "abc",
      }),
      existingAssertions: [],
    });

    expect(invalidStatusCode).toEqual({
      ok: false,
      error: "Expected status code must be a valid number.",
    });
    expect(invalidResponseTime).toEqual({
      ok: false,
      error: "Expected response time must be a valid number.",
    });
  });
});

describe("getNextSortOrder", () => {
  it("returns max + 1 and defaults to 1", () => {
    expect(getNextSortOrder([])).toBe(1);
    expect(getNextSortOrder([{ sortOrder: 1 }, { sortOrder: 4 }, { sortOrder: 2 }])).toBe(5);
  });
});

describe("mapAssertionToFormValues", () => {
  it("maps expected fields for supported assertion types", () => {
    const statusAssertion = mapAssertionToFormValues({
      id: "a1",
      test_step_id: "step-1",
      name: "Status 200",
      assertion_type: "status_code",
      operator: "equals",
      extractor: null,
      expected: 200,
      expected_template: null,
      severity: "error",
      is_enabled: true,
      sort_order: 1,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
    expect(statusAssertion.expectedNumber).toBe("200");
    expect(statusAssertion.isEnabled).toBe(true);

    const headerAssertion = mapAssertionToFormValues({
      id: "a2",
      test_step_id: "step-1",
      name: "Header",
      assertion_type: "header",
      operator: "equals",
      extractor: { type: "header", key: "content-type", source: "response_headers" },
      expected: "application/json",
      expected_template: null,
      severity: "error",
      is_enabled: false,
      sort_order: 2,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
    expect(headerAssertion.headerKey).toBe("content-type");
    expect(headerAssertion.expectedText).toBe("application/json");
    expect(headerAssertion.isEnabled).toBe(false);

    const jsonPathIsInAssertion = mapAssertionToFormValues({
      id: "a3",
      test_step_id: "step-1",
      name: "JSONPath in",
      assertion_type: "jsonpath",
      operator: "is_in",
      extractor: { type: "jsonpath", path: "$.domain", source: "response_body" },
      expected: ["a.com", "b.com"],
      expected_template: null,
      severity: "error",
      is_enabled: true,
      sort_order: 3,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
    expect(jsonPathIsInAssertion.jsonPath).toBe("$.domain");
    expect(jsonPathIsInAssertion.expectedJson).toContain("a.com");
    expect(jsonPathIsInAssertion.expectedText).toBe("");

    const bodyEqualsAssertion = mapAssertionToFormValues({
      id: "a4",
      test_step_id: "step-1",
      name: "Body equals",
      assertion_type: "body_equals",
      operator: "equals",
      extractor: null,
      expected: { ok: true, value: 1 },
      expected_template: null,
      severity: "error",
      is_enabled: true,
      sort_order: 4,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
    expect(bodyEqualsAssertion.expectedJson).toContain('"ok": true');

    const schemaAssertion = mapAssertionToFormValues({
      id: "a5",
      test_step_id: "step-1",
      name: "Schema",
      assertion_type: "schema",
      operator: "matches",
      extractor: { type: "jsonpath", path: "$", source: "response_body" },
      expected: { type: "object", required: ["id"] },
      expected_template: null,
      severity: "error",
      is_enabled: true,
      sort_order: 5,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
    expect(schemaAssertion.expectedJson).toContain('"required"');
  });
});

describe("buildUpdateAssertionPayload", () => {
  it("returns empty payload when form matches original assertion", () => {
    const originalAssertion = {
      id: "a1",
      test_step_id: "step-1",
      name: "Status 200",
      assertion_type: "status_code" as const,
      operator: "equals",
      extractor: null,
      expected: 200,
      expected_template: null,
      severity: "error",
      is_enabled: true,
      sort_order: 1,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const formValues = mapAssertionToFormValues(originalAssertion);
    const result = buildUpdateAssertionPayload({
      originalAssertion,
      formValues,
    });

    expect(result).toEqual({
      ok: true,
      payload: {},
      hasChanges: false,
    });
  });

  it("builds changed PATCH payload with extractor and expected", () => {
    const originalAssertion = {
      id: "a2",
      test_step_id: "step-1",
      name: "Check domain",
      assertion_type: "jsonpath" as const,
      operator: "equals",
      extractor: { type: "jsonpath", path: "$.domain", source: "response_body" },
      expected: "old-value",
      expected_template: null,
      severity: "error",
      is_enabled: true,
      sort_order: 2,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const formValues = baseValues({
      name: "Check updated domain",
      assertionType: "jsonpath",
      operator: "is_in",
      jsonPath: "$.domain",
      expectedText: "",
      expectedJson: '["new-value","backup"]',
      expectedNumber: "",
      isEnabled: false,
    });

    const result = buildUpdateAssertionPayload({
      originalAssertion,
      formValues,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hasChanges).toBe(true);
      expect(result.payload).toEqual({
        name: "Check updated domain",
        operator: "is_in",
        expected: ["new-value", "backup"],
        is_enabled: false,
      });
    }
  });
});
