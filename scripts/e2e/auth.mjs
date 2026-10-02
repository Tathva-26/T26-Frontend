/**
 * End-to-end check for sign-in, sign-out and the OAuth callback.
 *
 *   BASE=http://localhost:3000 node scripts/e2e/auth.mjs
 *
 * Runs against NEXT_PUBLIC_USE_MOCK_DATA=true. Real OAuth cannot be mocked —
 * there is no Google and no cookie to set — so mock mode jumps straight to the
 * callback route, which means everything after sign-in is the production path.
 * What is NOT covered here is the Google round trip itself.
 */

import { session } from './cdp.mjs'

const BASE = process.env.BASE || 'http://localhost:3000'
let pass = 0
const fails = []
const check = (label, actual, expected) => {
  if (JSON.stringify(actual) === JSON.stringify(expected)) pass += 1
  else fails.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`)
}

const s = await session()
const settle = (ms) => new Promise((r) => setTimeout(r, ms))

const hydrated = async (selector = 'body') => {
  for (let i = 0; i < 80; i += 1) {
    const ok = await s.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      return !!el && Object.keys(el).some((k) => k.startsWith('__reactProps$'));
    })()`).catch(() => false)
    if (ok) return true
    await settle(250)
  }
  return false
}

const bodyText = () => s.evaluate('document.body.innerText')
const path = () => s.evaluate('window.location.pathname')
const setMockSession = (value) =>
  s.evaluate(`(() => { sessionStorage.setItem('tathva-mock-signed-in', ${JSON.stringify(String(value))}); return true; })()`)

/* ---- the callback page translates better-auth's error codes ---- */

const cases = [
  ['access_denied', '', 'Google sign-in was cancelled.'],
  ['state_not_found', '', 'Sign-in expired before it finished. Please try again.'],
  ['state_mismatch', '', 'Sign-in expired before it finished. Please try again.'],
  ['email_not_found', '', 'Google did not share an email address with us.'],
  ['unable_to_get_user_info', '', 'Could not read your Google profile.'],
  ['CA_REGISTRATIONS_CLOSED', '', 'Campus ambassador registrations are closed. Sign in normally instead.'],
  // An unrecognised code falls back to the description, then to a generic line.
  ['something_new', 'Google said no', 'Google said no'],
  ['something_new', '', 'Google sign-in could not be completed.'],
]

for (const [code, description, expected] of cases) {
  const qs = `?error=${encodeURIComponent(code)}${description ? `&error_description=${encodeURIComponent(description)}` : ''}`
  await s.goto(`${BASE}/auth/google/callback${qs}`)
  await hydrated()
  await settle(400)
  const text = await bodyText()
  check(`callback ${code}${description ? ' + description' : ''}`, text.includes(expected), true)
  check(`callback ${code}${description ? ' + description' : ''} stays put`, await path(), '/auth/google/callback')
}

/* ---- signed in: the nav reflects the session ---- */

await s.goto(`${BASE}/workshops`)
await hydrated()
await setMockSession(true)
await s.goto(`${BASE}/workshops`)
await hydrated('.nb__cta')
await settle(1200)

// FlipText splits the label into per-character spans and renders it twice
// (an outgoing and an incoming row) for its hover animation, so innerText
// comes back as "A\nd\na\nA\nd\na". Whitespace is not signal here.
const readCta = `(() => {
  const el = document.querySelector('.nb__cta');
  return { href: el.getAttribute('href'), text: el.textContent.replace(/\\s+/g, '') };
})()`

let cta = await s.evaluate(readCta)
check('signed-in CTA points at the profile', cta.href, '/profile')
check('signed-in CTA shows the first name', cta.text.includes('Ada'), true)
check('signed-in CTA is not a register prompt', cta.text.includes('Register'), false)

/* ---- signed out: the nav offers sign-in ---- */

await setMockSession(false)
await s.goto(`${BASE}/workshops`)
await hydrated('.nb__cta')
await settle(1200)

cta = await s.evaluate(readCta)
check('signed-out CTA still has a no-JS destination', cta.href, '/profile')
check('signed-out CTA prompts to register', cta.text.includes('Register'), true)

// A signed-out visitor must never be told their session expired.
check('no false expiry notice', (await bodyText()).includes('session expired'), false)

/* ---- clicking it signs in and lands on the profile ---- */

await s.evaluate(`document.querySelector('.nb__cta').click(); true`)
for (let i = 0; i < 60; i += 1) {
  if ((await path().catch(() => '')) === '/profile') break
  await settle(300)
}
check('sign-in ends on the profile', await path(), '/profile')
check('session persisted through the redirect', await s.evaluate(`sessionStorage.getItem('tathva-mock-signed-in')`), 'true')

/* ---- a successful callback redirects rather than dead-ending ---- */

await s.goto(`${BASE}/auth/google/callback`)
await hydrated()
for (let i = 0; i < 60; i += 1) {
  if ((await path().catch(() => '')) === '/profile') break
  await settle(300)
}
check('clean callback redirects to the profile', await path(), '/profile')

const errors = s.pageErrors().filter((e) => !/favicon|Failed to load resource|net::ERR/i.test(e))
check('no uncaught page errors', errors, [])

s.close()
console.log(`\nauth: ${pass} passed, ${fails.length} failed`)
if (fails.length) { console.log('\nFAILURES:'); fails.forEach((f) => console.log('  - ' + f)); process.exit(1) }
