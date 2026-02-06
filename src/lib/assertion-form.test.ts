import { describe, expect, it } from "vitest";
import {
  buildCreateAssertionPayload,
  getDefaultOperator,
  getNextSortOrder,
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
