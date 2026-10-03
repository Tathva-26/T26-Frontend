'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SignupPage from '@/pageComponents/Login/Login'
import { useUser } from '@/context/UserContext'

export default function LoginPage() {
  const router = useRouter()
  const { isSignedIn, isLoading, message, signIn } = useUser()
  const [starting, setStarting] = useState(false)

  // Already holding a session — there is nothing to do here.
  useEffect(() => {
    if (!isLoading && isSignedIn) router.replace('/profile')
  }, [isLoading, isSignedIn, router])

  const begin = async () => {
    if (starting) return
    setStarting(true)
    try {
      // Success navigates away to Google, so settling means failure —
      // the message is already in context state for display.
      await signIn()
    } finally {
      setStarting(false)
    }
  }

  return <SignupPage onGoogleSignup={begin} loading={starting} message={message} />
}
