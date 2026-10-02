"use client";

import { useCallback, useEffect, useState } from "react";
import { BACKEND_ENABLED, PATHS, api, apiErrorMessage } from "@/lib/api";
import { normaliseEvents } from "@/lib/events";

/**
 * Loads one event type for a list page, already normalised and ordered.
 *
 * `type` is matched exactly by the backend and lowercased on write, so it has
 * to be "workshops", not "Workshops". The response is cached server-side for
 * about five minutes, which is why a newly opened event can be briefly
 * missing — that is the cache, not a bug.
 *
 * Ordering is applied here because the backend query has no ORDER BY: row
 * order is whatever Postgres returns and can differ between two identical
 * calls. Nothing is renderable before `normaliseEvents` has run.
 *
 * `loading` is derived by comparing the request the hook wants against the
 * one it last settled, rather than being written from inside the effect. That
 * keeps it honest across a `type` change, and avoids the cascading render a
 * synchronous setState in an effect body would cause.
 *
 * Returns `{ events, loading, error, reload, backendDisabled }`. `events` is
 * always an array, so a view can map over it without guarding.
 */
export function useEvents(type, { label = "", fallbackImage = null } = {}) {
  const [reloadToken, setReloadToken] = useState(0);
  const [settled, setSettled] = useState({ key: null, events: [], error: null });

  // null means "there is nothing to fetch", which is its own resting state.
  const requestKey = BACKEND_ENABLED ? `${type ?? ""}|${reloadToken}` : null;

  useEffect(() => {
    if (requestKey === null) return undefined;

    const controller = new AbortController();
    let active = true;

    api
      .get(PATHS.eventsAll, {
        params: type ? { type } : undefined,
        signal: controller.signal,
      })
      .then((response) => {
        if (!active) return;
        setSettled({
          key: requestKey,
          events: normaliseEvents(response.data?.events, { label, fallbackImage }),
          error: null,
        });
      })
      .catch((requestError) => {
        // An abort is this effect being cleaned up, not a failure to report.
        if (!active || controller.signal.aborted) return;
        setSettled({
          key: requestKey,
          events: [],
          error: apiErrorMessage(requestError, "Could not load events right now."),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [requestKey, type, label, fallbackImage]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const idle = requestKey === null;
  const isSettled = idle || settled.key === requestKey;

  return {
    events: isSettled && !idle ? settled.events : [],
    loading: !isSettled,
    error: isSettled && !idle ? settled.error : null,
    reload,
    backendDisabled: !BACKEND_ENABLED,
  };
}
