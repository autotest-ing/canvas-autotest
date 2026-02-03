const BASE_API_URL = "https://internal-api.autotest.ing";

export type EnvironmentListItem = {
  id: string;
  name: string;
  is_default: boolean;
};

export type EnvironmentVariable = {
  id?: string | number;
  key: string;
  value: string;
};

export type EnvironmentSecret = {
  id?: string | number;
  key: string;
  value: string;
};

export type EnvironmentDetailResponse = {
  id: string;
  name: string;
  base_url?: string;
  baseUrl?: string;
  variables?: EnvironmentVariable[];
  secrets?: EnvironmentSecret[];
};

export type EnvironmentUpdatePayload = {
  name: string;
  is_default: boolean;
  base_url?: string;
  variables: Array<EnvironmentVariable & { is_overridable?: boolean }>;
  secrets: EnvironmentSecret[];
};

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export async function fetchEnvironments(accountId: string, token: string) {
  const response = await fetch(`${BASE_API_URL}/v1.0/environments?account_id=${accountId}`, {
    headers: {
      ...getAuthHeaders(token),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load environments");
  }

  const data = (await response.json()) as { items?: EnvironmentListItem[] };
  return data.items ?? [];
}

export async function fetchEnvironmentDetail(envId: string, token: string) {
  const response = await fetch(`${BASE_API_URL}/v1.0/environments/${envId}`, {
    headers: {
      ...getAuthHeaders(token),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load environment details");
  }

  return (await response.json()) as EnvironmentDetailResponse;
}

export async function updateEnvironment(
  envId: string,
  payload: EnvironmentUpdatePayload,
  token: string
) {
  const response = await fetch(`${BASE_API_URL}/v1.0/environments/${envId}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to update environment");
  }

  return (await response.json()) as EnvironmentDetailResponse;
}
