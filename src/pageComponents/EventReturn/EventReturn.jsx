'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PATHS, api, apiErrorMessage } from '@/lib/api'
import {
  MAX_CONFIRMATION_ATTEMPTS,
  confirmationDelay,
  paymentOutcome,
} from '@/lib/booking'
import { latestForEvent, normaliseBooking, byTiqrId } from '@/lib/bookings'
import { useEventDetails } from '@/hooks/useEventDetails'
import { useUser } from '@/context/UserContext'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Where TIQR returns the buyer after payment.
 *
 * The backend hands TIQR `{FRONTEND_URL}/events/{event.id}` as the callback,
 * keyed on OUR event id. That shape is load-bearing: change it and a
 * successful payment lands on a 404 where the buyer cannot tell whether they
 * were charged.
 *
 * Nothing about the payment reaches this app directly — no webhook, and the
 * backend stores no booking — so the only way to find out what happened is to
 * ask TIQR, through `GET /api/booking/my?refresh=1`, until the booking
 * appears or the attempts run out.
 */
export default function EventReturn({ eventId }) {
  const params = useSearchParams()
  const { isSignedIn, isLoading: sessionLoading } = useUser()
  const { event, loading: eventLoading, notFound: eventMissing } = useEventDetails(eventId)

  const [poll, setPoll] = useState({
    booking: null,
    attemptsLeft: MAX_CONFIRMATION_ATTEMPTS,
    error: null,
  })

  /*
   * TIQR's own view of what happened, as query parameters. This is a HINT
   * ONLY: the signature cannot be verified here, because this side holds no
   * secret to verify it with. It is never the basis for telling someone their
   * payment succeeded — only a booking read back from TIQR does that.
   */
  const chargeStatus = params.get('status')

  const tiqrEventId = event?.tiqrEventId ?? null

  useEffect(() => {
    if (!isSignedIn || tiqrEventId === null) return undefined

    let cancelled = false

    const run = async () => {
      /*
       * Only a read that actually reached the provider counts against the
       * attempt budget. `?refresh=1` is debounced server-side, and a call
       * that lands inside the window is answered from cache — it says
       * nothing new, so spending one of six attempts on it would mean giving
       * up early on someone who has just paid. `refreshed` reports which
       * happened. The loop ceiling bounds the total either way.
       */
      let fresh = 0
      let loops = 0

      while (fresh < MAX_CONFIRMATION_ATTEMPTS && loops < MAX_CONFIRMATION_ATTEMPTS * 2) {
        loops += 1

        let response
        try {
          response = await api.get(PATHS.bookingMy, { params: { refresh: 1 } })
        } catch (error) {
          if (cancelled) return
          setPoll((previous) => ({
            ...previous,
            attemptsLeft: 0,
            error: apiErrorMessage(error, 'Could not check your booking.'),
          }))
          return
        }

        if (cancelled) return

        const data = response.data ?? {}
        if (data.refreshed) fresh += 1

        const raw = latestForEvent(data.bookings, tiqrEventId)
        const booking = raw ? normaliseBooking(raw, byTiqrId(event ? [event] : [])) : null

        const exhausted =
          fresh >= MAX_CONFIRMATION_ATTEMPTS || loops >= MAX_CONFIRMATION_ATTEMPTS * 2

        setPoll({
          booking,
          attemptsLeft: exhausted ? 0 : MAX_CONFIRMATION_ATTEMPTS - fresh,
          error: null,
        })

        if (booking?.status === 'CONFIRMED') return
        if (exhausted) return

        // Honour the server's own debounce window rather than guessing.
        await sleep(confirmationDelay(data.refreshableInMs))
        if (cancelled) return
      }
    }

    run()

    return () => {
      cancelled = true
    }
    // `event` is only read for the join; tiqrEventId is what drives the poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, tiqrEventId])

  if (sessionLoading || eventLoading) {
    return <Screen title="One moment" detail="Loading your booking." />
  }

  if (!isSignedIn) {
    return (
      <Screen
        title="Sign in to see this booking"
        detail="Your payment is not affected. Sign in and open your profile to check it."
      >
        <Link href="/profile" className="underline hover:no-underline">Go to your profile</Link>
      </Screen>
    )
  }

  /*
   * Without the event there is no tiqrEventId, and without that a booking
   * cannot be matched — so the poll can never run. Saying "confirming" here
   * would spin forever in front of someone who has just paid.
   */
  if (!event) {
    return (
      <Screen
        title={eventMissing ? 'We could not find that event' : 'Could not check your booking'}
        detail={
          chargeStatus?.toUpperCase() === 'CHARGED'
            ? 'If you were charged, the booking is safe and will appear on your profile. Do not pay again.'
            : 'Your bookings are listed on your profile.'
        }
      >
        <Link href="/profile" className="underline hover:no-underline">Go to your profile</Link>
      </Screen>
    )
  }

  if (poll.error) {
    return (
      <Screen title="Could not check your booking" detail={poll.error}>
        <p className="text-slate-400">
          If you were charged, the booking will still appear on your profile.
        </p>
        <Link href="/profile" className="underline hover:no-underline">Go to your profile</Link>
      </Screen>
    )
  }

  const outcome = paymentOutcome({
    booking: poll.booking,
    chargeStatus,
    attemptsLeft: poll.attemptsLeft,
  })

  const title = event?.fullTitle || 'this event'

  if (outcome === 'processing') {
    return (
      <Screen
        title="Confirming your booking"
        detail={`Checking with the payment provider for ${title}. This can take a few seconds.`}
      />
    )
  }

  if (outcome === 'confirmed') {
    return (
      <Screen title="You are booked" detail={`Your place at ${title} is confirmed.`}>
        {poll.booking?.reference && (
          <p className="font-mono text-slate-300">Reference {poll.booking.reference}</p>
        )}
        <Link href="/profile" className="underline hover:no-underline">See all your bookings</Link>
      </Screen>
    )
  }

  if (outcome === 'pending') {
    return (
      <Screen
        title="Payment received"
        detail={`Your booking for ${title} is not confirmed yet. This usually settles on its own.`}
      >
        <Link href="/profile" className="underline hover:no-underline">
          Check again on your profile
        </Link>
      </Screen>
    )
  }

  // The query claims a charge but nothing has reached TIQR. Saying "booking
  // failed" here would be wrong and alarming: the money may well have left.
  if (outcome === 'charged') {
    return (
      <Screen
        title="Payment went through"
        detail={`Your booking for ${title} has not reached the organiser yet. Do not pay again.`}
      >
        <p className="text-slate-400">
          It should appear on your profile shortly. If it does not, contact us with the time of
          payment.
        </p>
        <Link href="/profile" className="underline hover:no-underline">Go to your profile</Link>
      </Screen>
    )
  }

  return (
    <Screen
      title="No booking found"
      detail={`We could not find a booking for ${title}. If you did not complete payment, nothing was charged.`}
    >
      <Link href="/profile" className="underline hover:no-underline">Go to your profile</Link>
    </Screen>
  )
}

function Screen({ title, detail, children }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#06070d] px-6 text-center text-slate-100">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-md text-sm text-slate-400">{detail}</p>
      {children && (
        <div className="mt-2 flex flex-col items-center gap-2 text-sm text-indigo-400">
          {children}
        </div>
      )}
    </main>
  )
}
