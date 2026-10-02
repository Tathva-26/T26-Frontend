/**
 * Contract check for the backend integration layer.
 *
 *   npm run check:api
 *
 * Runs src/lib/{api,format,events}.js against the mock adapter in
 * src/lib/mock/ and asserts the things that have bitten this project before:
 * paise formatting, IST dates, venue objects, draft filtering, list-vs-detail
 * field sets, event ordering, the three error-body shapes, the passcode codes,
 * and the ?refresh=1 debounce.
 *
 * This tests OUR side of the contract, not the live API. When the backend
 * changes a response shape, update src/lib/mock/fixtures.js in the same
 * commit and this will tell you what else has to move.
 */

process.env.NEXT_PUBLIC_USE_MOCK_DATA = 'true'
delete process.env.NEXT_PUBLIC_BACKEND_URL
delete process.env.NEXT_PUBLIC_API

const ROOT = new URL('../src/lib/', import.meta.url).href
const { api, apiErrorMessage, apiErrorCode, apiFieldErrors, apiErrorStatus, PATHS, API_ORIGIN, USE_MOCK_DATA } =
  await import(`${ROOT}api.js`)
const { formatPrice, toRupees, eventDateParts, formatTimeRange, formatDuration, venueName, venueLabel } =
  await import(`${ROOT}format.js`)
const { normaliseEvents, normaliseEvent, isBookable } = await import(`${ROOT}events.js`)

