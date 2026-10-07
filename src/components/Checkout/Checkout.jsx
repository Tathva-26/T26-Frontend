'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BOOKING_ACTION, bookingBlocker, maxQuantity } from '@/lib/booking'
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
  const maxTickets = maxQuantity(event)
  const [quantity, setQuantity] = useState(1)

  /*
   * Latched, not derived from the current failure.
   *
   * `passcodeRequired` is absent when an admin gates an event after the list
   * response was cached, so the demand can arrive only as a 403. Deriving the
   * field's visibility from `failure` meant that clearing the message on the
   * first keystroke unmounted the input mid-typing, which made such an event
   * impossible to book at all.
   */
  const [passcodeDemanded, setPasscodeDemanded] = useState(false)

  const blocker = bookingBlocker(event, user)
  const fees = feeBreakdown(event?.priceInPaise, quantity)
  const needsPasscode = Boolean(event?.passcodeRequired) || passcodeDemanded

  const submit = async () => {
    const verdict = await book({ eventId: event.id, quantity, passcode })
    if (verdict?.needsPasscode) setPasscodeDemanded(true)
  }

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
      {!blocker.blocked && maxTickets > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wide text-[#8d8d8d]">
            Tickets (up to {maxTickets})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={STEPPER}
              onClick={() => setQuantity((n) => Math.max(1, n - 1))}
              disabled={quantity <= 1 || submitting}
              aria-label="One ticket fewer"
            >
              −
            </button>
            <span className="w-5 text-center text-sm font-semibold tabular-nums text-white" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              className={STEPPER}
              onClick={() => setQuantity((n) => Math.min(maxTickets, n + 1))}
              disabled={quantity >= maxTickets || submitting}
              aria-label="One ticket more"
            >
              +
            </button>
          </div>
        </div>
      )}

      {fees && fees.total > 0 && (
        <dl className="space-y-0.5 text-[9px] leading-tight text-[#8d8d8d]">
          <Row
            label={fees.quantity > 1 ? `Tickets × ${fees.quantity}` : 'Ticket'}
            value={formatPrice(fees.base)}
          />
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

const STEPPER =
  'flex h-6 w-6 items-center justify-center rounded-[5px] border border-white/15 bg-black/30 p-0 text-sm leading-none text-white transition-colors hover:border-white/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40'

function Row({ label, value, emphasis = false }) {
  return (
    <div className={`flex justify-between ${emphasis ? 'pt-1 font-semibold text-white' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
