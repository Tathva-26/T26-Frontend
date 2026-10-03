/**
 * End-to-end check for checkout and the payment return, against the stub
 * backend over real HTTP.
 *
 *   node scripts/e2e/stub-backend.mjs &
 *   NEXT_PUBLIC_USE_MOCK_DATA=false \
 *     NEXT_PUBLIC_BACKEND_URL=http://localhost:8787 npm run dev &
 *   node scripts/e2e/booking.mjs
 *
 * The stub's /__config drives the branches that are hard to reach for real:
 * a 409 from an event that never synced, a 502 from the provider, and a
 * charge that never reaches the provider at all.
 */

import { session } from './cdp.mjs'

const BASE = process.env.BASE || 'http://localhost:3000'
const STUB = process.env.STUB || 'http://localhost:8787'

let pass = 0
const fails = []
const check = (label, actual, expected) => {
  if (JSON.stringify(actual) === JSON.stringify(expected)) pass += 1
  else fails.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`)
}

const configure = (query) => fetch(`${STUB}/__config?${query}`)
const reset = () => fetch(`${STUB}/__reset`)
const posts = async () =>
  (await (await fetch(`${STUB}/__received`)).json()).filter((r) => r.method === 'POST')

const s = await session()
const settle = (ms) => new Promise((r) => setTimeout(r, ms))
const text = () => s.evaluate('document.body.innerText')

const waitFor = async (expression, tries = 100) => {
  for (let i = 0; i < tries; i += 1) {
    const ok = await s.evaluate(expression).catch(() => false)
    if (ok) return true
    await settle(250)
  }
  return false
}

const MODAL = `!!document.querySelector('[aria-label="Close workshop details"]')`
const openCard = async (titleFragment) => {
  await waitFor(`!!document.querySelector('[role="button"][aria-label*=${JSON.stringify(titleFragment)}]')`)
  await s.evaluate(`document.querySelector('[role="button"][aria-label*=${JSON.stringify(titleFragment)}]').click(); true`)
  return waitFor(MODAL)
}
const closeModal = async () => {
  await s.evaluate(`document.querySelector('[aria-label="Close workshop details"]')?.click(); true`)
  return waitFor(`!(${MODAL})`)
}
const modalText = () =>
  s.evaluate(`(() => {
    const close = document.querySelector('[aria-label="Close workshop details"]');
    return close ? close.closest('div.relative').innerText : '';
  })()`)
const clickRegister = () =>
  s.evaluate(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /^REGISTER$/.test(x.textContent.trim()));
    if (!b) return false;
    b.click();
    return true;
  })()`)

await reset()
await s.goto(`${BASE}/workshops`)

/* ---- the cards are reachable at all ---- */
// The modal markup existed but nothing opened it: the cards were inert.
check('a card opens the detail modal', await openCard('Deep Space Robotics'), true)

/* ---- the fee breakdown ---- */
let modal = await modalText()
// A 549 rupee ticket is 54900 paise: 1373 fee, 247 GST, 56520 total.
check('ticket price shown', modal.includes('₹499'), true)
check('platform fee shown', modal.includes('Platform fee (2.5%)'), true)
check('gst shown', modal.includes('GST on fee (18%)'), true)
check('total includes the fees', modal.includes('₹513.73'), true)
check('fees are flagged as estimated', modal.toLowerCase().includes('estimated'), true)
check('register offered', /REGISTER/.test(modal), true)
check('no passcode field on an ungated event', modal.toLowerCase().includes('passcode'), false)

/* ---- gating, before the button is ever offered ---- */
await closeModal()
await openCard('Gated Workshop')
check('gated event shows a passcode field', (await modalText()).toLowerCase().includes('passcode'), true)

await closeModal()
await openCard('Unsynced Workshop')
// OPEN locally, but the push to TIQR never finished, so there is no ticket.
check('unsynced event is not bookable', /NOT OPEN FOR BOOKING YET/i.test(await modalText()), true)

await closeModal()
await openCard('Closed Workshop')
check('closed event is not bookable', /BOOKING CLOSED/i.test(await modalText()), true)

/* booking is refused outright without a phone, so it is checked up front */
await configure('phone=none')
await s.goto(`${BASE}/workshops`)
await openCard('Deep Space Robotics')
check('no phone offers the profile instead', /ADD A PHONE NUMBER/i.test(await modalText()), true)
check('no booking attempted without a phone', (await posts()).length, 0)

/* ---- a successful booking ---- */
await reset()
await s.goto(`${BASE}/workshops`)
await openCard('Deep Space Robotics')
check('register clicked', await clickRegister(), true)
check('browser handed to the payment page', await waitFor(`window.location.pathname === '/events/12'`), true)

