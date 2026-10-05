'use client'

/**
 * PARKED: the full accommodation booking page (rooms, food coupons, two
 * carts with fee breakdowns, payment return screen).
 *
 * Rooms and food check out separately: food coupons are their own TIQR event
 * (POST /api/food/book), and one TIQR booking cannot span two events.
 *
 * Not rendered at the moment. /accommodation shows "Coming soon" from
 * ./Accommodation.jsx while the TIQR return redirect and per-line amounts are
 * sorted out. To re-enable, render this component from
 * src/app/accommodation/page.js inside a <Suspense> boundary (it reads search
 * params for the payment return), and make its default export the page.
 */

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import Navbar from '@/pageComponents/Navbar/Navbar'
import { useNavbarScope } from '@/pageComponents/Navbar/NavbarContext'
import { PATHS, api, apiErrorMessage } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import { paymentOutcome } from '@/lib/booking'
import { useAccommodation } from '@/hooks/useAccommodation'
import { useUser } from '@/context/UserContext'
import {
  GENDERS,
  STAY_NIGHTS,
  buildBookingBody,
  buildFoodBody,
  buildStayLine,
  cartCount,
  cartFees,
  clampCheckInDay,
  foodName,
  foodQuantity,
  lineTotal,
  stayDayLabel,
  tiersFor,
  unitLabel,
  validCheckInDays,
  withFoodQuantity,
  withStayLine,
} from '@/lib/accommodation'

const accommodationStyles = `
.accommodation-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(1px 1px at 12% 20%, #fff8, transparent),
    radial-gradient(1px 1px at 35% 8%, #fff6, transparent),
    radial-gradient(1px 1px at 62% 14%, #fff8, transparent),
    radial-gradient(1px 1px at 88% 30%, #fff6, transparent),
    radial-gradient(1px 1px at 20% 78%, #fff5, transparent),
    radial-gradient(1px 1px at 75% 85%, #fff6, transparent),
    radial-gradient(ellipse at 100% 100%, #14285a 0%, transparent 35%),
    radial-gradient(ellipse at 0% 100%, #101f48 0%, transparent 30%),
    #000;
  background-attachment: fixed;
  color: #fff;
}
`

/**
 * What the buyer sees when the payment provider sends them back.
 *
 * `status` is TIQR's query parameter and a HINT ONLY — the signature cannot
 * be verified on this side, so it can never be the basis for telling someone
 * their payment succeeded. The events flow resolves that by polling
 * `GET /api/booking/my` until the booking appears; accommodation bookings are
 * recorded by the backend but there is no read-back endpoint for them yet, so
 * the honest ceiling here is "charged, not yet confirmed".
 */
function PaymentReturn({ chargeStatus, onDismiss }) {
  const charged =
    paymentOutcome({ booking: null, chargeStatus, attemptsLeft: 0 }) === 'charged'

  return (
    <div className='mt-10 max-w-xl rounded-2xl border border-white/12 bg-black/50 p-6'>
      <h2 className='text-xl font-semibold'>
        {charged ? 'Payment received' : 'We could not find that payment'}
      </h2>

      <p className='mt-2 text-sm leading-relaxed text-white/60'>
        {charged
          ? 'The payment provider says you were charged. Your booking is not confirmed on this page yet — do not pay again. Confirmation will follow by email.'
          : 'Nothing came back to say a payment was made. If you were charged, do not pay again — get in touch and we will sort it out.'}
      </p>

      <div className='mt-5 flex flex-wrap gap-3 text-sm'>
        <button
          type='button'
          onClick={onDismiss}
          className='rounded-lg border border-white/15 px-4 py-2 font-semibold hover:bg-white/10'
        >
          Back to accommodation
        </button>
        <Link
          href='/contact'
          className='rounded-lg border border-white/15 px-4 py-2 font-semibold hover:bg-white/10'
        >
          Contact us
        </Link>
      </div>
    </div>
  )
}

