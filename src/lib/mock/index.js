/**
 * An axios adapter that answers every endpoint this app calls from
 * `./fixtures`, with no network at all. Switched on by
 * `NEXT_PUBLIC_USE_MOCK_DATA=true`, and wired up in `src/lib/api.js`.
 *
 * It mirrors the real backend's awkward edges on purpose, so that code which
 * would break in production breaks here first:
 *
 *   - DRAFT events are filtered out of every public response
 *   - `/api/events/all` returns a TRIMMED field set (no startTime/endTime/
 *     extraInfo/teamSize, and `venue` as `{ name }` only), in a deliberately
 *     shuffled order, because the real query has no `orderBy`
 *   - `?refresh=1` on `/api/booking/my` is debounced to 10 seconds and
 *     reports whether it actually refreshed
 *   - `/api/announcements` and `/api/tiqr-events/*` answer 404, because the
 *     routers are not mounted on the real backend either
 */

import { AxiosError } from 'axios'
import {
  BOOKINGS,
  EVENTS,
  REFERRALS,
  SEAT_COUNT,
  USER,
  VENUE_LIST,
} from './fixtures.js'

const LATENCY_MS = 220

/** The passcode that satisfies the gated fixture event (id 13). */
const MOCK_PASSCODE = 'tathva26'

/* ---- mutable session state ------------------------------------------ */

let currentUser = { ...USER }
let lastBookingRefreshAt = 0

/**
 * Mock sign-in state is kept in sessionStorage, not a module variable, so it
 * survives the full page navigation that signing in and out performs. Without
 * that, signing out would appear to work and then be forgotten on the next
 * page load.
 *
 * Defaults to signed in, which is what the node contract check expects; a
 * browser that has signed out explicitly sees that choice honoured.
 */
const SESSION_KEY = 'tathva-mock-signed-in'
let signedInMemory = true

function signedIn() {
  if (typeof window === 'undefined') return signedInMemory
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY)
    return stored === null ? signedInMemory : stored === 'true'
  } catch {
    return signedInMemory
  }
}

/** Test the signed-out paths without clearing a real cookie. */
export function setMockSignedIn(value) {
  signedInMemory = Boolean(value)
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_KEY, String(signedInMemory))
  } catch {
    // Private mode or blocked storage: the module variable still applies.
  }
}

export function resetMockState() {
  currentUser = { ...USER }
  signedInMemory = true
  lastBookingRefreshAt = 0
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Nothing to clear.
  }
}

/* ---- response plumbing ---------------------------------------------- */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function respond(config, status, data) {
  return {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
    request: { mock: true },
  }
}

function fail(config, status, data) {
  const response = respond(config, status, data)
  return Promise.reject(
    new AxiosError(
      `Request failed with status code ${status}`,
      status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      response.request,
      response,
    ),
  )
}

const notSignedIn = (config) => fail(config, 401, { error: 'Not signed in' })
const notFound = (config) => fail(config, 404, { error: 'Not Found' })

/* ---- event projections ---------------------------------------------- */

const published = () => EVENTS.filter((event) => event.status !== 'DRAFT')

/** Exactly the fields `/api/events/all` sends — nothing more. */
function toListEvent(event) {
  return {
    id: event.id,
    tiqrEventId: event.tiqrEventId,
    ticketId: event.ticketId,
    type: event.type,
    heading: event.heading,
    datetime: event.datetime,
    price: event.price,
    description: event.description,
    picture: event.picture,
    committee: event.committee,
    status: event.status,
    passcodeRequired: event.passcodeRequired,
    venue: event.venue ? { name: event.venue.name } : null,
  }
}

/** The list field set plus the five detail-only fields and the full venue. */
function toDetailEvent(event) {
  return {
    ...toListEvent(event),
    startTime: event.startTime,
    endTime: event.endTime,
    extraInfo: event.extraInfo,
    teamSize: event.teamSize,
    isTeamEvent: event.isTeamEvent,
    venueId: event.venueId,
    venue: event.venue,
  }
}

/**
 * The real query has no ORDER BY, so row order is undefined and can change
 * between calls. Returning them shuffled is the only honest mock — it means
 * any view that forgot to sort looks wrong immediately.
 */
function shuffled(list) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/* ---- profile writes -------------------------------------------------- */

const EDITABLE_FIELDS = [
  'name',
  'phone',
  'college',
  'district',
  'state',
  'semester',
  'branch',
  'year',
]

