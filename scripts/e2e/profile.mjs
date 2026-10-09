/**
 * End-to-end check for the profile page, run against the stub backend over
 * real HTTP so the request itself can be inspected.
 *
 *   node scripts/e2e/stub-backend.mjs &
 *   NEXT_PUBLIC_USE_MOCK_DATA=false \
 *     NEXT_PUBLIC_BACKEND_URL=http://localhost:8787 npm run dev &
 *   node scripts/e2e/profile.mjs
 *
 * The axios mock adapter cannot cover this: it short-circuits the network, so
 * it cannot show whether a save left the browser as multipart with a boundary
 * or as JSON, and a JSON body silently drops the file.
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

const receivedPuts = async () =>
  (await (await fetch(`${STUB}/__received`)).json()).filter((r) => r.method === 'PUT')

await fetch(`${STUB}/__reset`)
// A ten second debounce, so the refresh countdown is deterministic here
// rather than depending on the stub's default.
await fetch(`${STUB}/__config?refreshableInMs=10000`)

const s = await session()
const settle = (ms) => new Promise((r) => setTimeout(r, ms))

const waitFor = async (expression, tries = 80) => {
  for (let i = 0; i < tries; i += 1) {
    const ok = await s.evaluate(expression).catch(() => false)
    if (ok) return true
    await settle(250)
  }
  return false
}

await s.goto(`${BASE}/profile`)
check('profile loads for a signed-in user', await waitFor(`/Ada Lovelace/.test(document.body.innerText)`), true)

// innerText reflects CSS text-transform, and .fieldLabel is uppercased, so
// label assertions compare case-insensitively.
const text = () => s.evaluate('document.body.innerText')
const textLower = async () => (await text()).toLowerCase()

/* ---- what the page shows ---- */
let body = await text()
check('email shown', body.includes('ada@example.com'), true)
check('semester row exists', (await textLower()).includes('semester'), true)
check('year row exists', (await textLower()).includes('year of study'), true)
check('no phone warning when a phone is set', body.includes('registrations are rejected'), false)

/* ---- bookings, joined on tiqrEventId ---- */
check('booking title joined from our event', await waitFor(`/Deep Space Robotics/.test(document.body.innerText)`), true)
body = await text()
check('status pill shown', body.includes('CONFIRMED'), true)
check('amount formatted from paise', body.includes('₹499'), true)
// refreshableInMs is 10000, so a live read is not possible yet.
const refreshBtn = await s.evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => /REFRESH/.test(x.textContent));
  return { text: b.textContent.trim(), disabled: b.disabled };
})()`)
check('refresh counts the debounce down', /REFRESH \(\d+s\)/.test(refreshBtn.text), true)
check('refresh disabled during the debounce', refreshBtn.disabled, true)

/* ---- the editor ---- */
const openEditor = `(() => {
  document.querySelector('[aria-label="Change profile photo"]').click();
  return true;
})()`
const setField = (key, value) => `(() => {
  const el = document.querySelector('#profile-edit-${key}');
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement : HTMLInputElement;
  Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return el.value;
})()`
const save = `(() => { document.querySelector('form').requestSubmit(); return true; })()`
const modalOpen = `!!document.querySelector('#profile-edit-name')`

await s.evaluate(openEditor)
check('editor opens', await waitFor(modalOpen), true)
check('name prefilled', await s.evaluate(`document.querySelector('#profile-edit-name').value`), 'Ada Lovelace')
check('semester prefilled', await s.evaluate(`document.querySelector('#profile-edit-semester').value`), '5')
check('semester offers 10 options plus "Not set"', await s.evaluate(`document.querySelectorAll('#profile-edit-semester option').length`), 11)
check('year offers 5 options plus "Not set"', await s.evaluate(`document.querySelectorAll('#profile-edit-year option').length`), 6)

/* clearing a required field is refused, with nothing sent */
await s.evaluate(setField('name', ''))
await s.evaluate(save)
await settle(600)
check('empty name refused', (await text()).includes('Enter your name'), true)
check('nothing sent for an invalid save', (await receivedPuts()).length, 0)

/* clearing a field that is already set is refused, because the endpoint
   400s on an empty string and omitting it would look saved but change nothing */
await s.evaluate(setField('name', 'Ada Lovelace'))
await s.evaluate(setField('branch', ''))
await s.evaluate(save)
await settle(600)
check('clearing a set field refused', (await text()).includes('Branch cannot be cleared once set'), true)
check('still nothing sent', (await receivedPuts()).length, 0)

/* a real change goes out as multipart carrying only what changed */
await s.evaluate(setField('branch', 'CSE'))
await s.evaluate(setField('semester', '7'))
await s.evaluate(save)
check('editor closes after saving', await waitFor(`!(${modalOpen})`), true)

const puts = await receivedPuts()
check('exactly one request sent', puts.length, 1)
check('sent as multipart', puts[0]?.isMultipart, true)
check('browser set a boundary', puts[0]?.hasBoundary, true)
check('not sent as JSON', puts[0]?.rawIsJson, false)
check('carried only the changed field', Object.keys(puts[0]?.fields ?? {}), ['semester'])
check('semester sent as the new value', puts[0]?.fields?.semester, '7')
check(
  'page reflects the saved value',
  await waitFor(`/semester[\\s\\S]{0,40}\\b7\\b/i.test(document.body.innerText)`),
  true,
)

/* a reformatted phone is not a change, so no request at all */
await fetch(`${STUB}/__reset`)
await fetch(`${STUB}/__config?refreshableInMs=10000`)
await s.evaluate(openEditor)
await waitFor(modalOpen)
await s.evaluate(setField('phone', '+91 98765 43210'))
await s.evaluate(save)
check('editor closes with nothing to save', await waitFor(`!(${modalOpen})`), true)
check('reformatted phone sends no request', (await receivedPuts()).length, 0)

/* an oversized avatar is refused before any request */
await s.evaluate(openEditor)
await waitFor(modalOpen)
await s.evaluate(`(() => {
  const input = document.querySelector('input[type="file"]');
  const file = new File([new Uint8Array(500 * 1024)], 'big.png', { type: 'image/png' });
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`)
await settle(500)
check('oversized avatar refused client-side', /The limit is 400 KB/.test(await text()), true)
await s.evaluate(save)
await settle(600)
check('oversized avatar sends no request', (await receivedPuts()).length, 0)

/* a small avatar is accepted and travels with the text fields */
await s.evaluate(`(() => {
  const input = document.querySelector('input[type="file"]');
  const file = new File([new Uint8Array(2048)], 'small.png', { type: 'image/png' });
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`)
await settle(400)
await s.evaluate(save)
check('avatar-only save closes the editor', await waitFor(`!(${modalOpen})`), true)
const avatarPuts = await receivedPuts()
check('avatar sent in one multipart request', avatarPuts.length, 1)
check('the file arrived', Object.keys(avatarPuts[0]?.files ?? {}), ['image'])
check('no stray text fields alongside it', Object.keys(avatarPuts[0]?.fields ?? {}), [])

const errors = s.pageErrors().filter((e) => !/favicon|Failed to load resource|net::ERR/i.test(e))
check('no uncaught page errors', errors, [])

s.close()
console.log(`\nprofile: ${pass} passed, ${fails.length} failed`)
if (fails.length) { console.log('\nFAILURES:'); fails.forEach((f) => console.log('  - ' + f)); process.exit(1) }
