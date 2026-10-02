'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BOOKING_ACTION, bookingBlocker } from '@/lib/booking'
import { feeBreakdown } from '@/lib/fees'
import { formatPrice } from '@/lib/format'
import { useUser } from '@/context/UserContext'
import { useCheckout } from '@/hooks/useCheckout'

/**
 * The booking control inside an event's detail modal.
 *
 * Bookability is checked before the button is offered, rather than letting
 * the backend's refusal arrive after the buyer has picked an event:
 *
 *   - a CLOSED event is not bookable
 *   - an OPEN event with no ticketId was never synced to TIQR, so there is
 *     nothing to sell and booking it would 409
 *   - booking without a phone number on the profile 400s before TIQR is
 *     ever called
 */
export default function Checkout({ event }) {
  const { user, signIn } = useUser()
  const { book, submitting, failure, reset } = useCheckout()
  const [passcode, setPasscode] = useState('')

  const blocker = bookingBlocker(event, user)
  const fees = feeBreakdown(event?.priceInPaise)
  const needsPasscode = Boolean(event?.passcodeRequired) || Boolean(failure?.needsPasscode)

  const submit = () => book({ eventId: event.id, quantity: 1, passcode })

  /* ---- the button, which depends on why booking is unavailable ---- */

  let control
  if (blocker.reason === 'signIn') {
    control = (
      <button type="button" className={BUTTON} onClick={() => signIn()}>
        SIGN IN TO BOOK
      </button>
    )
  } else if (blocker.reason === 'phone') {
    control = (
      <Link href="/profile" className={`${BUTTON} block text-center`}>
        ADD A PHONE NUMBER
      </Link>
    )
  } else if (blocker.blocked) {
    control = (
      <button type="button" className={`${BUTTON} cursor-not-allowed opacity-60`} disabled>
        {String(blocker.message || 'UNAVAILABLE').toUpperCase()}
      </button>
    )
  } else {
    control = (
      <button type="button" className={BUTTON} onClick={submit} disabled={submitting}>
        {submitting ? 'OPENING PAYMENT…' : 'REGISTER'}
      </button>
    )
  }

  return (
    <div className="mt-4 space-y-2">
      {fees && fees.total > 0 && (
        <dl className="space-y-0.5 text-[9px] leading-tight text-[#8d8d8d]">
          <Row label="Ticket" value={formatPrice(fees.base)} />
          <Row label="Platform fee (2.5%)" value={formatPrice(fees.platformFee)} />
          <Row label="GST on fee (18%)" value={formatPrice(fees.gst)} />
          <Row label="Total" value={formatPrice(fees.total)} emphasis />
          {/* These rates are worked out here, not quoted by the provider. */}
          <p className="pt-1 text-[8px] text-[#6f6f6f]">
            Fees are estimated; the provider confirms the final amount.
          </p>
        </dl>
      )}

      {!blocker.blocked && needsPasscode && (
        <label className="block space-y-1">
          <span className="text-[9px] uppercase tracking-wide text-[#8d8d8d]">Passcode</span>
          <input
            type="text"
            value={passcode}
            onChange={(changeEvent) => {
              setPasscode(changeEvent.target.value)
              if (failure) reset()
            }}
            className="w-full rounded-[5px] border border-white/15 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-white/40"
            placeholder="Required for this event"
          />
        </label>
      )}

      {control}

      {failure && (
        <p className="text-[9px] leading-snug text-[#f0a3a3]" role="alert">
          {failure.message}
          {failure.action === BOOKING_ACTION.SIGN_IN && (
            <>
              {' '}
              <button type="button" className="underline" onClick={() => signIn()}>
                Sign in
              </button>
            </>
          )}
        </p>
      )}
    </div>
  )
}

const BUTTON =
  'w-full rounded-[7px] bg-[rgba(78,40,74,0.72)] py-1.5 text-lg font-bold tracking-[0.16em] text-white transition-colors hover:bg-[rgba(104,52,96,0.9)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-70'

function Row({ label, value, emphasis = false }) {
  return (
    <div className={`flex justify-between ${emphasis ? 'pt-1 font-semibold text-white' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
