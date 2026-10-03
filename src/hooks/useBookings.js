"use client";

import { useCallback, useEffect, useState } from "react";
import { BACKEND_ENABLED, PATHS, api, apiErrorMessage, apiErrorStatus } from "@/lib/api";

/**
 * The signed-in user's bookings, read through the backend from TIQR.
 *
 * A plain GET returns whatever is cached. `?refresh=1` asks for a live read,
 * but it is debounced to ten seconds server-side: the response reports
 * whether it actually refreshed (`refreshed`) and how long until another
 * attempt would (`refreshableInMs`).
 *
 * Both are honoured rather than ignored, because polling faster than the
 * debounce just collects stale cache hits.
 */
export function useBookings({ enabled = true } = {}) {
  const [settled, setSettled] = useState({ key: null, bookings: [], error: null });
  const [attempt, setAttempt] = useState(0);
  const [wantsFresh, setWantsFresh] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);

  const active = BACKEND_ENABLED && enabled;
  const requestKey = active ? String(attempt) : null;

  useEffect(() => {
    if (requestKey === null) return undefined;

    const controller = new AbortController();
    let alive = true;

    api
      .get(PATHS.bookingMy, {
        params: wantsFresh ? { refresh: 1 } : undefined,
        signal: controller.signal,
      })
      .then((response) => {
        if (!alive) return;
        const data = response.data ?? {};
        setSettled({
          key: requestKey,
          bookings: Array.isArray(data.bookings) ? data.bookings : [],
          error: null,
        });
        // Absent or zero means "ask again whenever"; the server's own number
        // is preferred over any guess made here.
        setCooldownMs(Number(data.refreshableInMs) || 0);
      })
      .catch((error) => {
        if (!alive || controller.signal.aborted) return;
        // A 401 is handled globally by UserContext; nothing to add here.
        setSettled({
          key: requestKey,
          bookings: [],
          error:
            apiErrorStatus(error) === 401
              ? null
              : apiErrorMessage(error, "Could not load your bookings."),
        });
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [requestKey, wantsFresh]);

  /** Ticks the cooldown down so the button can show a countdown. */
  useEffect(() => {
    if (cooldownMs <= 0) return undefined;

    const startedAt = Date.now();
    const start = cooldownMs;
    const timer = setInterval(() => {
      const left = start - (Date.now() - startedAt);
      setCooldownMs(left > 0 ? left : 0);
    }, 250);

    return () => clearInterval(timer);
    // Re-armed only when a response resets it, not on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled.key]);

  const refresh = useCallback(() => {
    setWantsFresh(true);
    setAttempt((value) => value + 1);
  }, []);

  const idle = requestKey === null;
  const isSettled = idle || settled.key === requestKey;

  return {
    bookings: isSettled && !idle ? settled.bookings : [],
    loading: !isSettled,
    error: isSettled && !idle ? settled.error : null,
    refresh,
    /** Seconds until another live read is possible, 0 when one is. */
    cooldownSeconds: Math.ceil(cooldownMs / 1000),
    canRefresh: isSettled && cooldownMs <= 0,
  };
}
