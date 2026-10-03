/**
 * The session state machine, kept separate from the provider so it can be
 * reasoned about and tested without React.
 *
 * Three states: `loading` while `GET /api/user/` is in flight, `signedIn`
 * once a profile came back, `signedOut` otherwise. There is no fourth state
 * for "has a cookie but no profile" — the cookie is httpOnly, so its presence
 * is never observable here.
 */

export const SESSION_EXPIRED = 'Your session expired. Please sign in again.'

export const SIGNED_OUT = { status: 'signedOut', user: null, message: null }

export const LOADING = { status: 'loading', user: null, message: null }

/**
 * Applies a 401 from anywhere in the app.
 *
 * The expiry message is only for someone who was holding a profile. A
 * signed-out visitor's very first `GET /api/user/` also answers 401, and
 * telling them their session expired would be untrue as well as confusing.
 *
 * A 401 while already signed out changes nothing, so any message already on
 * screen is left alone.
 */
export function applyUnauthorized(previous) {
  if (previous.status === 'signedIn') {
    return { status: 'signedOut', user: null, message: SESSION_EXPIRED }
  }

  if (previous.status === 'loading') {
    return SIGNED_OUT
  }

  return previous
}

/**
 * Applies the 401 that ends the initial profile load. The interceptor has
 * usually run first, so a message it set is preserved rather than wiped.
 */
export function applySignedOut(previous) {
  return previous.message ? { ...SIGNED_OUT, message: previous.message } : SIGNED_OUT
}

/** The fields the backend requires before it treats a profile as complete. */
export const REQUIRED_PROFILE_FIELDS = [
  'phone',
  'college',
  'district',
  'state',
  'branch',
  'semester',
  'year',
]

export function isProfileComplete(user) {
  if (!user) return false

  return REQUIRED_PROFILE_FIELDS.every((field) => {
    const value = user[field]
    return value !== null && value !== undefined && value !== ''
  })
}
