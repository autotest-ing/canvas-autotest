import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddTestStepDialog } from "@/components/AddTestStepDialog";
import type { RequestListResponse } from "@/lib/api/suites";
import * as suitesApi from "@/lib/api/suites";

const firstRequestPage: RequestListResponse = {
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
  total: 2,
};

const secondRequestPage: RequestListResponse = {
  items: [
    {
      id: "request-2",
      request: {
        method: "POST",
        url: "/users",
        full_url: "https://api.example.com/users",
        headers: {},
        path_params: {},
        payload: { name: "alice" },
      },
      created_at: "2026-02-07T00:01:00Z",
      updated_at: "2026-02-07T00:01:00Z",
      is_assigned_to_test_step: false,
    },
  ],
  next_cursor: null,
  total: 2,
};

describe("AddTestStepDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders defaults and keeps submit disabled until name and request are provided", async () => {
    vi.spyOn(suitesApi, "fetchRequests").mockResolvedValue({
      ...firstRequestPage,
      next_cursor: null,
      total: 1,
    });

    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <AddTestStepDialog
        open
        onOpenChange={vi.fn()}
        token="jwt-token"
        accountId="account-1"
        onSubmit={onSubmit}
      />
    );

    await waitFor(() => {
      expect(suitesApi.fetchRequests).toHaveBeenCalledTimes(1);
    });

    const timeoutInput = screen.getByLabelText("Timeout (ms)") as HTMLInputElement;
    const retriesInput = screen.getByLabelText("Retries") as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: "Add Test Step" });

    expect(timeoutInput.value).toBe("5000");
    expect(retriesInput.value).toBe("0");
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Get current user" },
    });

    expect(submitButton).toBeDisabled();
  });

  it("triggers debounced request refetch when search changes", async () => {
    const fetchRequestsSpy = vi
      .spyOn(suitesApi, "fetchRequests")
      .mockResolvedValueOnce({ ...firstRequestPage, next_cursor: null, total: 1 })
      .mockResolvedValueOnce({ ...firstRequestPage, next_cursor: null, total: 1 });

    render(
      <AddTestStepDialog
        open
        onOpenChange={vi.fn()}
        token="jwt-token"
        accountId="account-1"
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await waitFor(() => {
      expect(fetchRequestsSpy).toHaveBeenCalledTimes(1);
    });

    const requestCombobox = screen.getByRole("combobox");
    fireEvent.click(requestCombobox);

    fireEvent.change(screen.getByPlaceholderText("Search requests..."), {
      target: { value: "users" },
    });

    await act(async () => {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 350);
      });
    });

    await waitFor(() => {
      expect(fetchRequestsSpy).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(requestCombobox);

    expect(fetchRequestsSpy).toHaveBeenLastCalledWith("account-1", "jwt-token", {
      limit: 20,
      search: "users",
      cursor: undefined,
    });
  });

  it("loads and appends next page when scrolling near the bottom", async () => {
    const fetchRequestsSpy = vi
      .spyOn(suitesApi, "fetchRequests")
      .mockResolvedValueOnce(firstRequestPage)
      .mockResolvedValueOnce(secondRequestPage);

    render(
      <AddTestStepDialog
        open
        onOpenChange={vi.fn()}
        token="jwt-token"
        accountId="account-1"
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await waitFor(() => {
      expect(fetchRequestsSpy).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("combobox"));
    await screen.findByText("GET /users/me");

    const list = await screen.findByTestId("request-command-list");
    Object.defineProperty(list, "scrollHeight", { value: 600, configurable: true });
    Object.defineProperty(list, "clientHeight", { value: 200, configurable: true });

    fireEvent.scroll(list, {
      target: { scrollTop: 380 },
    });

    await waitFor(() => {
      expect(fetchRequestsSpy).toHaveBeenCalledTimes(2);
    });

    expect(fetchRequestsSpy).toHaveBeenLastCalledWith("account-1", "jwt-token", {
      limit: 20,
      search: undefined,
      cursor: "cursor-2",
    });

    await screen.findByText("POST /users");
  });

  it("submits selected request and config values", async () => {
    vi.spyOn(suitesApi, "fetchRequests").mockResolvedValue({
      ...firstRequestPage,
      next_cursor: null,
      total: 1,
    });

    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <AddTestStepDialog
        open
        onOpenChange={vi.fn()}
        token="jwt-token"
        accountId="account-1"
        onSubmit={onSubmit}
      />
    );

    await waitFor(() => {
      expect(suitesApi.fetchRequests).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Get current user" },
    });

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText("GET /users/me"));

    fireEvent.change(screen.getByLabelText("Timeout (ms)"), {
      target: { value: "7000" },
    });
    fireEvent.change(screen.getByLabelText("Retries"), {
      target: { value: "2" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Test Step" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Get current user",
        requestId: "request-1",
        timeout: 7000,
        retries: 2,
      })
    );
  });
});
