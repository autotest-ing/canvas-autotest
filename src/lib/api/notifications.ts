const BASE_API_URL = "https://internal-api.autotest.ing";

export interface NotificationsCountResponse {
    count: number;
}

export async function getNotificationsCount(token: string, isRead?: boolean): Promise<NotificationsCountResponse> {
    const url = new URL(`${BASE_API_URL}/v1.0/notifications/count`);
    if (isRead !== undefined) {
        url.searchParams.append("is_read", isRead.toString());
    }

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch notifications count");
    }

    return response.json();
}
