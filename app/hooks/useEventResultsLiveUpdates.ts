"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventResults } from "@/lib/store/eventResultsSlice";
import { useAppDispatch } from "@/lib/store/hooks";

// While data is still coming in, the cheap version endpoint is polled at this rate.
const ACTIVE_POLLING_INTERVAL_MS = 15_000;

// An event that has not changed for a while is polled far less often.
const DORMANT_POLLING_INTERVAL_MS = 5 * 60_000;

// How long after the last observed change the fast interval is kept. Any change
// resets this, so an event that keeps receiving imports is never slowed down.
const ACTIVITY_WINDOW_MS = 10 * 60_000;

// After this time without any user interaction polling stops completely and the
// user has to refresh manually. This prevents forgotten tabs from polling for days.
const INACTIVITY_TIMEOUT_MS = 30 * 60_000;

export type TLiveUpdatesState = {
  /** True while polling is paused because the user has been inactive for too long. */
  paused: boolean;
  /** Triggers an immediate reload and resumes polling. */
  refresh: () => void;
};

/**
 * Keeps the redux store in sync with the database by polling a lightweight
 * version endpoint. The full (and expensive) result payload is only requested
 * when the event actually changed.
 *
 * The polling rate follows the observed activity instead of deriving from the
 * data whether a competition is over: as long as results keep arriving the fast
 * interval is used, and every detected change resets the window. Polling can
 * therefore never get stuck slow while data is still being imported.
 *
 * @param slug           Event slug to watch.
 * @param initialVersion Revision of the server rendered payload, so the first poll
 *                       does not trigger a redundant full reload.
 */
export function useEventResultsLiveUpdates(slug: string | null, initialVersion: number | null = null): TLiveUpdatesState {
  const dispatch = useAppDispatch();
  const [paused, setPaused] = useState(false);
  const lastInteractionRef = useRef(Date.now());
  const lastChangeRef = useRef(Date.now());
  const knownVersionRef = useRef<number | null>(initialVersion);
  const resumeRef = useRef<(() => void) | null>(null);

  const refresh = useCallback(() => {
    lastInteractionRef.current = Date.now();
    lastChangeRef.current = Date.now();
    setPaused(false);
    resumeRef.current?.();
  }, []);

  useEffect(() => {
    if (!slug) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let inFlight = false;

    const stop = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = () => {
      stop();

      if (cancelled) {
        return;
      }

      const active = Date.now() - lastChangeRef.current < ACTIVITY_WINDOW_MS;

      timer = setTimeout(tick, active ? ACTIVE_POLLING_INTERVAL_MS : DORMANT_POLLING_INTERVAL_MS);
    };

    const tick = async () => {
      if (cancelled || inFlight) {
        return;
      }

      // Do not spend requests while the tab is hidden or the device is locked.
      if (document.visibilityState === "hidden") {
        stop();
        return;
      }

      if (Date.now() - lastInteractionRef.current > INACTIVITY_TIMEOUT_MS) {
        stop();
        setPaused(true);
        return;
      }

      inFlight = true;

      try {
        const response = await fetch(`/api/events/${encodeURIComponent(slug)}/version`, { cache: "no-store" });

        if (response.ok) {
          const { updatedAt } = (await response.json()) as { updatedAt: number };

          if (knownVersionRef.current === null || updatedAt !== knownVersionRef.current) {
            knownVersionRef.current = updatedAt;
            lastChangeRef.current = Date.now();
            await dispatch(fetchEventResults(slug));
          }
        }
      } catch {
        // Network hiccup - simply try again on the next tick.
      } finally {
        inFlight = false;

        if (!cancelled) {
          schedule();
        }
      }
    };

    const resume = () => {
      lastInteractionRef.current = Date.now();
      setPaused(false);
      void tick();
    };

    resumeRef.current = resume;

    const noteInteraction = () => {
      lastInteractionRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resume();
      } else {
        stop();
      }
    };

    schedule();

    window.addEventListener("focus", noteInteraction);
    window.addEventListener("pointerdown", noteInteraction);
    window.addEventListener("keydown", noteInteraction);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      stop();
      resumeRef.current = null;
      window.removeEventListener("focus", noteInteraction);
      window.removeEventListener("pointerdown", noteInteraction);
      window.removeEventListener("keydown", noteInteraction);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dispatch, slug]);

  return { paused, refresh };
}