let pass = 0
const fails = []
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) pass += 1
  else fails.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`)
}

/* ---- config ---- */
check('mock mode on', USE_MOCK_DATA, true)
check('origin', API_ORIGIN, 'http://localhost:8000')

/* ---- money ---- */
check('price 0', formatPrice(0), 'Free')
check('price null', formatPrice(null), 'TBA')
check('price undefined', formatPrice(undefined), 'TBA')
check('price 25000', formatPrice(25000), '₹250')
check('price 25050', formatPrice(25050), '₹250.50')
check('price 199900', formatPrice(199900), '₹1,999')
check('price 12000000', formatPrice(12000000), '₹1,20,000')
check('toRupees', toRupees(49900), 499)
check('toRupees null', toRupees(null), null)

/* ---- dates, in IST ---- */
check('date parts', eventDateParts('2026-10-09T10:00:00+05:30'), {
  day: '09', month: 'OCT', year: '2026', weekday: 'FRI', full: '9 October 2026',
})
check('date parts bad', eventDateParts('not-a-date'), null)
check('date parts null', eventDateParts(null), null)
// A UTC instant must render in IST, not UTC: 04:30Z is 10:00 IST.
check('utc to IST', eventDateParts('2026-10-09T04:30:00Z').day, '09')
check('time range', formatTimeRange('2026-10-09T10:00:00+05:30', '2026-10-09T16:00:00+05:30'), '10:00 AM - 4:00 PM IST')
check('time range no end', formatTimeRange('2026-10-09T10:00:00+05:30', null, null), '10:00 AM IST')
check('time range fallback', formatTimeRange(null, null, '2026-10-09T17:00:00+05:30'), '5:00 PM IST')
check('time range none', formatTimeRange(null, null, null), null)
check('duration 6h', formatDuration('2026-10-09T10:00:00+05:30', '2026-10-09T16:00:00+05:30'), '6 Hours')
check('duration 1h30', formatDuration('2026-10-09T17:00:00+05:30', '2026-10-09T18:30:00+05:30'), '1 Hour 30 Minutes')
check('duration null', formatDuration(null, null), null)

/* ---- venue is an object ---- */
check('venueName obj', venueName({ id: 2, name: 'Lab 4', location: 'CSE' }), 'Lab 4')
check('venueName null', venueName(null), null)
check('venueLabel', venueLabel({ id: 2, name: 'Lab 4', location: 'CSE' }), 'Lab 4 - CSE')
check('venueLabel no loc', venueLabel({ name: 'Audi', location: null }), 'Audi')
check('no [object Object]', `${venueName({ name: 'Audi' })}`.includes('[object'), false)

/* ---- list route ---- */
const list = await api.get(PATHS.eventsAll, { params: { type: 'workshops' } })
check('list envelope', Array.isArray(list.data.events), true)
check('workshops count', list.data.events.length, 4)
check('no drafts served', list.data.events.some((e) => e.status === 'DRAFT'), false)
check('list venue is {name} only', Object.keys(list.data.events.find((e) => e.venue)?.venue ?? {}), ['name'])
check('list omits detail fields', 'extraInfo' in list.data.events[0], false)

const all = await api.get(PATHS.eventsAll)
check('all types, drafts excluded', all.data.events.length, 10)

/* ---- normalisation + ordering ---- */
const cards = normaliseEvents(list.data.events, { label: 'Workshop', fallbackImage: '/images/fallback.jpg' })
check('order: closed sinks last', cards.at(-1).status, 'CLOSED')
check('order: unsynced after bookable', cards.map((c) => c.bookable), [true, true, false, false])
check('bookable ids in date order', cards.filter((c) => c.bookable).map((c) => c.id), [12, 13])
check('fallback image used', cards.find((c) => c.id === 13).image, '/images/fallback.jpg')
check('heading not name', cards.find((c) => c.id === 12).fullTitle, 'Deep Space Robotics & Autonomous Navigation')
check('committee to category', cards.find((c) => c.id === 12).category, 'Workshop Committee')
// Production holds five spellings of one committee, some with trailing space.
check('committee trimmed', cards.find((c) => c.id === 13).category, 'Workshop committee')
check('empty committee becomes null', cards.find((c) => c.id === 15).category, null)
// The API serialises in UTC; 04:30Z must render as the 9th in IST, not the 8th.
check('utc datetime renders in IST', cards.find((c) => c.id === 12).dateDay, '09')
check('utc datetime IST time', cards.find((c) => c.id === 12).time, '10:00 AM IST')
// `time` is in the temp frontend's contract but absent from the live API:
// prefer it when sent, derive it when not.
check(
  'api-sent time wins',
  normaliseEvent({ id: 1, heading: 'x', time: ' 10:00 AM - 1:00 PM IST ', datetime: '2026-10-09T04:30:00.000Z' }).time,
  '10:00 AM - 1:00 PM IST',
)
check(
  'time derived when absent',
  normaliseEvent({ id: 1, heading: 'x', datetime: '2026-10-09T04:30:00.000Z' }).time,
  '10:00 AM IST',
)
// The old UI searched item.instructor, which has no backend field, so
// .toLowerCase() on undefined threw. Views filter on this instead.
check('searchText is a string', typeof cards[0].searchText, 'string')
check('searchText has no undefined', cards.some((c) => c.searchText.includes('undefined')), false)
check('searchText matches heading', cards.find((c) => c.id === 12).searchText.includes('deep space'), true)
check('searchText matches venue', cards.find((c) => c.id === 12).searchText.includes('lab 4'), true)
check('searchText survives empty committee', typeof cards.find((c) => c.id === 15).searchText, 'string')
check('fee formatted', cards.find((c) => c.id === 12).fee, '₹499')
check('free event fee', cards.find((c) => c.id === 15).fee, 'Free')
check('venue flattened', cards.find((c) => c.id === 12).venue, 'Lab 4, Tech Block')
check('label applied', cards[0].title, 'Workshop')
check('orphan fields absent', ['spotsLeft', 'instructor', 'activityPoints', 'prerequisites', 'badge'].filter((k) => k in cards[0]), [])
check('open-but-unsynced not bookable', isBookable({ status: 'OPEN', ticketId: null }), false)
check('open+ticket bookable', isBookable({ status: 'OPEN', ticketId: 1 }), true)
check('closed not bookable', isBookable({ status: 'CLOSED', ticketId: 1 }), false)
// A list event has no startTime, so duration is unavailable there by design.
check('list duration unavailable', cards.find((c) => c.id === 12).duration, null)
check('normalise junk', normaliseEvent(null), null)

/* ---- detail route ---- */
const detail = await api.get(PATHS.eventDetails(12))
check('detail envelope', typeof detail.data.event, 'object')
check('detail has full venue', Object.keys(detail.data.event.venue).sort(), ['id', 'location', 'name'])
check('detail has extraInfo', 'extraInfo' in detail.data.event, true)
const detailCard = normaliseEvent(detail.data.event, { label: 'Workshop' })
check('detail duration', detailCard.duration, '6 Hours')
check('detail time range', detailCard.time, '10:00 AM - 4:00 PM IST')
check('detail venueFull', detailCard.venueFull, 'Lab 4, Tech Block - CSE Department')

await api.get(PATHS.eventDetails('abc')).then(
  () => check('non-numeric id rejected', 'resolved', '400'),
  (e) => check('non-numeric id rejected', apiErrorStatus(e), 400),
)
await api.get(PATHS.eventDetails(90)).then(
  () => check('draft detail hidden', 'resolved', '404'),
  (e) => check('draft detail hidden', apiErrorStatus(e), 404),
)

/* ---- error shapes ---- */
await api.post(PATHS.contactCreate, { topic: 'x' }).then(
  () => check('contact validation', 'resolved', '400'),
  (e) => {
    check('contact 400', apiErrorStatus(e), 400)
    check('message-key error read', apiErrorMessage(e), 'All fields are required')
  },
)
const contact = await api.post(PATHS.contactCreate, {
  topic: 'Sponsorship', name: 'Ada', email: 'a@b.com', phone: '9876543210', query: 'Hello',
})
check('contact 201 only', contact.status, 201)

await api.put(PATHS.user, { phone: '12' }).then(
  () => check('zod array error', 'resolved', '400'),
  (e) => {
    check('zod array message', apiErrorMessage(e), 'Enter a valid phone number')
    check('zod field errors', apiFieldErrors(e), { phone: 'Enter a valid phone number' })
  },
)
await api.put(PATHS.user, { role: 'ADMIN' }).then(
  () => check('role rejected', 'resolved', '403'),
  (e) => check('role rejected', apiErrorStatus(e), 403),
)
await api.put(PATHS.user, { college: '' }).then(
  () => check('empty string rejected', 'resolved', '400'),
  (e) => check('empty string message', apiErrorMessage(e), 'college cannot be empty'),
)
await api.put(PATHS.user, { nickname: 'x' }).then(
  () => check('no valid fields', 'resolved', '400'),
  (e) => check('no valid fields', apiErrorMessage(e), 'No valid fields to update'),
)
const saved = await api.put(PATHS.user, { phone: '+91 98765 43211', name: '  Ada   <Lovelace>  ' })
check('phone normalised like backend', saved.data.user.phone, '9876543211')
check('name cleaned like backend', saved.data.user.name, 'Ada Lovelace')
check('PUT wraps in user', 'user' in saved.data, true)

const me = await api.get(PATHS.user)
check('GET user is flat', 'user' in me.data, false)
check('GET user id', me.data.id, 'V1StGXR8_Z')

/* ---- booking ---- */
await api.post(PATHS.bookingCreate, { eventId: 13, quantity: 1 }).then(
  () => check('passcode required', 'resolved', '403'),
  (e) => check('PASSCODE_REQUIRED code', apiErrorCode(e), 'PASSCODE_REQUIRED'),
)
await api.post(PATHS.bookingCreate, { eventId: 13, quantity: 1, passcode: 'wrong' }).then(
  () => check('passcode invalid', 'resolved', '403'),
  (e) => check('PASSCODE_INVALID code', apiErrorCode(e), 'PASSCODE_INVALID'),
)
await api.post(PATHS.bookingCreate, { eventId: 14, quantity: 1 }).then(
  () => check('unsynced 409', 'resolved', '409'),
  (e) => check('unsynced 409', apiErrorStatus(e), 409),
)
await api.post(PATHS.bookingCreate, { eventId: 90, quantity: 1 }).then(
  () => check('draft booking 404', 'resolved', '404'),
  (e) => check('draft booking 404', apiErrorStatus(e), 404),
)
// A CONFIRMED booking already exists for event 12 (tiqrEventId 900).
await api.post(PATHS.bookingCreate, { eventId: 12, quantity: 1 }).then(
  () => check('already registered', 'resolved', '400'),
  (e) => check('already registered', apiErrorMessage(e), 'You have already registered for this event'),
)
// Event 20's only booking is PENDING, so an abandoned payment must not block a retry.
const retry = await api.post(PATHS.bookingCreate, { eventId: 20, quantity: 1 })
check('pending booking does not block retry', retry.status, 201)
const booked = await api.post(PATHS.bookingCreate, { eventId: 13, quantity: 1, passcode: 'tathva26' })
check('booking 201', booked.status, 201)
check('redir_url present', booked.data.redir_url.startsWith('/events/13?status=CHARGED'), true)

/* ---- booking/my debounce ---- */
const first = await api.get(PATHS.bookingMy, { params: { refresh: 1 } })
check('bookings envelope', Object.keys(first.data).sort(), ['bookings', 'cachedAt', 'count', 'refreshableInMs', 'refreshed'])
check('first refresh hits', first.data.refreshed, true)
const second = await api.get(PATHS.bookingMy, { params: { refresh: 1 } })
check('second refresh debounced', second.data.refreshed, false)
check('refreshableInMs is a positive number', second.data.refreshableInMs > 0 && second.data.refreshableInMs <= 10000, true)
check('booking joins on tiqr id', first.data.bookings[0].ticket.event, 900)

/* ---- unmounted routers ---- */
for (const [label, path] of [['announcements', PATHS.announcements], ['tiqr-events', '/api/tiqr-events/']]) {
  await api.get(path).then(
    () => check(`${label} 404`, 'resolved', '404'),
    (e) => check(`${label} 404`, apiErrorStatus(e), 404),
  )
}

/* ---- error helper edge cases ---- */
check('bare string body', apiErrorMessage({ response: { data: 'boom' } }), 'boom')
check('network error', apiErrorMessage({ message: 'Network Error' }), 'Network Error')
check('empty body fallback', apiErrorMessage({ response: { data: {} } }), 'Something went wrong. Please try again.')
check('no code', apiErrorCode({ response: { data: {} } }), null)
check('no field errors', apiFieldErrors({ response: { data: { error: 'x' } } }), {})

console.log(`\n${pass} passed, ${fails.length} failed`)
if (fails.length) {
  console.log('\nFAILURES:')
  for (const f of fails) console.log('  - ' + f)
  process.exit(1)
}
