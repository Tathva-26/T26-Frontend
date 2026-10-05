/**
 * Pricing and cart rules for accommodation, over the shapes
 * `GET /api/accommodation/options` actually returns.
 *
 * The API hands back flat lists rather than a nested catalogue:
 *
 *   rooms        [{ tier, gender, nights, price, onSale }]   one per SKU
 *   availability [{ tier, gender, unit, total, byNight }]    free units per night
 *   food         [{ day, diet, price, onSale }]              from GET /api/food/options
 *
 * Rooms and food are two separate checkouts: food is its own TIQR event, and
 * one TIQR booking cannot span two events. So the page keeps two carts.
 *
 * so the page's "a tier with prices and stock" view is assembled here rather
 * than served. Two rules drive the assembly:
 *
 *   - A price is per WHOLE STAY and only ever comes out of `rooms`. Three
 *     nights in a dormitory is cheaper than three singles, so there is no
 *     nightly rate to multiply.
 *   - Stock is per night. A stay is limited by its TIGHTEST night, not by the
 *     first one or the average — the same bed can be free on night 3 and gone
 *     on night 1.
 *
 * Enums are the backend's: MALE/FEMALE and VEG/NONVEG, uppercase.
 */

import { feeBreakdown } from '@/lib/fees'

export const GENDERS = [
  { id: 'MALE', label: 'Male' },
  { id: 'FEMALE', label: 'Female' },
]

export const STAY_NIGHTS = [1, 2, 3]

/** Copy the API does not carry — it serves ids, the site names them. */
const TIER_META = {
  dormitory: {
    name: 'Dormitory',
    description: 'Shared hall, one bed per person.',
  },
  'sharing-3': {
    name: '3 Sharing Room',
    description: 'A whole room that sleeps three.',
  },
  'sharing-4': {
    name: '4 Sharing Room',
    description: 'A whole room that sleeps four.',
  },
}

export const tierName = (tier) => TIER_META[tier]?.name ?? tier
export const tierDescription = (tier) => TIER_META[tier]?.description ?? ''

export function unitLabel(unit, count = 1) {
  if (!unit) return count === 1 ? 'unit' : 'units'
  return count === 1 ? unit : `${unit}s`
}

/* ---- days ------------------------------------------------------------- */

/**
 * Which days a stay of `nights` can start on, given a fest of `festNights`.
 * A 3-night stay can only begin on day 1. Length alone is not bookable
 * information — the hostel has to know which nights are held.
 */
export function validCheckInDays(nights, festNights = 3) {
  const days = []
  for (let day = 1; day + nights - 1 <= festNights; day += 1) days.push(day)
  return days
}

export function clampCheckInDay(day, nights, festNights = 3) {
  const allowed = validCheckInDays(nights, festNights)
  if (allowed.length === 0) return 1
  return allowed.includes(day) ? day : allowed[allowed.length - 1]
}

export function stayDayLabel(checkInDay, nights) {
  const end = checkInDay + nights - 1
  return checkInDay === end ? `Day ${checkInDay}` : `Day ${checkInDay} – Day ${end}`
}

const nightsHeld = (checkInDay, nights) =>
  Array.from({ length: nights }, (_, i) => checkInDay + i)

/* ---- catalogue --------------------------------------------------------- */

/** The availability row for one tier+gender, or null. */
export function availabilityFor(availability, tier, gender) {
  return (
    availability.find((row) => row.tier === tier && row.gender === gender) ??
    null
  )
}

/** Price of a stay, or null when that combination is not sold at all. */
export function priceFor(rooms, { tier, gender, nights }) {
  const row = rooms.find(
    (item) =>
      item.tier === tier && item.gender === gender && item.nights === nights,
  )
  return row && row.onSale ? row.price : null
}

/**
 * Most units bookable for a stay: the smallest free count across every night
 * it would hold.
 */
export function bookableFor(availability, { tier, gender, checkInDay, nights }) {
  const row = availabilityFor(availability, tier, gender)
  if (!row) return 0

  return nightsHeld(checkInDay, nights).reduce(
    (least, night) => Math.min(least, row.byNight?.[night] ?? 0),
    Number.POSITIVE_INFINITY,
  )
}

/**
 * The tiers to show for a gender, already priced and stocked for the chosen
 * stay. A tier the buyer cannot book is still returned, flagged `soldOut`, so
 * it renders greyed rather than silently vanishing — 4-sharing has no female
 * stock at all, and hiding it looks like a bug.
 */
