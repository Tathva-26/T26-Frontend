/**
 * The checkout total.
 *
 * TIQR charges a platform fee and GST on top of the ticket price, and this
 * works both out locally so the buyer sees a total before being redirected.
 *
 * That makes these rates a GUESS at TIQR's. If TIQR changes them, the number
 * shown here goes stale silently and the buyer is quoted one price and
 * charged another. If TIQR can ever return an authoritative breakdown, read
 * that instead of this.
 */

/** 2.5% of the ticket price. */
export const PLATFORM_FEE_RATE = 0.025

/** 18% GST, charged on the platform fee only — not on the ticket price. */
export const GST_RATE = 0.18

/**
 * Everything in integer paise, because that is the unit the API uses and
 * rounding rupees first loses money a paisa at a time.
 *
 * A null price means "TBA" and has no total.
 */
export function feeBreakdown(priceInPaise, quantity = 1) {
  if (typeof priceInPaise !== 'number' || Number.isNaN(priceInPaise)) return null

  const count = Number.isInteger(quantity) && quantity > 0 ? quantity : 1
  const base = priceInPaise * count

  // A free event stays free: no fee is charged on nothing.
  if (base === 0) {
    return { quantity: count, base: 0, platformFee: 0, gst: 0, total: 0 }
  }

  const platformFee = Math.round(base * PLATFORM_FEE_RATE)
  const gst = Math.round(platformFee * GST_RATE)

  return { quantity: count, base, platformFee, gst, total: base + platformFee + gst }
}