function readBody(data) {
  if (!data) return {}

  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const body = {}
    data.forEach((value, key) => {
      body[key] = value
    })
    return body
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }

  return data
}

function applyProfileUpdate(config, body) {
  if ('role' in body) {
    return fail(config, 403, { error: 'Role cannot be updated here' })
  }

  const updates = {}

  for (const field of EDITABLE_FIELDS) {
    if (!(field in body)) continue

    const value = body[field]
    if (typeof value === 'string' && value.trim() === '') {
      return fail(config, 400, { error: `${field} cannot be empty` })
    }

    if (field === 'semester' || field === 'year') {
      const parsed = Number(value)
      const max = field === 'semester' ? 10 : 5
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
        return fail(config, 400, {
          error: [{ message: `${field} must be between 1 and ${max}`, path: [field] }],
        })
      }
      updates[field] = parsed
      continue
    }

    if (field === 'phone') {
      const digits = String(value).replace(/[^\d]/g, '').replace(/^(91|0)/, '')
      if (digits.length < 10 || digits.length > 15) {
        return fail(config, 400, {
          error: [{ message: 'Enter a valid phone number', path: ['phone'] }],
        })
      }
      // Stored as digits only, so what you read back may differ from what you sent.
      updates.phone = digits
      continue
    }

    if (field === 'name') {
      const cleaned = String(value).replace(/[<>]/g, '').trim().replace(/\s+/g, ' ')
      if (cleaned.length < 1 || cleaned.length > 50) {
        return fail(config, 400, {
          error: [{ message: 'Name must be 1-50 characters', path: ['name'] }],
        })
      }
      updates.name = cleaned
      continue
    }

    updates[field] = value
  }

  const hasImage = 'image' in body && body.image
  if (Object.keys(updates).length === 0 && !hasImage) {
    return fail(config, 400, { error: 'No valid fields to update' })
  }

  if (hasImage) {
    const size = body.image?.size
    if (typeof size === 'number' && size > 400 * 1024) {
      return fail(config, 413, { error: 'Image too large' })
    }
    currentUser.picture = 'https://cdn.tathva.org/profile/mock-avatar.webp'
  }

  currentUser = { ...currentUser, ...updates }

  return respond(config, 200, {
    message: 'User updated successfully',
    user: { ...currentUser, refCode: currentUser.referralCode },
  })
}

/* ---- booking --------------------------------------------------------- */

function createBooking(config, body) {
  if (!signedIn()) return notSignedIn(config)

  const event = EVENTS.find((item) => item.id === Number(body.eventId))

  if (!event || event.status === 'DRAFT') {
    return fail(config, 404, { error: 'Event not found' })
  }
  if (event.status !== 'OPEN') {
    return fail(config, 400, { error: 'Event is not open for booking' })
  }
  if (!currentUser.phone) {
    return fail(config, 400, {
      message: 'Add a phone number to your profile before booking',
    })
  }
  if (event.passcodeRequired && !body.passcode) {
    return fail(config, 403, { error: 'Passcode required', code: 'PASSCODE_REQUIRED' })
  }
  if (event.passcodeRequired && body.passcode !== MOCK_PASSCODE) {
    return fail(config, 403, { error: 'Invalid passcode', code: 'PASSCODE_INVALID' })
  }
  if (!event.ticketId) {
    return fail(config, 409, { error: 'Event is not linked to a TIQR ticket' })
  }

  // Checked last, because on the real backend it costs a TIQR round trip.
  const alreadyConfirmed = BOOKINGS.some(
    (booking) =>
      booking.ticket?.event === event.tiqrEventId &&
      String(booking.status).toUpperCase() === 'CONFIRMED',
  )
  if (alreadyConfirmed) {
    return fail(config, 400, { error: 'You have already registered for this event' })
  }

  // Stands in for TIQR's hosted payment page: it lands back on the real
  // return route so the post-payment screen can be exercised end to end.
  return respond(config, 201, {
    message: 'Booking created',
    redir_url: `/events/${event.id}?status=CHARGED&signature=mock-signature`,
  })
}

