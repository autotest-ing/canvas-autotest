import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAssertion,
  createTestStep,
  deleteAssertion,
  fetchRequests,
  getAssertion,
  updateAssertion,
  type CreateAssertionPayload,
  type CreateTestStepPayload,
  type UpdateAssertionPayload,
} from "@/lib/api/suites";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("assertion API client", () => {

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

describe("request API client", () => {
  it("fetchRequests sends account_id/search/limit/cursor params and returns parsed response", async () => {
    const responseBody = {
      items: [
        {
          id: "request-1",
          request: {
            method: "GET",
            url: "/users/me",
            full_url: "https://api.example.com/users/me",
            headers: {},
            path_params: {},
            payload: null,
          },
          created_at: "2026-02-07T00:00:00Z",
          updated_at: "2026-02-07T00:00:00Z",
          is_assigned_to_test_step: false,
        },
      ],
      next_cursor: "cursor-2",
      total: 1,
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const result = await fetchRequests("account-1", "jwt-token", {
      search: "users",
      limit: 20,
      cursor: "cursor-1",
    });

    const [requestUrl, requestOptions] = fetchSpy.mock.calls[0];
    const parsedUrl = new URL(String(requestUrl));
    expect(parsedUrl.origin + parsedUrl.pathname).toBe("https://internal-api.autotest.ing/v1.0/requests");
    expect(parsedUrl.searchParams.get("account_id")).toBe("account-1");
    expect(parsedUrl.searchParams.get("search")).toBe("users");
    expect(parsedUrl.searchParams.get("limit")).toBe("20");
    expect(parsedUrl.searchParams.get("cursor")).toBe("cursor-1");
    expect(requestOptions).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
        }),
      })
    );
    expect(result).toEqual(responseBody);
  });

  it("fetchRequests throws descriptive error from backend detail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(fetchRequests("account-1", "jwt-token")).rejects.toThrow(
      "Failed to load requests: Access denied"
    );
  });
});

describe("test step API client", () => {
  it("createTestStep posts payload with auth headers and returns parsed response", async () => {
    const payload: CreateTestStepPayload = {
      test_case_id: "4ebfdfbc-d0cb-4a09-8c34-765fc0911546",
      name: "Get current user",
      step_type: "request",
      request_id: "f0a1e3c6-b3e5-4ede-9f55-f3b043d578e4",
      sort_order: 2,
      config: {
        timeout: 5000,
        retries: 0,
      },
    };

    const responseBody = {
      id: "4cfd1fd0-566b-485c-b09f-509d8b8b1cc0",
      test_case_id: payload.test_case_id,
      name: payload.name,
      step_type: payload.step_type,
      request_id: payload.request_id,
      collection_id: null,
      sort_order: payload.sort_order,
      config: payload.config,
      created_at: "2026-02-06T22:35:01.526537Z",
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(responseBody), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      );

    const result = await createTestStep(payload, "jwt-token");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://internal-api.autotest.ing/v1.0/test-steps",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(responseBody);
  });

  it("createTestStep throws descriptive error from backend message", async () => {
    const payload: CreateTestStepPayload = {
      test_case_id: "test-case-1",
      name: "Create step",
      step_type: "request",
      request_id: "request-1",
      sort_order: 1,
      config: {
        timeout: 5000,
        retries: 0,
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid request_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(createTestStep(payload, "jwt-token")).rejects.toThrow(
      "Failed to create test step: Invalid request_id"
    );
  });
});
