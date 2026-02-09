import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HttpCodePanel } from "@/components/HttpCodePanel";
import type { RequestPayload, StepResultHttpRequest } from "@/lib/api/suites";

describe("HttpCodePanel", () => {
  it("renders request body from RequestPayload.payload", () => {
    const request: RequestPayload = {
      method: "POST",
      url: "{{BASE_URL}}/v1.0/signin",
      headers: null,
      payload: { email: "a@b.com" },
    };

    render(<HttpCodePanel request={request} response={null} onClose={vi.fn()} />);

    expect(screen.getByText(/a@b\.com/)).toBeInTheDocument();
    expect(screen.queryByText("No headers or body")).not.toBeInTheDocument();
  });

  it("renders request body from StepResultHttpRequest.body", () => {
    const request: StepResultHttpRequest = {
      method: "POST",
      url: "{{BASE_URL}}/v1.0/signin",
      headers: null,
      body: { email: "a@b.com" },
    };

    render(<HttpCodePanel request={request} response={null} onClose={vi.fn()} />);

    expect(screen.getByText(/a@b\.com/)).toBeInTheDocument();
    expect(screen.queryByText("No headers or body")).not.toBeInTheDocument();
  });

  it("renders empty string body marker", () => {
    const request: StepResultHttpRequest = {
      method: "POST",
      url: "{{BASE_URL}}/v1.0/signin",
      headers: null,
      body: "",
    };

    render(<HttpCodePanel request={request} response={null} onClose={vi.fn()} />);

    expect(screen.getByText('""')).toBeInTheDocument();
    expect(screen.queryByText("No headers or body")).not.toBeInTheDocument();
  });

  it("shows fallback when body is null and headers are empty", () => {
    const request: StepResultHttpRequest = {
      method: "POST",
      url: "{{BASE_URL}}/v1.0/signin",
      headers: null,
      body: null,
    };

    render(<HttpCodePanel request={request} response={null} onClose={vi.fn()} />);

    expect(screen.getByText("No headers or body")).toBeInTheDocument();
  });
});