export function tiersFor({ rooms, availability, gender, nights, checkInDay }) {
  const tiers = [...new Set(rooms.map((row) => row.tier))]

  return tiers.map((tier) => {
    const stock = availabilityFor(availability, tier, gender)
    const price = priceFor(rooms, { tier, gender, nights })
    const bookable = bookableFor(availability, {
      tier,
      gender,
      checkInDay,
      nights,
    })

    return {
      tier,
      name: tierName(tier),
      description: tierDescription(tier),
      unit: stock?.unit ?? null,
      price,
      bookable,
      // No stock row at all means this gender is not served here.
      soldOut: !stock || bookable <= 0 || price === null,
    }
  })
}

/* ---- cart -------------------------------------------------------------- */

/**
 * A cart is a flat list of lines, which is also how it checks out: the
 * backend turns each line into one element of a TIQR bulk booking. There are
 * two carts — rooms and food — each paid for on its own.
 *
 * The room cart holds at most one stay line — a buyer books one room for one
 * stretch — so adding another replaces it rather than stacking.
 */
export const STAY_LINE_ID = 'stay'

export function buildStayLine({ tier, unit, price, nights, checkInDay, gender, quantity }) {
  if (price === null || price === undefined) return null

  return {
    kind: 'stay',
    id: STAY_LINE_ID,
    tier,
    gender,
    nights,
    checkInDay,
    name: tierName(tier),
    detail: `${stayDayLabel(checkInDay, nights)} · ${quantity} ${unitLabel(unit, quantity)}`,
    unitPrice: price,
    quantity,
  }
}

export function foodLineId(day, diet) {
  return `food-${day}-${diet}`
}

export function foodName(day, diet) {
  return `Day ${day} · ${diet === 'VEG' ? 'Veg' : 'Non-Veg'}`
}

export function buildFoodLine(coupon, quantity) {
  return {
    kind: 'food',
    id: foodLineId(coupon.day, coupon.diet),
    day: coupon.day,
    diet: coupon.diet,
    name: foodName(coupon.day, coupon.diet),
    detail: 'Breakfast + Lunch',
    unitPrice: coupon.price,
    quantity,
  }
}

export const lineTotal = (line) => line.unitPrice * line.quantity
export const cartTotal = (lines) =>
  lines.reduce((sum, line) => sum + lineTotal(line), 0)

/**
 * The buyer-facing breakdown: subtotal, platform fee, GST on the fee, total.
 *
 * Fees are applied to the whole basket, not per line, because that is how
 * TIQR charges it. Worked example from a real checkout: a ₹9,000 basket gives
 * a fee of ₹225, GST of ₹40.50 and a total of ₹9,265.50, which is what TIQR
 * charged.
 */
export function cartFees(lines) {
  const base = cartTotal(lines) // paise
  const fee = feeBreakdown(base)
  return fee ?? { base: 0, platformFee: 0, gst: 0, total: 0 }
}
export const cartCount = (lines) =>
  lines.reduce((sum, line) => sum + line.quantity, 0)

export function withStayLine(lines, line) {
  return line ? [line] : []
}

export function withFoodQuantity(lines, coupon, quantity) {
  const id = foodLineId(coupon.day, coupon.diet)
  const rest = lines.filter((item) => item.id !== id)
  if (quantity <= 0) return rest
  // Day/diet order, so the cart does not reshuffle as quantities change.
  return [...rest, buildFoodLine(coupon, quantity)].sort((a, b) =>
    a.id.localeCompare(b.id),
  )
}

export function foodQuantity(lines, coupon) {
  const id = foodLineId(coupon.day, coupon.diet)
  return lines.find((line) => line.id === id)?.quantity ?? 0
}

/**
 * The body `POST /api/accommodation/book` validates. The field names are the
 * backend's zod schema, not the view model's — `tier`, not `tierId`.
 */
export function buildBookingBody(lines) {
  return {
    items: lines.map((line) => ({
      kind: 'stay',
      tier: line.tier,
      gender: line.gender,
      checkInDay: line.checkInDay,
      nights: line.nights,
      quantity: line.quantity,
    })),
  }
}

/** The body `POST /api/food/book` validates. */
export function buildFoodBody(lines) {
  return {
    items: lines.map((line) => ({
      day: line.day,
      diet: line.diet,
      quantity: line.quantity,
    })),
  }
}
