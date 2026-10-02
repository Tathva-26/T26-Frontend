'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from '@/context/UserContext'

/**
 * better-auth's own error values, arriving as `?error=`. Anything not listed
 * falls back to `?error_description=`, then to a generic message.
 */
const OAUTH_ERRORS = {
  access_denied: 'Google sign-in was cancelled.',
  state_not_found: 'Sign-in expired before it finished. Please try again.',
  state_mismatch: 'Sign-in expired before it finished. Please try again.',
  email_not_found: 'Google did not share an email address with us.',
  unable_to_get_user_info: 'Could not read your Google profile.',

  // Not an OAuth code: the backend's CA kill switch. When CA registrations
  // are closed it deletes the session cookie it just set and appends this to
  // the error callback, so it only ever appears as a query parameter.
  CA_REGISTRATIONS_CLOSED:
    'Campus ambassador registrations are closed. Sign in normally instead.',
}

export default function AuthCallback() {
  const router = useRouter()
  const params = useSearchParams()
  const { status, isSignedIn } = useUser()

  const code = params.get('error')
  const description = params.get('error_description')

  const failure = code
    ? OAUTH_ERRORS[code] || description || 'Google sign-in could not be completed.'
    : null

  useEffect(() => {
    if (failure || !isSignedIn) return
    router.replace('/profile')
  }, [failure, isSignedIn, router])

  if (failure) {
    return (
      <Shell title="Sign-in failed" detail={failure}>
        <Link href="/" className="underline hover:no-underline">
          Back to Tathva
        </Link>
      </Shell>
    )
  }

  if (status === 'loading') {
    return <Shell title="Signing you in" detail="One moment." />
  }

  // The cookie is set during the OAuth round trip, so arriving here without a
  // session means it did not complete — a third-party cookie block will do
  // this, and so will a session that was refused.
  if (!isSignedIn) {
    return (
      <Shell
        title="Sign-in did not complete"
        detail="We could not confirm your session. Please try signing in again."
      >
        <Link href="/" className="underline hover:no-underline">
          Back to Tathva
        </Link>
      </Shell>
    )
  }

  return <Shell title="Signed in" detail="Taking you to your profile." />
}

function Shell({ title, detail, children }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#06070d] px-6 text-center text-slate-100">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-slate-400">{detail}</p>
      {children && <div className="mt-2 text-sm text-indigo-400">{children}</div>}
    </main>
  )
}
