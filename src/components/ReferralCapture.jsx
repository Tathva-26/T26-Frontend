'use client'

import { useEffect } from 'react'
import { captureReferralCode } from '@/lib/referral'

/**
 * A campus ambassador's link can land on any page, so the code is captured
 * wherever it arrives and kept until a booking is made. It has to survive the
 * walk to whichever event gets booked and the Google sign-in round trip in
 * between, which is why it is stored rather than read from the URL at
 * checkout.
 *
 * Mounted once in the root layout. A CA link is always a fresh page load, so
 * capturing on mount is enough and avoids making the whole layout depend on
 * a search-params subscription.
 */
export default function ReferralCapture() {
  useEffect(() => {
    captureReferralCode()
  }, [])

  return null
}
