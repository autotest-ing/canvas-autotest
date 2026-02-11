import { useState, useEffect, useCallback } from "react";
import { getNotificationsCount } from "@/lib/api/notifications";
import { useAuth } from "@/context/AuthContext";

export function useNotificationsCount(refreshIntervalMs: number = 60000) {
    const [count, setCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { token, isAuthenticated } = useAuth();

    const fetchCount = useCallback(async () => {
        if (!token || !isAuthenticated) return;

        try {
            setIsLoading(true);
            const data = await getNotificationsCount(token, false);
            setCount(data.count);
            setError(null);
        } catch (err) {
            console.error("Error fetching notifications count:", err);
            setError("Failed to fetch notifications count");
        } finally {
            setIsLoading(false);
        }
    }, [token, isAuthenticated]);

    useEffect(() => {
        fetchCount();

        if (refreshIntervalMs > 0 && isAuthenticated) {
            const interval = setInterval(fetchCount, refreshIntervalMs);
            return () => clearInterval(interval);
        }
    }, [fetchCount, refreshIntervalMs, isAuthenticated]);

    return {
        count,
        isLoading,
        error,
        refresh: fetchCount,
    };
}
