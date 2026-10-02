/**
 * End-to-end check for the contact form, the app's first real write path.
 *
 *   MODE=mock    BASE=http://localhost:3000 node scripts/e2e/contact-form.mjs
 *   MODE=offline BASE=http://localhost:3000 node scripts/e2e/contact-form.mjs
 *
 * `mock` runs against NEXT_PUBLIC_USE_MOCK_DATA=true and covers validation,
 * a 201 success and the form clearing. `offline` wants a dev server started
 * with mocks off and NEXT_PUBLIC_BACKEND_URL pointing somewhere unreachable,
 * which is what a down API or an unlisted origin looks like from the browser;
 * it covers the failure message and that typed values survive.
 */

import { session } from './cdp.mjs'

const BASE = process.env.BASE || 'http://localhost:3000'
const MODE = process.env.MODE || 'mock' // 'mock' = happy path, 'offline' = failure path

let pass = 0
const fails = []
const check = (label, actual, expected) => {
  if (JSON.stringify(actual) === JSON.stringify(expected)) pass += 1
  else fails.push(`[${MODE}] ${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`)
}

const s = await session()
await s.goto(`${BASE}/contact-us`)

// React attaches __reactProps$<id> to the DOM nodes it owns, so this is a
// direct hydration signal. Submitting before it lands hits no handler at all.
for (let i = 0; i < 80; i += 1) {
  const hydrated = await s.evaluate(`(() => {
    const f = document.querySelector('form');
    return !!f && Object.keys(f).some((k) => k.startsWith('__reactProps$'));
  })()`)
  if (hydrated) break
  await new Promise((r) => setTimeout(r, 250))
}
check('form hydrated', await s.evaluate(`Object.keys(document.querySelector('form')).some(k=>k.startsWith('__reactProps$'))`), true)

const fill = (values) => `(() => {
  const set = (name, value) => {
    const el = document.querySelector('[name="' + name + '"]');
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  ${Object.entries(values).map(([k, v]) => `set(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('\n  ')}
  return true;
})()`

const submit = `(() => { document.querySelector('form').requestSubmit(); return true; })()`
const read = `(() => {
  const status = [...document.querySelectorAll('p[role="status"], p[role="alert"]')][0];
  return {
    status: status ? status.textContent.trim() : null,
    fieldErrors: [...document.querySelectorAll('span[id$="-error"]')].map(e => e.id.replace('contact-','').replace('-error','') + ': ' + e.textContent.trim()).sort(),
    invalid: [...document.querySelectorAll('[aria-invalid="true"]')].map(e => e.name).sort(),
    values: Object.fromEntries([...document.querySelectorAll('form [name]')].map(e => [e.name, e.value])),
    buttonText: document.querySelector('button[type="submit"]').textContent.trim(),
    buttonDisabled: document.querySelector('button[type="submit"]').disabled,
  };
})()`
const settle = (ms) => new Promise((r) => setTimeout(r, ms))
const GOOD = { topic: 'Sponsorship', name: 'Ada Lovelace', email: 'ada@example.com', phone: '98765 43210', query: 'Hello there' }

if (MODE === 'mock') {
  /* 1. empty submit is caught client-side */
  await s.evaluate(submit)
  await settle(500)
  let state = await s.evaluate(read)
  check('empty submit blocked', state.status, 'Check the highlighted fields and try again.')
  check('all five flagged', state.fieldErrors, [
    'email: Enter your email', 'name: Enter your name', 'phone: Enter your phone number',
    'query: Enter your query', 'topic: Enter a topic',
  ])
  check('all five aria-invalid', state.invalid, ['email', 'name', 'phone', 'query', 'topic'])

  /* 2. editing clears only that field's error */
  await s.evaluate(fill({ name: 'Ada Lovelace' }))
  await settle(300)
  state = await s.evaluate(read)
  check('edited field error cleared', state.invalid, ['email', 'phone', 'query', 'topic'])

  /* 3. a malformed email is a format error, not a missing-field error */
  await s.evaluate(fill({ topic: 'Sponsorship', email: 'ada@b', phone: '98765 43210', query: 'Hello there' }))
  await s.evaluate(submit)
  await settle(500)
  state = await s.evaluate(read)
  check('bad email flagged', state.fieldErrors, ['email: Enter a valid email address'])
  check('only email invalid', state.invalid, ['email'])

  /* 4. a good submit succeeds on 201 and clears the form */
  await s.evaluate(fill({ email: 'ada@example.com' }))
  await s.evaluate(submit)
  await settle(1800)
  state = await s.evaluate(read)
  check('success message', state.status, 'Thanks — your query has reached us.')
  check('form cleared on success', Object.values(state.values).every((v) => v === ''), true)
  check('no field errors after success', state.fieldErrors, [])
  check('button re-enabled', state.buttonDisabled, false)
  check('button label restored', state.buttonText.startsWith('Submit'), true)
} else {
  /* The backend is unreachable, which is what an unlisted origin or a down
     API looks like from the browser. The typed values must survive. */
  await s.evaluate(fill(GOOD))
  await s.evaluate(submit)
  await settle(3000)
  const state = await s.evaluate(read)
  check('failure reported', typeof state.status === 'string' && state.status.length > 0, true)
  check('not reported as success', state.status === 'Thanks — your query has reached us.', false)
  check('query preserved', state.values.query, GOOD.query)
  check('topic preserved', state.values.topic, GOOD.topic)
  check('email preserved', state.values.email, GOOD.email)
  check('button re-enabled after failure', state.buttonDisabled, false)
  check('button label restored', state.buttonText.startsWith('Submit'), true)
  console.log(`  (failure message shown: ${JSON.stringify(state.status)})`)
}

const errors = s.pageErrors().filter((e) => !/favicon|Failed to load resource|net::ERR|ERR_CONNECTION/i.test(e))
check('no uncaught page errors', errors, [])

s.close()
console.log(`\n${MODE}: ${pass} passed, ${fails.length} failed`)
if (fails.length) { console.log('\nFAILURES:'); fails.forEach((f) => console.log('  - ' + f)); process.exit(1) }
