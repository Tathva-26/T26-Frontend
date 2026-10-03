"use client";

import { useEffect, useState } from "react";
import { BACKEND_ENABLED, PATHS, api, apiErrorMessage, apiErrorStatus } from "@/lib/api";
import { normaliseEvent } from "@/lib/events";

/**
 * Loads one event's full record, for the detail modal.
 *
 * This exists because `/api/events/all` returns a trimmed field set: no
 * `startTime`, `endTime`, `extraInfo`, `teamSize` or `isTeamEvent`, and
 * `venue` as `{ name }` only. Anything the modal shows beyond what a card
 * shows has to come from here.
 *
 * Pass `null` to load nothing — which is what a closed modal should do.
 *
 * Both 400 and 404 mean "no such event" (400 is a non-numeric id, 404 is a
 * missing one or a draft), and both surface as `notFound` rather than an
 * error, because there is nothing for the user to retry.
 */
export function useEventDetails(id, { label = "", fallbackImage = null } = {}) {
  const [settled, setSettled] = useState({
    key: null,
    event: null,
    error: null,
    notFound: false,
  });

  const hasId = id !== null && id !== undefined && id !== "";
  const requestKey = BACKEND_ENABLED && hasId ? String(id) : null;

  useEffect(() => {
    if (requestKey === null) return undefined;

    const controller = new AbortController();
    let active = true;

    api
      .get(PATHS.eventDetails(id), { signal: controller.signal })
      .then((response) => {
        if (!active) return;
        setSettled({
          key: requestKey,
          event: normaliseEvent(response.data?.event, { label, fallbackImage }),
          error: null,
          notFound: false,
        });
      })
      .catch((requestError) => {
        if (!active || controller.signal.aborted) return;

        const status = apiErrorStatus(requestError);
        const missing = status === 404 || status === 400;

        setSettled({
          key: requestKey,
          event: null,
          notFound: missing,
          error: missing
            ? null
            : apiErrorMessage(requestError, "Could not load this event."),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [requestKey, id, label, fallbackImage]);

  const idle = requestKey === null;
  const isSettled = idle || settled.key === requestKey;
  const ready = isSettled && !idle;

  return {
    event: ready ? settled.event : null,
    loading: !isSettled,
    error: ready ? settled.error : null,
    notFound: ready ? settled.notFound : false,
  };
}
