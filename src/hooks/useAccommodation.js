'use client'

import { useCallback, useEffect, useState } from 'react'
import { BACKEND_ENABLED, PATHS, api, apiErrorMessage } from '@/lib/api'

/**
 * Loads room tiers, food coupons and the guest policy notes.
 *
 * Follows the same resting-state shape as `useEvents`: `loading` is derived by
 * comparing the request we want against the one we last settled, rather than
 * being written from inside the effect, so a reload cannot leave it stuck.
 *
 * `rooms`, `food` and `availability` are always arrays, so the page can map
 * over them without guarding.
 */
export function useAccommodation() {
  const [reloadToken, setReloadToken] = useState(0)
  const [settled, setSettled] = useState({ key: null, data: null, error: null })

  const requestKey = BACKEND_ENABLED ? `options|${reloadToken}` : null

  useEffect(() => {
    if (requestKey === null) return undefined

    const controller = new AbortController()
    let active = true

    api
      .get(PATHS.accommodationOptions, { signal: controller.signal })
      .then((response) => {
        if (!active) return
        setSettled({ key: requestKey, data: response.data ?? null, error: null })
      })
      .catch((requestError) => {
        if (!active || controller.signal.aborted) return
        setSettled({
          key: requestKey,
          data: null,
          error: apiErrorMessage(
            requestError,
            'Could not load accommodation right now.',
          ),
        })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [requestKey])

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  return {
    // Flat SKU rows plus a separate per-night availability list — the page
    // assembles its "tier" view from these via lib/accommodation.
    rooms: settled.data?.rooms ?? [],
    food: settled.data?.food ?? [],
    availability: settled.data?.availability ?? [],
    notes: settled.data?.notes ?? [],
    festNights: settled.data?.festNights ?? 3,
    checkIn: settled.data?.checkIn ?? null,
    checkOut: settled.data?.checkOut ?? null,
    loading: requestKey !== null && settled.key !== requestKey,
    error: settled.error,
    backendDisabled: !BACKEND_ENABLED,
    reload,
  }
}
