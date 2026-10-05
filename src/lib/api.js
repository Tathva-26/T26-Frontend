/**
 * The single place this app configures a network request.
 *
 * Nothing else should create an axios instance or call `fetch` against the
 * backend directly. The session is an httpOnly cookie the browser attaches
 * itself, so there is no Authorization header and no token is ever held in JS,
 * storage or a URL — which is why `withCredentials` is non-negotiable here.
 */

import axios from 'axios'
import { mockAdapter } from './mock/index.js'

/* ---- configuration -------------------------------------------------- */

const RAW_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API || // legacy alias, read only if the above is unset
  'http://localhost:8000'

/** Backend origin, trailing slashes stripped so path joins stay predictable. */
export const API_ORIGIN = RAW_ORIGIN.replace(/\/+$/, '')

/** `"false"` renders a "coming soon" state everywhere instead of calling the API. */
export const BACKEND_ENABLED = process.env.NEXT_PUBLIC_BACKEND_ENABLED !== 'false'

/** `"true"` answers every request from `src/lib/mock/` with no network at all. */
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

/** The `Event.type` an admin puts on pass events. The passes UI queries exactly this. */
export const PASS_EVENT_TYPE = process.env.NEXT_PUBLIC_PASS_EVENT_TYPE || 'passes'

/** When set, sent as `additionalData: { role }` on sign-in (CA-role deployments). */
export const OAUTH_ROLE = process.env.NEXT_PUBLIC_OAUTH_ROLE || null

/**
 * Exact paths as sent. Trailing slashes are part of the contract —
 * `/api/user/` has one, `/api/events/all` does not.
 */
export const PATHS = {
  user: '/api/user/',
  eventsAll: '/api/events/all',
  eventDetails: (id) => `/api/events/details/${id}`,
  bookingCreate: '/api/booking/create',
  bookingMy: '/api/booking/my',
  contactCreate: '/api/contact/create',
  referrals: '/api/referrals',
  referralCode: '/api/referrals/code',
  announcements: '/api/announcements',
  venues: '/api/venue/',
  seatCount: '/api/seat_count/',
  accommodationOptions: '/api/accommodation/options',
  accommodationBook: '/api/accommodation/book',
  // Food coupons are their own TIQR event with their own checkout.
  foodOptions: '/api/food/options',
  foodBook: '/api/food/book',
  healthz: '/healthz',
}

/* ---- the instance --------------------------------------------------- */

export const api = axios.create({
  baseURL: API_ORIGIN,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

if (USE_MOCK_DATA) {
  api.defaults.adapter = mockAdapter
}

/* ---- 401 handling --------------------------------------------------- */

let unauthorizedHandler = null

/**
 * Register the one handler every 401 routes to (UserContext owns it).
 *
 * A signed-out visitor's first `GET /api/user/` also 401s, so the handler is
 * responsible for staying quiet unless it was already holding a profile —
 * telling someone who never signed in that their session expired is worse
 * than saying nothing. Sessions last 3 days with no refresh, so they do
 * expire mid-visit.
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && unauthorizedHandler) {
      try {
        unauthorizedHandler(error)
      } catch {
        // A failure in the sign-out handler must not replace the original error.
      }
    }
    return Promise.reject(error)
  },
)

/* ---- error normalisation -------------------------------------------- */

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

/**
 * Three error shapes are in use and the route's age decides which arrives,
 * so every caller goes through here rather than reading `data.message`:
 *
 *   { message: "No phone number" }                       older routes
 *   { error: "Booking rejected" }                        newer routes
 *   { error: [{ message, path }] }                       Zod — an ARRAY, not a string
 */
export function apiErrorMessage(error, fallback = FALLBACK_MESSAGE) {
  const body = error?.response?.data

  if (typeof body === 'string') return body.trim() || fallback

  if (body && typeof body === 'object') {
    if (Array.isArray(body.error)) {
      const issue = body.error.find((item) => item && typeof item.message === 'string')
      if (issue) return issue.message
    }
    if (typeof body.error === 'string' && body.error.trim()) return body.error
    if (typeof body.message === 'string' && body.message.trim()) return body.message
  }

  // A request that never reached the server at all — offline, DNS failure, a
  // refused connection, a timeout, or an origin the backend does not allow.
  // axios describes these as "Network Error" or "timeout of 0ms exceeded",
  // which say nothing useful to a user, so the caller's sentence is better.
  // The original error is still on hand for the console.
  return fallback
}

/** HTTP status, or `null` when the request never got a response. */
export function apiErrorStatus(error) {
  return error?.response?.status ?? null
}

/**
 * The machine-readable `code`, where a route bothers to send one.
 * Today that is `PASSCODE_REQUIRED`, `PASSCODE_INVALID` and the admin 409s.
 */
export function apiErrorCode(error) {
  const code = error?.response?.data?.code
  return typeof code === 'string' ? code : null
}

/**
 * Zod field errors as `{ field: message }`, for forms. Empty object when the
 * failure was not a validation array.
 */
export function apiFieldErrors(error) {
  const issues = error?.response?.data?.error
  if (!Array.isArray(issues)) return {}

  return issues.reduce((fields, issue) => {
    const key = Array.isArray(issue?.path) ? issue.path[0] : undefined
    if (typeof key === 'string' && key && !fields[key] && issue?.message) {
      fields[key] = issue.message
    }
    return fields
  }, {})
}
