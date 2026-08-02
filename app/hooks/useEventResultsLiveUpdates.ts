"use client";

import { useEffect } from "react";
import { fetchEventResults } from "@/lib/store/eventResultsSlice";
import { useAppDispatch } from "@/lib/store/hooks";

// Fallback in case the browser cannot keep a Server-Sent-Events connection open
// (e.g. blocked by a proxy). The data is then reloaded periodically.
const POLLING_INTERVAL_MS = 30_000;

/**
 * Keeps the redux store in sync with the database: every write through the API
 * routes triggers a Server-Sent-Event, which reloads the event data.
 */
export function useEventResultsLiveUpdates(slug: string | null) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!slug) {
      return;
    }

    let pollingTimer: ReturnType<typeof setInterval> | null = null;

    const stopPolling = () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    };

    const startPolling = () => {
      if (pollingTimer) {
        return;
      }

      pollingTimer = setInterval(() => {
        dispatch(fetchEventResults(slug));
      }, POLLING_INTERVAL_MS);
    };

    if (typeof EventSource === "undefined") {
      startPolling();
      return stopPolling;
    }

    const source = new EventSource(`/api/events/${encodeURIComponent(slug)}/stream`);

    const handleUpdate = () => {
      dispatch(fetchEventResults(slug));
    };

    source.addEventListener("update", handleUpdate);
    source.addEventListener("open", stopPolling);
    source.addEventListener("error", startPolling);

    return () => {
      stopPolling();
      source.removeEventListener("update", handleUpdate);
      source.removeEventListener("open", stopPolling);
      source.removeEventListener("error", startPolling);
      source.close();
    };
  }, [dispatch, slug]);
}