function TierCard({ tier, selected, onSelect }) {
  return (
    <button
      type='button'
      disabled={tier.soldOut}
      onClick={() => onSelect(tier)}
      aria-pressed={selected}
      className={`w-full rounded-2xl border p-5 text-left transition-colors ${
        tier.soldOut
          ? 'cursor-not-allowed border-white/10 bg-white/[0.02] opacity-50'
          : selected
            ? 'border-[rgba(var(--violet),0.8)] bg-[rgba(var(--violet),0.14)]'
            : 'border-white/12 bg-white/[0.04] hover:bg-white/[0.08]'
      }`}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-lg font-semibold'>{tier.name}</p>
          <p className='mt-0.5 text-sm text-white/55'>{tier.description}</p>
        </div>
        <p className='shrink-0 text-lg font-semibold'>
          {tier.price === null ? '—' : formatPrice(tier.price)}
        </p>
      </div>

      <p className='mt-3 text-xs uppercase tracking-wider text-white/45'>
        {tier.soldOut
          ? 'Sold out for these nights'
          : `${tier.bookable} ${unitLabel(tier.unit, tier.bookable)} left · per ${tier.unit}`}
      </p>
    </button>
  )
}

function Stepper({ value, min = 0, max, onChange, label }) {
  return (
    <div className='inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/40'>
      <button
        type='button'
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className='h-8 w-8 text-lg leading-none text-white/80 disabled:opacity-30'
      >
        −
      </button>
      <span className='min-w-[2ch] text-center text-sm tabular-nums'>{value}</span>
      <button
        type='button'
        aria-label={`Increase ${label}`}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
        className='h-8 w-8 text-lg leading-none text-white/80 disabled:opacity-30'
      >
        +
      </button>
    </div>
  )
}

/**
 * One cart and its Pay button. Rooms and food each get one, because each is
 * a separate payment on a separate TIQR event.
 */
function CartPanel({ title, lines, emptyText, payLabel, isSignedIn, submitting, error, onCheckout }) {
  const fees = cartFees(lines)
  const count = cartCount(lines)

  return (
    <section className='rounded-2xl border border-white/12 bg-black/50 p-5 backdrop-blur-sm'>
      <h2 className='text-xs font-semibold uppercase tracking-[0.18em] text-white/45'>
        {title}
        {count > 0 ? ` · ${count}` : ''}
      </h2>

      {lines.length === 0 ? (
        <p className='mt-3 text-sm text-white/50'>{emptyText}</p>
      ) : (
        <>
          <ul className='mt-3 space-y-3'>
            {lines.map((line) => (
              <li key={line.id} className='flex justify-between gap-3 text-sm'>
                <div className='min-w-0'>
                  <p className='truncate font-medium'>{line.name}</p>
                  <p className='mt-0.5 text-xs text-white/45'>
                    {line.detail}
                    {line.kind === 'food' ? ` · ×${line.quantity}` : ''}
                  </p>
                </div>
                <span className='shrink-0 tabular-nums'>
                  {formatPrice(lineTotal(line))}
                </span>
              </li>
            ))}
          </ul>

          {/* TIQR adds the platform fee and GST on top of the ticket prices
              at checkout, so the breakdown shows what will actually be
              charged. Matches its own total exactly. */}
          <dl className='mt-5 space-y-1.5 border-t border-white/12 pt-4 text-sm'>
            <div className='flex justify-between text-white/60'>
              <dt>Subtotal</dt>
              <dd className='tabular-nums'>{formatPrice(fees.base)}</dd>
            </div>
            <div className='flex justify-between text-white/60'>
              <dt>Platform fee (2.5%)</dt>
              <dd className='tabular-nums'>{formatPrice(fees.platformFee)}</dd>
            </div>
            <div className='flex justify-between text-white/60'>
              <dt>GST on fee (18%)</dt>
              <dd className='tabular-nums'>{formatPrice(fees.gst)}</dd>
            </div>
            <div className='flex justify-between pt-1.5 text-base font-semibold text-white'>
              <dt>Total</dt>
              <dd className='tabular-nums'>{formatPrice(fees.total)}</dd>
            </div>
          </dl>

          <button
            type='button'
            onClick={onCheckout}
            disabled={submitting}
            className='mt-4 w-full rounded-xl border border-[rgba(var(--violet),0.5)] bg-[rgba(var(--violet),0.22)] px-4 py-3 text-sm font-semibold uppercase tracking-wider transition-colors hover:bg-[rgba(var(--violet),0.34)] disabled:cursor-not-allowed disabled:opacity-40'
          >
            {submitting
              ? 'Opening payment…'
              : isSignedIn
                ? payLabel
                : 'Sign in to book'}
          </button>
        </>
      )}

      {error ? (
        <p className='mt-2 text-xs text-red-300' role='alert'>
          {error}
        </p>
      ) : null}
    </section>
  )
}