function myBookings(config, wantsRefresh) {
  if (!signedIn()) return notSignedIn(config)

  const now = Date.now()
  const sinceLast = now - lastBookingRefreshAt
  const debounceMs = 10_000

  let refreshed = false
  if (wantsRefresh && sinceLast >= debounceMs) {
    refreshed = true
    lastBookingRefreshAt = now
  }

  const refreshableInMs = refreshed
    ? debounceMs
    : Math.max(0, debounceMs - sinceLast)

  return respond(config, 200, {
    bookings: BOOKINGS,
    count: BOOKINGS.length,
    cachedAt: lastBookingRefreshAt || now,
    refreshed,
    refreshableInMs,
  })
}

/* ---- the adapter ----------------------------------------------------- */

export async function mockAdapter(config) {
  await wait(LATENCY_MS)

  const method = String(config.method || 'get').toLowerCase()
  const base = config.baseURL || 'http://localhost:8000'
  const url = new URL(config.url || '/', base)
  const path = url.pathname
  const params = new URLSearchParams(url.search)

  // axios keeps `params` separate from the url string.
  if (config.params && typeof config.params === 'object') {
    for (const [key, value] of Object.entries(config.params)) {
      if (value !== undefined && value !== null) params.set(key, String(value))
    }
  }

  const body = readBody(config.data)

  /* public reads */

  if (method === 'get' && path === '/api/events/all') {
    const type = params.get('type')
    const events = published()
      .filter((event) => !type || event.type === type)
      .map(toListEvent)
    return respond(config, 200, { events: shuffled(events) })
  }

  if (method === 'get' && path.startsWith('/api/events/details/')) {
    const raw = path.slice('/api/events/details/'.length)
    if (!/^\d+$/.test(raw)) {
      return fail(config, 400, { error: 'Invalid event id' })
    }
    const event = published().find((item) => item.id === Number(raw))
    if (!event) return notFound(config)
    return respond(config, 200, { event: toDetailEvent(event) })
  }

  if (method === 'get' && path === '/api/venue/') {
    return respond(config, 200, { venues: VENUE_LIST })
  }

  if (method === 'get' && path === '/api/seat_count/') {
    return respond(config, 200, { count: SEAT_COUNT })
  }

  if (method === 'post' && path === '/api/contact/create') {
    const required = ['topic', 'name', 'email', 'phone', 'query']
    const missing = required.filter((field) => !String(body[field] ?? '').trim())
    if (missing.length) {
      return fail(config, 400, { message: 'All fields are required' })
    }
    return respond(config, 201, {
      message: 'Query submitted successfully',
      contact: { id: 1, status: 'NEW', createdAt: new Date().toISOString(), ...body },
    })
  }

  if (method === 'get' && path === '/healthz') {
    return respond(config, 200, { ok: true, checks: { db: 'up', redis: 'disabled' } })
  }

  /* session reads and writes */

  if (path === '/api/user/') {
    if (!signedIn()) return notSignedIn(config)
    if (method === 'get') return respond(config, 200, { ...currentUser })
    if (method === 'put') return applyProfileUpdate(config, body)
  }

  if (method === 'post' && path === '/api/booking/create') {
    return createBooking(config, body)
  }

  if (method === 'get' && path === '/api/booking/my') {
    const refresh = params.get('refresh')
    return myBookings(config, refresh === '1' || refresh === 'true')
  }

  if (method === 'get' && path === '/api/referrals') {
    if (!signedIn()) return notSignedIn(config)
    if (currentUser.role !== 'CA') {
      return fail(config, 403, { error: 'Forbidden' })
    }
    return respond(config, 200, REFERRALS)
  }

  if (method === 'get' && path === '/api/referrals/code') {
    if (!signedIn()) return notSignedIn(config)
    if (currentUser.role !== 'CA') {
      return fail(config, 403, { error: 'Forbidden' })
    }
    return respond(config, 200, { referralCode: REFERRALS.referralCode })
  }

  /* routers that are not mounted on the real backend */

  if (path === '/api/announcements' || path.startsWith('/api/tiqr-events')) {
    return notFound(config)
  }

  /* better-auth's own routes. The real client talks to these with its own
     fetch, not through axios, so mock mode bypasses it entirely — these exist
     only so a session probe through `api` answers consistently. */

  if (path === '/api/auth/ok') {
    return respond(config, 200, { ok: true })
  }

  if (path === '/api/auth/get-session') {
    // better-auth answers 200 with a null body when there is no session.
    return respond(config, 200, signedIn() ? { user: { ...currentUser } } : null)
  }

  if (path === '/api/auth/sign-out') {
    setMockSignedIn(false)
    return respond(config, 200, { success: true })
  }

  return notFound(config)
}