let sent = await posts()
check('exactly one booking created', sent.length, 1)
check('sent as JSON', sent[0]?.contentType.includes('application/json'), true)
// Our Event.id, never tiqrEventId: the id spaces overlap, so the wrong one
// books the wrong thing or 404s.
check('our event id sent', sent[0]?.body?.eventId, 12)
check('quantity sent', sent[0]?.body?.quantity, 1)
check('no passcode key when not needed', 'passcode' in (sent[0]?.body ?? {}), false)
check('no referral key when none held', 'referralCode' in (sent[0]?.body ?? {}), false)

/* ---- the referral code survives the journey ---- */
await reset()
await s.goto(`${BASE}/workshops?referral_code=ab12cd`)
check('code captured and normalised', await waitFor(`localStorage.getItem('tathva-referral-code') === 'AB12CD'`), true)
// Captured on one page, spent on another: it has to survive the walk.
await s.goto(`${BASE}/workshops`)
await openCard('Deep Space Robotics')
await clickRegister()
await waitFor(`window.location.pathname === '/events/12'`)
sent = await posts()
check('referral code sent with the booking', sent[0]?.body?.referralCode, 'AB12CD')

/* a refused code is cleared, so the retry is not refused for the same reason */
await reset()
await configure('createStatus=400&createMessage=Booking%20rejected')
await s.goto(`${BASE}/workshops?referral_code=AB12CD`)
await waitFor(`localStorage.getItem('tathva-referral-code') === 'AB12CD'`)
await openCard('Deep Space Robotics')
await clickRegister()
check('refusal explained', await waitFor(`/referral code was refused/i.test(document.body.innerText)`), true)
check('refused code cleared', await s.evaluate(`localStorage.getItem('tathva-referral-code')`), null)
check('stayed on the page', await s.evaluate(`window.location.pathname`), '/workshops')

/* ---- the failure table, each one a different thing to say ---- */
const failureCases = [
  ['createStatus=401', /sign in again to book/i, 'a 401 asks for sign-in'],
  ['createStatus=400&createMessage=Add%20a%20phone%20number%20to%20your%20profile', /phone number to your profile/i, 'a missing phone is explained'],
  ['createStatus=400&createMessage=You%20have%20already%20registered', /already booked/i, 'a duplicate is explained'],
  ['createStatus=409', /not open for booking yet/i, 'a 409 is explained without blaming the buyer'],
  ['createStatus=502', /payment provider is unavailable/i, 'a 502 offers a retry'],
  ['createStatus=403&createCode=PASSCODE_REQUIRED', /needs a passcode/i, 'a passcode demand reveals the field'],
  ['createStatus=403&createCode=PASSCODE_INVALID&createMessage=Invalid%20passcode', /passcode is not right/i, 'a wrong passcode is explained'],
  ['withRedirect=false', /payment page could not be opened/i, 'a 201 with no redirect is not treated as success'],
]

for (const [query, pattern, label] of failureCases) {
  await reset()
  await configure(query)
  await s.goto(`${BASE}/workshops`)
  await openCard('Deep Space Robotics')
  await clickRegister()
  const shown = await waitFor(`${pattern}.test(document.body.innerText)`, 40)
  check(label, shown, true)
  if (query === 'createStatus=400&createMessage=Add%20a%20phone%20number%20to%20your%20profile') {
    // Shown first, then moved along, so the reason is readable.
    check('a missing phone routes to the profile', await waitFor(`window.location.pathname === '/profile'`, 40), true)
  } else if (!query.startsWith('withRedirect')) {
    check(`${label}: did not leave the page`, await s.evaluate(`window.location.pathname`), '/workshops')
  }
}

/* a passcode demanded only by the 403, on an event whose list payload said
   it was not needed: the field must appear and must survive typing */
await reset()
await configure('createStatus=403&createCode=PASSCODE_REQUIRED')
await s.goto(`${BASE}/workshops`)
await openCard('Deep Space Robotics')
check('ungated event shows no passcode field at first', (await modalText()).toLowerCase().includes('passcode'), false)
await clickRegister()
check('the 403 reveals the field', await waitFor(`!!document.querySelector('input[placeholder="Required for this event"]')`, 40), true)

await s.evaluate(`(() => {
  const el = document.querySelector('input[placeholder="Required for this event"]');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, 's3cret');
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`)
await settle(500)
// Clearing the error message on the first keystroke used to unmount the input.
check('the field survives typing', await s.evaluate(`!!document.querySelector('input[placeholder="Required for this event"]')`), true)
check('what was typed is kept', await s.evaluate(`document.querySelector('input[placeholder="Required for this event"]').value`), 's3cret')

await configure('createStatus=201')
await clickRegister()
check('booking proceeds with the passcode', await waitFor(`window.location.pathname === '/events/12'`, 40), true)
const withPass = (await posts()).filter((r) => r.body?.passcode)
check('passcode sent in the body', withPass[0]?.body?.passcode, 's3cret')

