/**
 * Display helpers for values the API sends in a form the UI cannot render
 * directly: money in integer paise, instants in ISO 8601, venues as objects.
 *
 * Every date here is formatted in `Asia/Kolkata` explicitly, with `en-IN`.
 * That is not cosmetic — it is what keeps the server-rendered string and the
 * client-rendered string identical regardless of where either one runs.
 */

const TIME_ZONE = 'Asia/Kolkata'
const LOCALE = 'en-IN'

/* ---- money ----------------------------------------------------------- */

/**
 * Paise to rupees as a number, for arithmetic (fee maths, totals).
 * `null` in, `null` out — a missing price is not zero.
 */
export function toRupees(paise) {
  if (typeof paise !== 'number' || Number.isNaN(paise)) return null
  return paise / 100
}

/**
 * Paise to a display string. A 250 rupee workshop arrives as `25000`.
 *
 *   0     → "Free"
 *   null  → "TBA"
 *   25000 → "₹250"
 *   25050 → "₹250.50"
 */
export function formatPrice(paise) {
  if (paise === 0) return 'Free'

  const rupees = toRupees(paise)
  if (rupees === null) return 'TBA'

  const hasPaise = paise % 100 !== 0
  return `₹${rupees.toLocaleString(LOCALE, {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  })}`
}

/* ---- dates ----------------------------------------------------------- */

function toDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parts(date, options) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).format(date)
}

/**
 * The pieces the event cards render separately, in IST.
 * Returns `null` for a missing or unparseable timestamp so callers can
 * decide what to show rather than printing "Invalid Date".
 */
export function eventDateParts(iso) {
  const date = toDate(iso)
  if (!date) return null

  return {
    day: parts(date, { day: '2-digit' }),
    month: parts(date, { month: 'short' }).toUpperCase(),
    year: parts(date, { year: 'numeric' }),
    weekday: parts(date, { weekday: 'short' }).toUpperCase(),
    full: parts(date, { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

function formatClock(date) {
  // en-IN renders "10:00 am"; the cards use upper case.
  return parts(date, { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()
}

/**
 * "10:00 AM - 1:00 PM IST" from startTime/endTime, falling back to the
 * single `datetime` when the event has no explicit window.
 */
export function formatTimeRange(startIso, endIso, fallbackIso) {
  const start = toDate(startIso) || toDate(fallbackIso)
  if (!start) return null

  const end = toDate(endIso)
  if (!end || end <= start) return `${formatClock(start)} IST`

  return `${formatClock(start)} - ${formatClock(end)} IST`
}

/** "6 Hours", "1 Hour 30 Minutes", "45 Minutes". `null` without both ends. */
export function formatDuration(startIso, endIso) {
  const start = toDate(startIso)
  const end = toDate(endIso)
  if (!start || !end || end <= start) return null

  const totalMinutes = Math.round((end - start) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  const chunks = []
  if (hours) chunks.push(`${hours} ${hours === 1 ? 'Hour' : 'Hours'}`)
  if (minutes) chunks.push(`${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`)

  return chunks.join(' ') || null
}

/** "19 Sep 2026, 12:00 PM" — for booking rows and announcements. */
export function formatDateTime(iso) {
  const date = toDate(iso)
  if (!date) return null

  return parts(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/* ---- venue ----------------------------------------------------------- */

/**
 * `venue` is an object — `{ id, name, location }` on the detail route and
 * `{ name }` on the list route. Interpolating it straight into text renders
 * "[object Object]", so the name is pulled out once at the boundary.
 */
export function venueName(venue) {
  if (!venue) return null
  if (typeof venue === 'string') return venue.trim() || null
  if (typeof venue.name === 'string') return venue.name.trim() || null
  return null
}

/** "Main Auditorium - Near Gate 3" when the full object is available. */
export function venueLabel(venue) {
  const name = venueName(venue)
  if (!name) return null

  const location =
    venue && typeof venue.location === 'string' ? venue.location.trim() : ''

  return location ? `${name} - ${location}` : name
}
