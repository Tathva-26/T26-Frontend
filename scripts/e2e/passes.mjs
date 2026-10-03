/**
 * End-to-end check for the passes carousel.
 *
 *   node scripts/e2e/stub-backend.mjs &
 *   NEXT_PUBLIC_USE_MOCK_DATA=false \
 *     NEXT_PUBLIC_BACKEND_URL=http://localhost:8787 npm run dev &
 *   node scripts/e2e/passes.mjs
 *
 * Every word on a pass ticket is baked into the bitmap inside its image, so the
 * artwork cannot be driven from the API. What the API drives is whether the
 * pass can actually be bought — which is the part that was missing.
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

const configure = (q) => fetch(`${STUB}/__config?${q}`)
const reset = () => fetch(`${STUB}/__reset`)
const posts = async () =>
  (await (await fetch(`${STUB}/__received`)).json()).filter((r) => r.method === 'POST')

const s = await session()
const settle = (ms) => new Promise((r) => setTimeout(r, ms))
const text = () => s.evaluate('document.body.innerText')
const waitFor = async (expr, tries = 80) => {
  for (let i = 0; i < tries; i += 1) {
    if (await s.evaluate(expr).catch(() => false)) return true
    await settle(250)
  }
  return false
}

const tickets = () =>
  s.evaluate(`[...document.querySelectorAll('img[alt^="Tathva Pass"]')].map(i => ({
    src: i.getAttribute('src').split('/').pop(),
    alt: i.getAttribute('alt'),
  }))`)

await reset()
await s.goto(`${BASE}/passes`)
check('the passes route exists', await waitFor(`/TATHVA PASSES/i.test(document.body.innerText)`), true)

/* ---- the artwork is labelled with what it actually pictures ---- */
// day3pass renders DAY 3, day1pass renders DAY 1 and day2pass renders the
// middle pass; the table once had two of the three alt texts swapped, so
// these checks keep the labelling honest.
const shown = await tickets()
check('three passes rendered', shown.length, 3)
const bySrc = Object.fromEntries(shown.map((t) => [t.src, t.alt]))
check('day3pass is labelled Day 3', /day 3/i.test(bySrc['day3pass.png'] || ''), true)
check('day1pass is labelled Day 1', /day 1/i.test(bySrc['day1pass.png'] || ''), true)
check('day2pass is labelled All Days', /all days/i.test(bySrc['day2pass.png'] || ''), true)

/* ---- the centred pass is the one the API can sell ---- */
check('centred pass named from the API', await waitFor(`/Tathva Pass - All Days/.test(document.body.innerText)`), true)
let body = await text()
check('its real price shown', body.includes('₹1,999'), true)
check('a register control is offered', /REGISTER/.test(body), true)

/* ---- the carousel moves between passes ---- */
await s.evaluate(`document.querySelector('[aria-label="Next ticket"]').click(); true`)
check('next pass loads its own event', await waitFor(`/Tathva Pass - Day 1/.test(document.body.innerText)`), true)
check('and its own price', /₹399/.test(await text()), true)

await s.evaluate(`document.querySelector('[aria-label="Previous ticket"]').click(); true`)
check('previous returns to all days', await waitFor(`/Tathva Pass - All Days/.test(document.body.innerText)`), true)

/* ---- booking a pass uses that pass's own event id ---- */
await s.evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => /^REGISTER$/.test(x.textContent.trim()));
  b.click();
  return true;
})()`)
check('booking a pass redirects to payment', await waitFor(`window.location.pathname === '/events/42'`, 60), true)
const sent = await posts()
check('the all-days event id was sent', sent[0]?.body?.eventId, 42)

/* ---- with no pass events, nothing promises a sale ---- */
// This is production's current state: the type exists in config but no event
// carries it, so ?type=pass comes back empty.
await reset()
await configure('passes=false')
await s.goto(`${BASE}/passes`)
check('artwork still renders without events', (await tickets()).length, 3)
check('no false promise of booking', await waitFor(`/REGISTRATIONS OPENING SOON/i.test(document.body.innerText)`), true)
body = await text()
check('no register button offered', /\bREGISTER\b/.test(body.replace(/REGISTRATIONS/g, '')), false)

const errors = s.pageErrors().filter((e) => !/favicon|Failed to load resource|net::ERR/i.test(e))
check('no uncaught page errors', errors, [])

s.close()
console.log(`\npasses: ${pass} passed, ${fails.length} failed`)
if (fails.length) { console.log('\nFAILURES:'); fails.forEach((f) => console.log('  - ' + f)); process.exit(1) }