/* ---- coming back from payment ---- */
// The query string is a hint only: nothing here can verify the signature, so
// only a booking read back from the provider confirms anything.
await reset()
await configure('booking=CONFIRMED&refreshableInMs=0')
await s.goto(`${BASE}/events/12?status=CHARGED&signature=stub`)
check('a confirmed booking is confirmed', await waitFor(`/You are booked/i.test(document.body.innerText)`), true)

await reset()
await configure('booking=none&refreshableInMs=0')
await s.goto(`${BASE}/events/12?status=CHARGED&signature=stub`)
check('while polling it says so', await waitFor(`/Confirming your booking/i.test(document.body.innerText)`, 20), true)
// Charged according to the query, but nothing reached the provider. Saying
// "failed" would be wrong: the money may well have left.
check('charged but missing warns not to pay again', await waitFor(`/Payment went through/i.test(document.body.innerText)`, 120), true)
check('it says not to pay again', /do not pay again/i.test(await text()), true)

await reset()
await configure('booking=none&refreshableInMs=0')
await s.goto(`${BASE}/events/12`)
check('no charge claim and no booking', await waitFor(`/No booking found/i.test(document.body.innerText)`, 120), true)
check('says nothing was charged', /nothing was charged/i.test(await text()), true)

await reset()
await configure('booking=PENDING&refreshableInMs=0')
await s.goto(`${BASE}/events/12?status=CHARGED&signature=stub`)
check('a pending booking is not called confirmed', await waitFor(`/Payment received/i.test(document.body.innerText)`, 120), true)
check('pending is not reported as booked', /You are booked/i.test(await text()), false)

/* an event that cannot be loaded must not spin forever in front of someone
   who has just paid: without it there is no tiqrEventId to match a booking on */
await reset()
await configure('booking=CONFIRMED&refreshableInMs=0')
await s.goto(`${BASE}/events/999?status=CHARGED&signature=stub`)
check('an unknown event does not hang', await waitFor(`/could not find that event/i.test(document.body.innerText)`, 60), true)
check('it still says not to pay again', /do not pay again/i.test(await text()), true)
check('it does not claim the booking failed', /No booking found/i.test(await text()), false)

/* a non-numeric id is a 400, and means the same thing to the buyer */
await s.goto(`${BASE}/events/not-a-number?status=CHARGED`)
check('a malformed id does not hang either', await waitFor(`/could not find that event/i.test(document.body.innerText)`, 60), true)

/* a read answered from cache says nothing new, so it must not spend one of
   the six attempts — otherwise the poll gives up early on someone who paid */
await reset()
await configure('booking=none&refreshableInMs=0&reportFresh=false')
await s.goto(`${BASE}/events/12?status=CHARGED&signature=stub`)
check('cache hits do not end the poll early', await waitFor(`/Confirming your booking/i.test(document.body.innerText)`, 20), true)
// The delay floor is two seconds, so six attempts' worth of time is ~12s;
// a budget that counted cache hits would have given up well before then.
await settle(14000)
check('still polling well past six cache hits', /Confirming your booking/i.test(await text()), true)

// Then it does stop: the loop ceiling bounds it even when nothing is fresh.
check('eventually settles', await waitFor(`!/Confirming your booking/i.test(document.body.innerText)`, 80), true)
const staleReads = (await (await fetch(`${STUB}/__received`)).json()).filter(
  (r) => r.method === 'GET' && r.path === '/api/booking/my',
)
check('asked more times than the attempt cap', staleReads.length > 6, true)
check('but stayed bounded by the loop ceiling', staleReads.length <= 12, true)

/* with every read reaching the provider, the budget is exactly the cap */
await reset()
await configure('booking=PENDING&refreshableInMs=0')
await s.goto(`${BASE}/events/12?status=CHARGED&signature=stub`)
check('settles on pending', await waitFor(`/Payment received/i.test(document.body.innerText)`, 120), true)
// A pending booking shows at once but polling continues, so a later
// confirmation still upgrades the screen. Let the loop run out before
// counting, or the count is whatever it happened to be mid-flight.
await settle(16000)
const reads = (await (await fetch(`${STUB}/__received`)).json()).filter(
  (r) => r.method === 'GET' && r.path === '/api/booking/my',
)
check('always asked for a live read', reads.every((r) => r.refresh === '1'), true)
check('spent no more than the attempt cap', reads.length <= 6, true)
check('kept polling to try to upgrade pending', reads.length >= 2, true)

const errors = s.pageErrors().filter((e) => !/favicon|Failed to load resource|net::ERR/i.test(e))
check('no uncaught page errors', errors, [])

s.close()
console.log(`\nbooking: ${pass} passed, ${fails.length} failed`)
if (fails.length) { console.log('\nFAILURES:'); fails.forEach((f) => console.log('  - ' + f)); process.exit(1) }
