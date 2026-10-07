"use client";

/**
 * ReccaaScrollDriver
 *
 * Thin client component that attaches the cinematic scroll system to the
 * RECCAA editorial page.  It renders no visible DOM of its own — it only
 * holds the ref that the useReccaaScroll hook writes ScrollTrigger timelines
 * into.  The actual editorial markup is rendered by the (Server Component)
 * wrapper so that SSR/hydration stays clean.
 *
 * Usage:
 *   <ReccaaScrollDriver>
 *     {server-rendered editorial children}
 *   </ReccaaScrollDriver>
 */

import { useRef } from "react";
import { useReccaaScroll } from "./useReccaaScroll";

export function ReccaaScrollDriver({ children }) {
  const ref = useRef(null);
  useReccaaScroll(ref);

  return (
    <div ref={ref} className="reccaa-root">
      {children}
    </div>
  );
}
