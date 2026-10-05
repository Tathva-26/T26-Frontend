'use client'

import { useEffect, useState } from 'react'

import { PATHS, api } from '@/lib/api'
import { foodName, stayDayLabel, tierName, unitLabel } from '@/lib/accommodation'

/** Only bookings that are paid, or still mid-payment, are worth showing. */
const SHOWN = ['CONFIRMED', 'PENDING']

const STATUS = {
  CONFIRMED: { label: 'Confirmed', className: 'text-emerald-300 border-emerald-400/40' },
  PENDING: { label: 'Payment pending', className: 'text-amber-300 border-amber-400/40' },
}

function StatusTag({ status }) {
  const tag = STATUS[status] ?? { label: status, className: 'text-white/60 border-white/20' }
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${tag.className}`}>
      {tag.label}
    </span>
  )
}

/**
 * The signed-in buyer's own room bookings and food coupons, from
 * GET /api/accommodation/my and GET /api/food/my.
 *
 * Statuses come from our backend, which syncs them from TIQR every few
 * minutes — so a payment just made can read "Payment pending" for a short
 * while before it turns "Confirmed". Failed and expired attempts are hidden.
 */
export default function MyBookings() {
  const [settled, setSettled] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      api.get(PATHS.accommodationMy, { signal: controller.signal }),
      api.get(PATHS.foodMy, { signal: controller.signal }),
    ])
      .then(([rooms, food]) =>
        setSettled({
          stays: (rooms.data?.bookings ?? []).filter((b) => SHOWN.includes(b.status)),
          food: (food.data?.orders ?? []).filter((o) => SHOWN.includes(o.status)),
        }),
      )
      .catch(() => {
        // Not worth an error banner on a booking page: just show nothing.
        if (!controller.signal.aborted) setSettled({ stays: [], food: [] })
      })
    return () => controller.abort()
  }, [])

  if (!settled || (settled.stays.length === 0 && settled.food.length === 0)) return null

  return (
    <section className='mt-8 rounded-2xl border border-white/12 bg-black/50 p-5 backdrop-blur-sm'>
      <h2 className='text-xs font-semibold uppercase tracking-[0.18em] text-white/45'>
        Your bookings
      </h2>

      <ul className='mt-3 divide-y divide-white/10'>
        {settled.stays.flatMap((booking) =>
          booking.rooms.map((room) => {
            const unit = room.tier === 'dormitory' ? 'bed' : 'room'
            return (
              <li key={`${booking.bookingUid}-${room.id}`} className='flex items-start justify-between gap-3 py-3 text-sm'>
                <div className='min-w-0'>
                  <p className='font-medium'>
                    {tierName(room.tier)} · {room.quantity} {unitLabel(unit, room.quantity)}
                  </p>
                  <p className='mt-0.5 text-xs text-white/50'>
                    {stayDayLabel(room.checkInDay, room.nights)} ·{' '}
                    {room.gender === 'FEMALE' ? 'Female' : 'Male'}
                  </p>
                </div>
                <StatusTag status={booking.status} />
              </li>
            )
          }),
        )}

        {settled.food.map((order) => (
          <li key={order.bookingUid} className='flex items-start justify-between gap-3 py-3 text-sm'>
            <div className='min-w-0'>
              <p className='font-medium'>Food coupons</p>
              <p className='mt-0.5 text-xs text-white/50'>
                {order.items
                  .map((item) => `${foodName(item.day, item.diet)} ×${item.quantity}`)
                  .join(', ')}
              </p>
            </div>
            <StatusTag status={order.status} />
          </li>
        ))}
      </ul>
    </section>
  )
}
