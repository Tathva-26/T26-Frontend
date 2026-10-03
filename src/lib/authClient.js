'use client'

/**
 * Google sign-in, through better-auth's own routes under `/api/auth/*`.
 *
 * The backend owns the session: it is an httpOnly cookie, set during the
 * OAuth round trip, that browser JS cannot read. So there is nothing to store
 * here and no token to attach — signing in is a navigation, and knowing who
 * is signed in means asking `GET /api/user/`.
 */

import { createAuthClient } from 'better-auth/react'
import { API_ORIGIN, OAUTH_ROLE, USE_MOCK_DATA } from './api.js'
import { setMockSignedIn } from './mock/index.js'

/** Where Google returns the browser. Both success and failure land here. */
export const CALLBACK_PATH = '/auth/google/callback'

export const authClient = createAuthClient({ baseURL: API_ORIGIN })

function absoluteCallback() {
  return `${window.location.origin}${CALLBACK_PATH}`
}

/**
 * Starts the OAuth round trip. On success better-auth answers with a Google
 * URL and its redirect plugin navigates there, so this does not return in the
 * normal case.
 *
 * `callbackURL` and `errorCallbackURL` are both sent explicitly, always. If
 * `callbackURL` is omitted, better-auth falls back to the API's own origin,
 * and an OAuth failure then redirects to `{apiOrigin}/error`, which answers
 * with a relative redirect to `/?error=…`. The visitor ends up reading
 * "Welcome to the Tathva API" with no way back to the site.
 *
 * Returns an error message to display, or null when the redirect is underway.
 */
export async function signInWithGoogle() {
  const callbackURL = absoluteCallback()

  // OAuth cannot be mocked: there is no Google and no cookie to set. Jump
  // straight to the callback so everything after sign-in runs as it will in
  // production.
  if (USE_MOCK_DATA) {
    setMockSignedIn(true)
    window.location.href = callbackURL
    return null
  }

  const { data, error } = await authClient.signIn.social({
    provider: 'google',
    callbackURL,
    errorCallbackURL: callbackURL,
    // Only for CA-role deployments. The backend reads it in an after-hook and
    // creates the user as CA, or upgrades an existing USER — on every login,
    // not just the first.
    ...(OAUTH_ROLE ? { additionalData: { role: OAUTH_ROLE } } : {}),
  })

  if (error) {
    // The frontend origin has to be in better-auth's `trustedOrigins`, which
    // is a separate list from the API's CORS `ALLOWED_ORIGINS`. Without it the
    // sign-in POST is refused outright and no redirect ever happens.
    if (error.code === 'INVALID_CALLBACK_URL' || error.status === 403) {
      return `This site (${window.location.origin}) is not an allowed sign-in origin yet.`
    }
    return error.message || 'Could not start Google sign-in. Please try again.'
  }

  // The redirect plugin normally handles this; covered in case it did not.
  if (data?.url) {
    window.location.href = data.url
    return null
  }

  return 'Google sign-in did not return a redirect. Please try again.'
}

/**
 * Ends the session server-side, then does a full page load so no component
 * is left holding a profile that no longer exists.
 */
export async function signOutOfTathva(returnTo = '/') {
  if (USE_MOCK_DATA) {
    setMockSignedIn(false)
    window.location.href = returnTo
    return
  }

  try {
    await authClient.signOut()
  } catch {
    // The cookie may already be gone. Leaving anyway is the right outcome.
  } finally {
    window.location.href = returnTo
  }
}
