/**
 * Bookings come back in TIQR's own shape, passed straight through: snake_case
 * keys, and `ticket.event` holding TIQR's event id.
 *
 * That id matches `Event.tiqrEventId`, NOT `Event.id`. Joining on `Event.id`
 * does not error — it quietly pairs bookings with whichever unrelated event
 * happens to share that number, so every row shows a plausible wrong title.
 *
 * This is also the only source of truth for a booking. Nothing is stored on
 * this side and there is no webhook, so what is here is what TIQR said.
 */

import { formatDateTime, formatPrice } from './format.js'

const CONFIRMED = 'CONFIRMED'
const PENDING = 'PENDING'

/** Case-insensitively, because the two pages used to disagree on this. */
export function bookingStatus(booking) {
  const status = String(booking?.status ?? '').toUpperCase()
  if (status === CONFIRMED) return CONFIRMED
  if (status === PENDING) return PENDING
  return status || 'UNKNOWN'
}

export function isConfirmed(booking) {
  return bookingStatus(booking) === CONFIRMED
}

/** Events keyed by TIQR's id, skipping any that were never synced. */
export function byTiqrId(events) {
  const index = new Map()
  for (const event of events ?? []) {
    if (event?.tiqrEventId !== null && event?.tiqrEventId !== undefined) {
      index.set(Number(event.tiqrEventId), event)
    }
  }
  return index
}

function timeOf(booking) {
  const ms = new Date(booking?.created_at ?? 0).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

/**
 * One booking, joined to our event record where we have one.
 *
 * `ticket.type` is the fallback title: a booking can reference a TIQR event
 * with no local row, and showing "General" beats showing nothing.
 */
export function normaliseBooking(raw, eventsByTiqrId) {
  if (!raw || typeof raw !== 'object') return null

  const tiqrEventId = raw.ticket?.event ?? null
  const event = tiqrEventId === null ? null : eventsByTiqrId?.get(Number(tiqrEventId))

  return {
    // React list key. `booking_id` is TIQR's human-facing reference and is not
    // present on every response, so it is shown only when it exists.
    id: raw.id,
    reference: raw.booking_id ?? null,

    status: bookingStatus(raw),
    quantity: raw.quantity ?? 1,
    createdAt: raw.created_at ?? null,
    createdLabel: formatDateTime(raw.created_at),

    title: event?.fullTitle || raw.ticket?.type || 'Booking',
    amount: typeof raw.ticket?.amount === 'number' ? formatPrice(raw.ticket.amount) : null,

    /** Our event id, for linking. Null when no local row matched. */
    eventId: event?.id ?? null,
    tiqrEventId,
    venue: event?.venue ?? null,
    when: event?.dateFull ?? null,
  }
}

/** Newest first, which is the order the profile lists them in. */
export function joinBookings(bookings, events) {
  if (!Array.isArray(bookings)) return []

  const index = byTiqrId(events)

  return bookings
    .map((booking) => normaliseBooking(booking, index))
    .filter(Boolean)
    .sort((a, b) => timeOf({ created_at: b.createdAt }) - timeOf({ created_at: a.createdAt }))
}

/**
 * The newest booking for one TIQR event, which is what the post-payment
 * screen looks for after a redirect back.
 */
export function latestForEvent(bookings, tiqrEventId) {
  if (tiqrEventId === null || tiqrEventId === undefined) return null

  const matches = (bookings ?? [])
    .filter((booking) => Number(booking?.ticket?.event) === Number(tiqrEventId))
    .sort((a, b) => timeOf(b) - timeOf(a))

  return matches[0] ?? null
}
