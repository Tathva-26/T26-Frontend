'use client'

/**
 * The one place that knows who is signed in.
 *
 * The session is an httpOnly cookie, so this cannot be answered locally —
 * there is nothing readable in JS to inspect. The only way to know is to ask
 * `GET /api/user/`, and a 401 is that question's ordinary "nobody" answer,
 * not a failure.
 *
 * Sessions last three days and are not refreshed, so they expire mid-visit.
 * Every 401 from anywhere in the app routes to the one handler here.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  BACKEND_ENABLED,
  PATHS,
  api,
  apiErrorMessage,
  apiErrorStatus,
  setUnauthorizedHandler,
} from '@/lib/api'
import { signInWithGoogle, signOutOfTathva } from '@/lib/authClient'
import {
  LOADING,
  SIGNED_OUT,
  applySignedOut,
  applyUnauthorized,
  isProfileComplete,
} from '@/lib/session'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [state, setState] = useState(() => (BACKEND_ENABLED ? LOADING : SIGNED_OUT))
  const [reloadToken, setReloadToken] = useState(0)

  /**
   * Every 401 in the app arrives here. The message is only shown to someone
   * who was actually holding a profile: a signed-out visitor's first
   * `GET /api/user/` also 401s, and telling them their session expired would
   * be both confusing and untrue.
   */
  useEffect(() => setUnauthorizedHandler(() => setState(applyUnauthorized)), [])

  useEffect(() => {
    if (!BACKEND_ENABLED) return undefined

    let active = true

    api
      .get(PATHS.user)
      .then((response) => {
        // Returned at the top level, with no { user } wrapper.
        if (active) setState({ status: 'signedIn', user: response.data, message: null })
      })
      .catch((error) => {
        if (!active) return

        // Expected and silent: this is what "not signed in" looks like.
        if (apiErrorStatus(error) === 401) {
          setState(applySignedOut)
          return
        }

        // Anything else means the profile is unavailable, which is not the
        // same as being signed out — so it is reported rather than swallowed.
        setState({
          status: 'signedOut',
          user: null,
          message: apiErrorMessage(error, 'Could not load your profile.'),
        })
      })

    return () => {
      active = false
    }
  }, [reloadToken])

  const refresh = useCallback(() => setReloadToken((token) => token + 1), [])

  const signIn = useCallback(async () => {
    const problem = await signInWithGoogle()
    if (problem) setState((previous) => ({ ...previous, message: problem }))
    return problem
  }, [])

  const signOut = useCallback((returnTo) => signOutOfTathva(returnTo), [])

  const dismissMessage = useCallback(
    () => setState((previous) => (previous.message ? { ...previous, message: null } : previous)),
    [],
  )

  const value = useMemo(() => {
    const { status, user, message } = state

    return {
      user,
      status,
      message,
      isLoading: status === 'loading',
      isSignedIn: status === 'signedIn',

      /** Booking is refused without a phone number, so this gates the UI. */
      hasPhone: Boolean(user?.phone),

      /** Mirrors the backend's own gate before a CA is issued a code. */
      isComplete: isProfileComplete(user),

      isCampusAmbassador: user?.role === 'CA',

      /** `picture` is null until an upload; the Google avatar stands in. */
      avatar: user?.picture || user?.image || null,

      refresh,
      signIn,
      signOut,
      dismissMessage,
    }
  }, [state, refresh, signIn, signOut, dismissMessage])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const value = useContext(UserContext)
  if (!value) {
    throw new Error('useUser must be used inside <UserProvider>')
  }
  return value
}
