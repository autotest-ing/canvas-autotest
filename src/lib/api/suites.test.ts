import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAssertion,
  deleteAssertion,
  getAssertion,
  updateAssertion,
  type CreateAssertionPayload,
  type UpdateAssertionPayload,
} from "@/lib/api/suites";

describe("assertion API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("createAssertion posts payload with auth headers and returns parsed response", async () => {
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

  it("createAssertion throws descriptive error from backend message on failure", async () => {
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

  it("getAssertion fetches assertion details with auth headers", async () => {
    const assertionId = "assertion-1";
    const responseBody = {
      id: assertionId,
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
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const result = await getAssertion(assertionId, "jwt-token");

    expect(fetchSpy).toHaveBeenCalledWith(
      `https://internal-api.autotest.ing/v1.0/assertions/${assertionId}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
        }),
      })
    );
    expect(result).toEqual(responseBody);
  });

  it("getAssertion throws descriptive error when backend returns message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Assertion not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(getAssertion("missing-assertion", "jwt-token")).rejects.toThrow(
      "Failed to load assertion: Assertion not found"
    );
  });

  it("updateAssertion sends PATCH payload and returns updated assertion", async () => {
    const assertionId = "assertion-1";
    const payload: UpdateAssertionPayload = {
      expected: 201,
      is_enabled: false,
    };
    const responseBody = {
      id: assertionId,
      test_step_id: "step-1",
      name: "Status code is 200",
      assertion_type: "status_code",
      operator: "equals",
      extractor: null,
      expected: 201,
      expected_template: null,
      severity: "error",
      is_enabled: false,
      sort_order: 1,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T11:00:00Z",
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const result = await updateAssertion(assertionId, payload, "jwt-token");

    expect(fetchSpy).toHaveBeenCalledWith(
      `https://internal-api.autotest.ing/v1.0/assertions/${assertionId}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(responseBody);
  });

  it("updateAssertion throws descriptive error from backend detail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      updateAssertion("assertion-1", { expected: "bad" }, "jwt-token")
    ).rejects.toThrow("Failed to update assertion: Invalid payload");
  });

  it("deleteAssertion sends DELETE and resolves on 204", async () => {
    const assertionId = "assertion-1";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteAssertion(assertionId, "jwt-token")).resolves.toBeUndefined();

    expect(fetchSpy).toHaveBeenCalledWith(
      `https://internal-api.autotest.ing/v1.0/assertions/${assertionId}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
        }),
      })
    );
  });

  it("deleteAssertion throws descriptive error from backend detail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Cannot delete assertion" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(deleteAssertion("assertion-1", "jwt-token")).rejects.toThrow(
      "Failed to delete assertion: Cannot delete assertion"
    );
  });
});
