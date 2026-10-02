/**
 * What a booking failure means, and what the UI should do about it.
 *
 * Every status below is a different thing to tell the buyer, so collapsing
 * them into one "booking failed" loses real information — including whether
 * trying again could possibly work.
 *
 * Two of these are matched on PROSE, because the backend does not send a
 * machine-readable code for them: the missing-phone 400 and the referral
 * rejection. Rewording either string on the server silently disables the only
 * explanation the buyer gets. The passcode cases do send a `code`, and those
 * are the robust ones; extending that pattern is an open ask on the backend.
 */

export const BOOKING_ACTION = {
  NONE: 'none',
  SIGN_IN: 'signIn',
  COMPLETE_PROFILE: 'completeProfile',
  PASSCODE: 'passcode',
}

const GENERIC = 'This booking could not be completed. Please try again.'

/**
 * Takes the parts of a response rather than an error object, so it can be
 * reasoned about directly.
 *
 * Returns:
 *   message        what to show the buyer
 *   action         what the UI should offer next
 *   retryable      whether pressing the button again could succeed
 *   clearReferral  whether the stored referral code caused this
 *   needsPasscode  whether to reveal the passcode field
 */
export function classifyBookingFailure({ status = null, code = null, message = '' } = {}) {
  const text = String(message ?? '')
  const says = (pattern) => pattern.test(text)

  const base = {
    action: BOOKING_ACTION.NONE,
    retryable: false,
    clearReferral: false,
    needsPasscode: false,
  }

  // The passcode cases are the only ones with a machine-readable code.
  if (code === 'PASSCODE_REQUIRED') {
    return {
      ...base,
      message: 'This event needs a passcode. Enter it to book.',
      action: BOOKING_ACTION.PASSCODE,
      needsPasscode: true,
      retryable: true,
    }
  }

  if (code === 'PASSCODE_INVALID') {
    return {
      ...base,
      message: 'That passcode is not right.',
      action: BOOKING_ACTION.PASSCODE,
      needsPasscode: true,
      retryable: true,
    }
  }

  if (status === 401) {
    return { ...base, message: 'Please sign in again to book.', action: BOOKING_ACTION.SIGN_IN }
  }

  if (status === 400) {
    // Matched on prose: there is no code for this one.
    if (says(/phone\s*number/i)) {
      return {
        ...base,
        message: 'Add a phone number to your profile before booking.',
        action: BOOKING_ACTION.COMPLETE_PROFILE,
      }
    }

    if (says(/already\s+registered|already\s+booked/i)) {
      return { ...base, message: 'You have already booked this event.' }
    }

    // TIQR refused the referral code. Clearing it means the retry is not
    // refused for the same reason, rather than leaving the buyer stuck.
    if (says(/booking\s+rejected/i)) {
      return {
        ...base,
        message: 'That referral code was refused. Trying again without it.',
        clearReferral: true,
        retryable: true,
      }
    }

    if (says(/not\s+open\s+for\s+booking/i)) {
      return { ...base, message: 'Booking is not open for this event.' }
    }

    return { ...base, message: text || GENERIC }
  }

  if (status === 403) {
    // A cross-origin write from an unlisted origin is refused by our own
    // backend with exactly this body, which is indistinguishable in the UI
    // from a real rejection. Worth saying plainly rather than guessing.
    if (/^forbidden$/i.test(text.trim())) {
      return { ...base, message: 'This booking was refused. Please try again later.' }
    }
    return { ...base, message: text || 'This booking was refused.' }
  }

  if (status === 404) {
    return { ...base, message: 'This event could not be found.' }
  }

  // Published here, but the push to TIQR never completed, so no ticket
  // exists to sell. Not the buyer's fault and not retryable.
  if (status === 409) {
    return { ...base, message: 'This event is not open for booking yet.' }
  }

  if (status === 502) {
    return {
      ...base,
      message: 'The payment provider is unavailable. Please try again in a moment.',
      retryable: true,
    }
  }

  // No status at all: the request never reached the server.
  if (status === null) {
    return {
      ...base,
      message: 'Could not reach the booking service. Check your connection and try again.',
      retryable: true,
    }
  }

  return { ...base, message: text || GENERIC, retryable: true }
}

/**
 * Whether a booking can even be attempted, checked before the button is
 * offered rather than letting the refusal arrive after an event is chosen.
 */
export function bookingBlocker(event, user) {
  if (!event) return { blocked: true, reason: 'missing', message: 'This event is unavailable.' }

  if (event.status === 'CLOSED') {
    return { blocked: true, reason: 'closed', message: 'Booking closed' }
  }

  // OPEN locally but never synced to TIQR, so there is no ticket to sell.
  if (!event.bookable) {
    return { blocked: true, reason: 'unsynced', message: 'Not open for booking yet' }
  }

  if (!user) {
    return { blocked: true, reason: 'signIn', message: 'Sign in to book' }
  }

  if (!user.phone) {
    return { blocked: true, reason: 'phone', message: 'Add a phone number to book' }
  }

  return { blocked: false, reason: null, message: null }
}

/**
 * The request body. `eventId` is OUR `Event.id`, never `tiqrEventId` — the id
 * spaces overlap, so the wrong one does not error, it books the wrong thing
 * or 404s.
 *
 * Keys are omitted rather than sent empty: an empty passcode would read as a
 * wrong passcode, and an empty referral code is not a code.
 */
export function buildBookingBody({ eventId, quantity = 1, passcode = '', referralCode = null }) {
  const body = { eventId, quantity }

  const trimmedPasscode = String(passcode ?? '').trim()
  if (trimmedPasscode) body.passcode = trimmedPasscode

  // An empty field beats a remembered code: someone who cleared it wants no
  // attribution.
  if (referralCode) body.referralCode = referralCode

  return body
}

/* ---- coming back from payment ------------------------------------------ */

/**
 * Nothing about a payment reaches this app directly. The backend stores no
 * booking and there is no webhook, so after the redirect back the only way to
 * learn what happened is to ask `GET /api/booking/my?refresh=1` until the
 * booking shows up.
 */
export const MAX_CONFIRMATION_ATTEMPTS = 6

/**
 * How long to wait before asking again.
 *
 * A live read is debounced to ten seconds server-side, and the response says
 * how long is left. Waiting that long plus a margin means the next attempt
 * actually reaches TIQR; a tighter loop just collects cache hits. The two
 * second floor covers a response that omits the number entirely.
 */
export function confirmationDelay(refreshableInMs) {
  const reported = Number(refreshableInMs)
  const wait = Number.isFinite(reported) && reported > 0 ? reported + 250 : 0
  return Math.max(2000, wait)
}

/**
 * What to show after a payment redirect.
 *
 * `chargeStatus` is TIQR's `status` query parameter. It is a HINT ONLY: there
 * is no secret on this side to verify the accompanying signature with, so it
 * can never be the basis for telling someone their payment succeeded. Only a
 * booking actually read back from TIQR can do that.
 *
 *   confirmed   TIQR has a confirmed booking
 *   pending     TIQR has the booking but has not confirmed it
 *   processing  still asking
 *   charged     the query says charged, but nothing has reached TIQR yet
 *   missing     no booking, and no claim of a charge either
 */
export function paymentOutcome({ booking, chargeStatus = null, attemptsLeft = 0 } = {}) {
  const status = String(booking?.status ?? '').toUpperCase()

  if (status === 'CONFIRMED') return 'confirmed'
  if (booking) return 'pending'
  if (attemptsLeft > 0) return 'processing'

  return String(chargeStatus ?? '').toUpperCase() === 'CHARGED' ? 'charged' : 'missing'
}
