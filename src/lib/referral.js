/**
 * Campus ambassador referral codes.
 *
 * A CA shares a link carrying the code, which can land on any page. The code
 * is kept so it survives the walk to whichever event gets booked and the
 * Google sign-in round trip in between, and is sent only when a booking is
 * created.
 *
 * TIQR issues and validates these, not us.
 */

const STORAGE_KEY = 'tathva-referral-code'

/** `?ref=` is also accepted: the CA site generated those for a while. */
const PARAM_NAMES = ['referral_code', 'ref']

function normalise(value) {
  const code = String(value ?? '').trim().toUpperCase()
  // Codes are short and alphanumeric; anything else is not one.
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : null
}

export function readReferralCode() {
  if (typeof window === 'undefined') return null
  try {
    return normalise(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function storeReferralCode(code) {
  const valid = normalise(code)
  if (typeof window === 'undefined' || !valid) return null
  try {
    window.localStorage.setItem(STORAGE_KEY, valid)
  } catch {
    // Private mode: the code is simply not remembered.
  }
  return valid
}

/**
 * Cleared after TIQR refuses a code, so the next attempt is not refused for
 * the same reason, and the buyer is not stuck unable to book at all.
 */
export function clearReferralCode() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}

/** Pulls a code out of a query string, if one is there. Pure. */
export function referralFromSearch(search) {
  const params = new URLSearchParams(String(search ?? '').replace(/^\?/, ''))
  for (const name of PARAM_NAMES) {
    const code = normalise(params.get(name))
    if (code) return code
  }
  return null
}

/** Captures and stores a code from the current URL. Returns it, or null. */
export function captureReferralCode(search) {
  const code = referralFromSearch(
    search ?? (typeof window === 'undefined' ? '' : window.location.search),
  )
  return code ? storeReferralCode(code) : null
}