export default function AccommodationBooking() {
  const inNavbarScope = useNavbarScope()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn, signIn } = useUser()
  const {
    rooms,
    food,
    availability,
    notes,
    festNights,
    loading,
    error,
    backendDisabled,
    reload,
  } = useAccommodation()

  const [gender, setGender] = useState(null)
  const [nights, setNights] = useState(1)
  const [checkInDay, setCheckInDay] = useState(1)
  const [tierId, setTierId] = useState(null)
  const [roomCount, setRoomCount] = useState(1)
  // Two carts, two payments: `lines` is the room (at most one stay line),
  // `foodLines` the coupons.
  const [lines, setLines] = useState([])
  const [foodLines, setFoodLines] = useState([])
  // Which cart is mid-checkout ('room' | 'food'), and the error per cart.
  const [submitting, setSubmitting] = useState(null)
  const [checkoutErrors, setCheckoutErrors] = useState({})

  /* The API serves flat SKU rows; the "tier with a price and some stock left"
     the page wants is assembled per gender and per chosen stay. */
  const tiers = useMemo(
    () =>
      gender
        ? tiersFor({ rooms, availability, gender, nights, checkInDay })
        : [],
    [rooms, availability, gender, nights, checkInDay],
  )

  const tier = tiers.find((row) => row.tier === tierId) ?? null

  const chargeStatus = searchParams.get('status')
  const returning = chargeStatus !== null

  function syncStay(next = {}) {
    const useTier = next.tier ?? tier
    const useNights = next.nights ?? nights
    const useDay = next.checkInDay ?? checkInDay
    const useCount = next.quantity ?? roomCount
    const useGender = next.gender ?? gender

    setLines((current) => {
      if (!useTier || !useGender || useTier.soldOut) {
        return withStayLine(current, null)
      }
      return withStayLine(
        current,
        buildStayLine({
          tier: useTier.tier,
          unit: useTier.unit,
          price: useTier.price,
          nights: useNights,
          checkInDay: useDay,
          gender: useGender,
          quantity: useCount,
        }),
      )
    })
  }

  /* Changing gender can invalidate the chosen room — 4-sharing has no female
     stock — so the selection and its cart line go with it. */
  function chooseGender(next) {
    setGender(next)
    setTierId(null)
    setLines((current) => withStayLine(current, null))
  }

  /* A longer stay can push the start day past the end of the fest, and can
     also shrink what is bookable, so both are re-derived rather than kept. */
  function chooseNights(next) {
    const day = clampCheckInDay(checkInDay, next, festNights)
    setNights(next)
    setCheckInDay(day)

    const updated = tiersFor({
      rooms,
      availability,
      gender,
      nights: next,
      checkInDay: day,
    }).find((row) => row.tier === tierId)

    if (!updated || updated.soldOut) {
      setTierId(null)
      setLines((current) => withStayLine(current, null))
      return
    }

    const capped = Math.min(roomCount, updated.bookable)
    setRoomCount(capped || 1)
    syncStay({ tier: updated, nights: next, checkInDay: day, quantity: capped || 1 })
  }

  function chooseCheckInDay(day) {
    setCheckInDay(day)

    const updated = tiersFor({
      rooms,
      availability,
      gender,
      nights,
      checkInDay: day,
    }).find((row) => row.tier === tierId)

    if (!updated || updated.soldOut) {
      setTierId(null)
      setLines((current) => withStayLine(current, null))
      return
    }

    const capped = Math.min(roomCount, updated.bookable)
    setRoomCount(capped || 1)
    syncStay({ tier: updated, checkInDay: day, quantity: capped || 1 })
  }

  function selectTier(next) {
    const capped = Math.min(roomCount, next.bookable) || 1
    setTierId(next.tier)
    setRoomCount(capped)
    syncStay({ tier: next, quantity: capped })
  }

  async function checkout(cart) {
    if (!isSignedIn) {
      signIn()
      return
    }

    const [path, body] =
      cart === 'food'
        ? [PATHS.foodBook, buildFoodBody(foodLines)]
        : [PATHS.accommodationBook, buildBookingBody(lines)]
    const failWith = (message) => {
      setCheckoutErrors((current) => ({ ...current, [cart]: message }))
      setSubmitting(null)
    }

    setSubmitting(cart)
    setCheckoutErrors((current) => ({ ...current, [cart]: null }))
    try {
      const { data } = await api.post(path, body)
      // Deliberately not re-enabling the button on success — the navigation is
      // already underway, and a second submit mid-redirect is a second charge.
      if (data?.redir_url) {
        window.location.assign(data.redir_url)
        return
      }
      failWith('The payment page could not be opened. Please try again.')
    } catch (requestError) {
      failWith(apiErrorMessage(requestError, 'Could not complete that booking.'))
    }
  }

  return (
    <main className='accommodation-page'>
      {!inNavbarScope && <Navbar />}
      <TathvaMenu />
      <style>{accommodationStyles}</style>

      <div className='mx-auto w-full max-w-5xl px-5 pb-24 pt-28 sm:px-8'>
        <h1 className='font-[var(--font-bebas)] text-5xl tracking-wide sm:text-7xl'>
          ACCOMMODATION
        </h1>

        {notes.length > 0 && (
          <ul className='mt-4 space-y-1 text-sm text-white/60'>
            {notes.map((note) => (
              <li key={note}>· {note}</li>
            ))}
          </ul>
        )}

        {returning ? (
          <PaymentReturn
            chargeStatus={chargeStatus}
            onDismiss={() => {
              /* The order has left for the gateway, so the cart it came from
                 is spent. A real round trip is a full page navigation and
                 drops this state anyway; clearing here covers a client-side
                 route into the return URL, where it would otherwise survive
                 and invite a second payment. */
              setLines([])
              setFoodLines([])
              router.replace('/accommodation')
            }}
          />
        ) : backendDisabled ? (
          <p className='mt-10 text-2xl text-white/70'>COMING SOON</p>
        ) : loading ? (
          <p className='mt-10 text-sm text-white/50'>Loading rooms…</p>
        ) : error ? (
          <div className='mt-10'>
            <p className='text-sm text-red-300'>{error}</p>
            <button
              type='button'
              onClick={reload}
              className='mt-3 rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-white/10'
            >
              Retry
            </button>
          </div>
        ) : (
          <div className='mt-10 grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start'>
            <div className='space-y-10'>
              {/* Gender gates everything: stock is counted per gender. */}
              <section>
                <h2 className='text-xs font-semibold uppercase tracking-[0.18em] text-white/45'>
                  Booking for
                </h2>
                <div className='mt-3 flex gap-2'>
                  {GENDERS.map((option) => (
                    <button
                      key={option.id}
                      type='button'
                      onClick={() => chooseGender(option.id)}
                      aria-pressed={gender === option.id}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                        gender === option.id
                          ? 'border-[rgba(var(--violet),0.8)] bg-[rgba(var(--violet),0.18)]'
                          : 'border-white/15 hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className={gender ? '' : 'opacity-40'}>
                <h2 className='text-xs font-semibold uppercase tracking-[0.18em] text-white/45'>
                  Room
                </h2>

                {!gender ? (
                  <p className='mt-3 text-sm text-white/50'>
                    Pick who this is for — availability differs by gender.
                  </p>
                ) : (
                  <>
                    <div className='mt-3 flex flex-wrap items-center gap-2'>
                      <span className='text-sm text-white/55'>Nights</span>
                      {STAY_NIGHTS.map((option) => (
                        <button
                          key={option}
                          type='button'
                          onClick={() => chooseNights(option)}
                          aria-pressed={nights === option}
                          className={`h-8 w-9 rounded-lg border text-sm transition-colors ${
                            nights === option
                              ? 'border-[rgba(var(--violet),0.8)] bg-[rgba(var(--violet),0.18)]'
                              : 'border-white/15 hover:bg-white/10'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    {/* Length alone does not say which nights are held — a
                        2-night stay is either Day 1–2 or Day 2–3. */}
                    <div className='mt-3 flex flex-wrap items-center gap-2'>
                      <span className='text-sm text-white/55'>Check in</span>
                      {validCheckInDays(nights, festNights).map((day) => (
                        <button
                          key={day}
                          type='button'
                          onClick={() => chooseCheckInDay(day)}
                          aria-pressed={checkInDay === day}
                          className={`h-8 rounded-lg border px-3 text-sm transition-colors ${
                            checkInDay === day
                              ? 'border-[rgba(var(--violet),0.8)] bg-[rgba(var(--violet),0.18)]'
                              : 'border-white/15 hover:bg-white/10'
                          }`}
                        >
                          Day {day}
                        </button>
                      ))}
                      <span className='text-xs text-white/40'>
                        {stayDayLabel(checkInDay, nights)}
                      </span>
                    </div>

                    <div className='mt-4 space-y-3'>
                      {tiers.map((row) => (
                        <TierCard
                          key={row.tier}
                          tier={row}
                          selected={tierId === row.tier}
                          onSelect={selectTier}
                        />
                      ))}
                    </div>

                    {tier && !tier.soldOut && (
                      <div className='mt-4 flex items-center gap-3 text-sm'>
                        <span className='text-white/55'>
                          How many {unitLabel(tier.unit, 2)}?
                        </span>
                        <Stepper
                          label={unitLabel(tier.unit, 2)}
                          value={roomCount}
                          min={1}
                          max={tier.bookable}
                          onChange={(next) => {
                            setRoomCount(next)
                            syncStay({ quantity: next })
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </section>

              <section>
                <h2 className='text-xs font-semibold uppercase tracking-[0.18em] text-white/45'>
                  Food coupons
                </h2>
                <p className='mt-1 text-sm text-white/50'>
                  Breakfast + Lunch, {formatPrice(food[0]?.price ?? 0)} per day.
                  Buy any mix of days, with or without a room — food is paid
                  for separately.
                </p>

                <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                  {food.map((coupon) => {
                    const quantity = foodQuantity(foodLines, coupon)
                    const label = foodName(coupon.day, coupon.diet)
                    return (
                      <div
                        key={`${coupon.day}-${coupon.diet}`}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${
                          quantity > 0
                            ? 'border-[rgba(var(--violet),0.6)] bg-[rgba(var(--violet),0.1)]'
                            : 'border-white/12 bg-white/[0.04]'
                        }`}
                      >
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-semibold'>{label}</p>
                          <p className='mt-0.5 text-xs text-white/50'>
                            {formatPrice(coupon.price)}
                          </p>
                        </div>
                        <Stepper
                          label={label}
                          value={quantity}
                          onChange={(next) =>
                            setFoodLines((current) =>
                              withFoodQuantity(current, coupon, next),
                            )
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            {/* Two carts, because rooms and food are two payments. */}
            <aside className='space-y-4 lg:sticky lg:top-28'>
              <CartPanel
                title='Room'
                lines={lines}
                emptyText='No room picked yet.'
                payLabel='Pay for room'
                isSignedIn={isSignedIn}
                submitting={submitting === 'room'}
                error={checkoutErrors.room}
                onCheckout={() => checkout('room')}
              />
              <CartPanel
                title='Food coupons'
                lines={foodLines}
                emptyText='No coupons added yet.'
                payLabel='Pay for food'
                isSignedIn={isSignedIn}
                submitting={submitting === 'food'}
                error={checkoutErrors.food}
                onCheckout={() => checkout('food')}
              />
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
