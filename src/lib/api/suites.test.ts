import { afterEach, describe, expect, it, vi } from "vitest";
import { createAssertion, type CreateAssertionPayload } from "@/lib/api/suites";

describe("createAssertion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts payload with auth headers and returns parsed response", async () => {
    const payload: CreateAssertionPayload = {
      test_step_id: "step-1",
      name: "Status code is 200",
      assertion_type: "status_code",
      operator: "equals",
      extractor: null,
      expected: 200,
      expected_template: null,
      severity: "error",
      is_enabled: true,
      sort_order: 1,
    };

    const responseBody = {
      id: "assertion-1",
      ...payload,
      created_at: "2026-02-06T21:06:51.616765Z",
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(responseBody), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      );

    const result = await createAssertion(payload, "jwt-token");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://internal-api.autotest.ing/v1.0/assertions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
          "Content-Type": "application/json",
        }),
      })
    );

    expect(result).toEqual(responseBody);
  });

  it("throws descriptive error from backend message on failure", async () => {
    const payload: CreateAssertionPayload = {
      test_step_id: "step-1",
      name: "Header check",
      assertion_type: "header",
      operator: "equals",
      extractor: { type: "header", key: "content-type", source: "response_headers" },
      expected: "application/json",
      expected_template: null,
      severity: "error",
      is_enabled: true,
      sort_order: 2,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid operator" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(createAssertion(payload, "jwt-token")).rejects.toThrow(
      "Failed to create assertion: Invalid operator"
    );
  });
});
