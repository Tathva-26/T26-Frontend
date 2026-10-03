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
const { validateContact, normalisePhone, toStoredPhone, isValidEmail, isValidPhone } =
  await import(`${ROOT}validation.js`)
const { applyUnauthorized, applySignedOut, isProfileComplete, SIGNED_OUT, LOADING, SESSION_EXPIRED } =
  await import(`${ROOT}session.js`)
const { USER } = await import(`${ROOT}mock/fixtures.js`)
const { toDraft, cleanName, validateProfile, changedFields, buildProfileFormData, hasChanges, avatarProblem } =
  await import(`${ROOT}profile.js`)
const { bookingStatus, byTiqrId, normaliseBooking, joinBookings, latestForEvent } =
  await import(`${ROOT}bookings.js`)
const { feeBreakdown, PLATFORM_FEE_RATE, GST_RATE } = await import(`${ROOT}fees.js`)
const { referralFromSearch } = await import(`${ROOT}referral.js`)
const {
  classifyBookingFailure, bookingBlocker, buildBookingBody, paymentOutcome,
  confirmationDelay, MAX_CONFIRMATION_ATTEMPTS, BOOKING_ACTION,
} = await import(`${ROOT}booking.js`)

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
// A transport failure has no body, so the caller's human sentence wins over
// axios's internal "Network Error" / "timeout of 0ms exceeded".
check('transport error uses fallback', apiErrorMessage({ message: 'Network Error' }, 'Could not reach the server.'), 'Could not reach the server.')
check('transport error default fallback', apiErrorMessage({ message: 'Network Error' }), 'Something went wrong. Please try again.')
check('server message still wins', apiErrorMessage({ response: { data: { error: 'Booking rejected' } } }, 'nope'), 'Booking rejected')
check('empty body fallback', apiErrorMessage({ response: { data: {} } }), 'Something went wrong. Please try again.')
check('no code', apiErrorCode({ response: { data: {} } }), null)
check('no field errors', apiFieldErrors({ response: { data: { error: 'x' } } }), {})

/* ---- contact form validation ---- */
const GOOD = { topic: 'Sponsorship', name: 'Ada', email: 'a@b.com', phone: '9876543210', query: 'Hello' }
check('valid contact passes', validateContact(GOOD), {})
check('all fields required', Object.keys(validateContact({})).sort(), ['email', 'name', 'phone', 'query', 'topic'])
check('whitespace is not a value', validateContact({ ...GOOD, name: '   ' }).name, 'Enter your name')
check('bad email caught', validateContact({ ...GOOD, email: 'a@b' }).email, 'Enter a valid email address')
check('bad email no at', validateContact({ ...GOOD, email: 'ab.com' }).email, 'Enter a valid email address')
check('short phone caught', validateContact({ ...GOOD, phone: '12345' }).phone, 'Enter a valid phone number')
check('lettered phone caught', validateContact({ ...GOOD, phone: '98765abcde' }).phone, 'Enter a valid phone number')
// Separators are cosmetic, and the backend ignores them too.
check('spaced phone accepted', validateContact({ ...GOOD, phone: '98765 43210' }), {})
check('dashed phone accepted', validateContact({ ...GOOD, phone: '98765-43210' }), {})
check('+91 phone accepted', validateContact({ ...GOOD, phone: '+919876543210' }), {})
check('15 digits accepted', validateContact({ ...GOOD, phone: '123456789012345' }), {})
check('16 digits rejected', Boolean(validateContact({ ...GOOD, phone: '1234567890123456' }).phone), true)
// A required-field message must win over a format message for the same field.
check('empty phone message', validateContact({ ...GOOD, phone: '' }).phone, 'Enter your phone number')
check('empty email message', validateContact({ ...GOOD, email: '' }).email, 'Enter your email')
check('normalisePhone', normalisePhone(' (98765) 43-210 '), '9876543210')
check('toStoredPhone strips 91', toStoredPhone('+91 98765 43210'), '9876543210')
check('toStoredPhone strips leading 0', toStoredPhone('09876543210'), '9876543210')
check('toStoredPhone leaves plain', toStoredPhone('9876543210'), '9876543210')
check('isValidEmail', [isValidEmail('a@b.co'), isValidEmail('a b@c.co'), isValidEmail('')], [true, false, false])
check('isValidPhone', [isValidPhone('9876543210'), isValidPhone('123'), isValidPhone(null)], [true, false, false])

/* ---- session state machine ---- */
const SIGNED_IN = { status: 'signedIn', user: { ...USER }, message: null }

// A 401 while holding a profile is a real expiry and worth telling them about.
check('401 while signed in expires', applyUnauthorized(SIGNED_IN), {
  status: 'signedOut', user: null, message: SESSION_EXPIRED,
})
// A signed-out visitor's first GET /api/user/ also 401s. Telling them their
// session expired would be untrue, so this stays silent.
check('401 during initial load is silent', applyUnauthorized(LOADING), SIGNED_OUT)
check('401 while already signed out is a no-op', applyUnauthorized(SIGNED_OUT), SIGNED_OUT)
// A message already on screen must not be wiped by a later 401.
const withMessage = { ...SIGNED_OUT, message: SESSION_EXPIRED }
check('401 keeps an existing message', applyUnauthorized(withMessage), withMessage)
check('signed-out load keeps the expiry message', applySignedOut(withMessage), withMessage)
check('signed-out load from clean state', applySignedOut(LOADING), SIGNED_OUT)

check('complete profile', isProfileComplete(USER), true)
check('no user is not complete', isProfileComplete(null), false)
for (const field of ['phone', 'college', 'district', 'state', 'branch', 'semester', 'year']) {
  check(`missing ${field} is incomplete`, isProfileComplete({ ...USER, [field]: null }), false)
  check(`empty ${field} is incomplete`, isProfileComplete({ ...USER, [field]: '' }), false)
}
// semester/year are numbers, and 0 is not a valid value but is falsy — the
// check must look at presence, not truthiness.
check('semester 0 counts as present', isProfileComplete({ ...USER, semester: 0 }), true)

/* ---- profile editing ---- */
check('toDraft stringifies', toDraft(USER).semester, '5')
check('toDraft nulls become empty', toDraft({ ...USER, college: null }).college, '')
check('toDraft of nothing', toDraft(null).name, '')

check('cleanName collapses whitespace', cleanName('  Ada   Lovelace  '), 'Ada Lovelace')
check('cleanName strips angle brackets', cleanName('Ada <script>'), 'Ada script')
check('cleanName strips zero-width', cleanName('Ada​Lovelace'), 'AdaLovelace')
check('cleanName normalises to NFC', cleanName('Áda') === 'Áda', true)

const DRAFT = toDraft(USER)
check('a clean draft validates', validateProfile(DRAFT, USER), {})
check('name is required', validateProfile({ ...DRAFT, name: '  ' }, USER).name, 'Enter your name')
check('phone is required', validateProfile({ ...DRAFT, phone: '' }, USER).phone, 'Enter your phone number')
check('college is required', validateProfile({ ...DRAFT, college: '' }, USER).college, 'Enter your college')
check('name over 50 rejected', Boolean(validateProfile({ ...DRAFT, name: 'a'.repeat(51) }, USER).name), true)
check('name of exactly 50 ok', validateProfile({ ...DRAFT, name: 'a'.repeat(50) }, USER).name, undefined)
check('bad phone rejected', validateProfile({ ...DRAFT, phone: '123' }, USER).phone, 'Enter a valid phone number')
check('semester 11 rejected', Boolean(validateProfile({ ...DRAFT, semester: '11' }, USER).semester), true)
check('semester 10 ok', validateProfile({ ...DRAFT, semester: '10' }, USER).semester, undefined)
check('year 6 rejected', Boolean(validateProfile({ ...DRAFT, year: '6' }, USER).year), true)
check('year 5 ok', validateProfile({ ...DRAFT, year: '5' }, USER).year, undefined)
// The endpoint 400s on an empty string and omitting the field keeps the old
// value, so clearing a set field has to be refused rather than look saved.
check('clearing a set field refused', validateProfile({ ...DRAFT, branch: '' }, USER).branch, 'Branch cannot be cleared once set')
// A field that was never set can stay empty.
check('empty stays fine when never set', validateProfile({ ...toDraft({ ...USER, branch: null }), branch: '' }, { ...USER, branch: null }).branch, undefined)

check('no changes means nothing to send', changedFields(USER, toDraft(USER)), {})
check('a changed name is sent', changedFields(USER, { ...DRAFT, name: 'Ada L' }), { name: 'Ada L' })
// The backend stores digits only and strips a leading 91 or 0, so the value
// read back differs from the value sent. That is not a change.
check('reformatted phone is not a change', changedFields(USER, { ...DRAFT, phone: '+91 98765 43210' }), {})
check('leading zero is not a change', changedFields(USER, { ...DRAFT, phone: '09876543210' }), {})
check('a real phone change is sent', changedFields(USER, { ...DRAFT, phone: '9000000000' }), { phone: '9000000000' })
check('semester is sent as a number', changedFields(USER, { ...DRAFT, semester: '7' }), { semester: 7 })
check('year is sent as a number', changedFields(USER, { ...DRAFT, year: '4' }), { year: 4 })
check('empty is never sent', changedFields(USER, { ...DRAFT, branch: '' }), {})
check('name is cleaned before comparing', changedFields(USER, { ...DRAFT, name: '  Ada   Lovelace ' }), {})
check('role is never sendable', 'role' in changedFields({ ...USER, role: 'USER' }, { ...DRAFT, role: 'ADMIN' }), false)

const fd = buildProfileFormData({ name: 'Ada L', semester: 7 })
check('form data carries the fields', [fd.get('name'), fd.get('semester')], ['Ada L', '7'])
check('form data has no image without one', fd.get('image'), null)
check('hasChanges with fields', hasChanges({ name: 'x' }, null), true)
check('hasChanges with only an image', hasChanges({}, { size: 10, type: 'image/png' }), true)
check('hasChanges with nothing', hasChanges({}, null), false)

check('oversized avatar refused', Boolean(avatarProblem({ size: 500 * 1024, type: 'image/png' })), true)
check('400KB avatar accepted', avatarProblem({ size: 400 * 1024, type: 'image/png' }), null)
check('non-image refused', avatarProblem({ size: 10, type: 'application/pdf' }), 'Choose an image file.')
check('no file is not a problem', avatarProblem(null), null)

/* ---- bookings ---- */
check('status is case-insensitive', [bookingStatus({ status: 'confirmed' }), bookingStatus({ status: 'Pending' })], ['CONFIRMED', 'PENDING'])
check('unknown status passes through', bookingStatus({ status: 'refunded' }), 'REFUNDED')
check('missing status', bookingStatus({}), 'UNKNOWN')
check('unsynced events are not indexed', byTiqrId([{ id: 1, tiqrEventId: null }]).size, 0)

// The trap: ids from the two systems overlap. Joining on Event.id instead of
// tiqrEventId does not error, it attaches a plausible wrong title.
const SWAPPED = [
  { id: 900, tiqrEventId: 12, fullTitle: 'WRONG EVENT' },
  { id: 12, tiqrEventId: 900, fullTitle: 'RIGHT EVENT', venue: 'Audi', dateFull: '9 October 2026' },
]
const joined = normaliseBooking({ id: 1, status: 'CONFIRMED', quantity: 1, ticket: { event: 900, type: 'General', amount: 49900 }, created_at: '2026-09-19T12:00:00Z' }, byTiqrId(SWAPPED))
check('joins on tiqrEventId, not id', joined.title, 'RIGHT EVENT')
check('exposes our event id for linking', joined.eventId, 12)
check('amount formatted from paise', joined.amount, '₹499')
check('falls back to the ticket type', normaliseBooking({ id: 2, ticket: { event: 55, type: 'General' } }, byTiqrId(SWAPPED)).title, 'General')
check('no reference when absent', joined.reference, null)
check('reference used when present', normaliseBooking({ id: 3, booking_id: 'TQ-123', ticket: { event: 900 } }, byTiqrId(SWAPPED)).reference, 'TQ-123')

const twoBookings = [
  { id: 1, status: 'CONFIRMED', ticket: { event: 900 }, created_at: '2026-09-19T12:00:00Z' },
  { id: 2, status: 'PENDING', ticket: { event: 900 }, created_at: '2026-09-28T07:30:00Z' },
]
check('newest first', joinBookings(twoBookings, SWAPPED).map((b) => b.id), [2, 1])
check('latest for an event', latestForEvent(twoBookings, 900).id, 2)
check('latest for an unknown event', latestForEvent(twoBookings, 999), null)
check('latest needs an id', latestForEvent(twoBookings, null), null)
check('join tolerates junk', joinBookings(null, SWAPPED), [])

/* ---- checkout fee maths ---- */
check('fee rates', [PLATFORM_FEE_RATE, GST_RATE], [0.025, 0.18])
// A 499 rupee ticket: 1247 paise fee, 224 paise GST on the fee.
check('fees on 49900 paise', feeBreakdown(49900), { quantity: 1, base: 49900, platformFee: 1248, gst: 225, total: 51373 })
check('GST is on the fee, not the ticket', feeBreakdown(49900).gst, Math.round(Math.round(49900 * 0.025) * 0.18))
check('a free event stays free', feeBreakdown(0), { quantity: 1, base: 0, platformFee: 0, gst: 0, total: 0 })
check('no price means no total', feeBreakdown(null), null)
check('quantity multiplies the base', feeBreakdown(49900, 2).base, 99800)
check('bad quantity falls back to 1', feeBreakdown(49900, 0).quantity, 1)
check('fees are whole paise', Number.isInteger(feeBreakdown(33333).total), true)

/* ---- referral capture ---- */
check('referral_code read', referralFromSearch('?referral_code=AB12CD'), 'AB12CD')
check('legacy ref read', referralFromSearch('?ref=AB12CD'), 'AB12CD')
check('referral_code wins over ref', referralFromSearch('?ref=OLD123&referral_code=NEW456'), 'NEW456')
check('lowercase upcased', referralFromSearch('?ref=ab12cd'), 'AB12CD')
check('junk rejected', referralFromSearch('?ref=<script>'), null)
check('too short rejected', referralFromSearch('?ref=AB'), null)
check('absent is null', referralFromSearch('?utm=x'), null)
check('empty search', referralFromSearch(''), null)
check('no leading question mark needed', referralFromSearch('ref=AB12CD'), 'AB12CD')

/* ---- the booking failure table ---- */
// Each status is a different thing to tell the buyer. Collapsing them loses
// whether trying again could possibly work.
const fail401 = classifyBookingFailure({ status: 401 })
check('401 asks for sign-in', [fail401.action, fail401.retryable], [BOOKING_ACTION.SIGN_IN, false])

const failPhone = classifyBookingFailure({ status: 400, message: 'Add a phone number to your profile before booking' })
check('missing phone routes to the profile', failPhone.action, BOOKING_ACTION.COMPLETE_PROFILE)
check('missing phone is not retryable as-is', failPhone.retryable, false)

const failReferral = classifyBookingFailure({ status: 400, message: 'Booking rejected' })
check('rejection clears the code', failReferral.clearReferral, true)
check('rejection is retryable', failReferral.retryable, true)
check('rejection says TIQR refused', failReferral.message, 'TIQR rejected booking.')

const failDuplicate = classifyBookingFailure({ status: 400, message: 'You have already registered for this event' })
check('duplicate is not retryable', failDuplicate.retryable, false)
check('duplicate does not clear the referral', failDuplicate.clearReferral, false)

check('not open', classifyBookingFailure({ status: 400, message: 'Event is not open for booking' }).message, 'Booking is not open for this event.')

const needPass = classifyBookingFailure({ status: 403, code: 'PASSCODE_REQUIRED', message: 'Passcode required' })
check('passcode required reveals the field', [needPass.needsPasscode, needPass.action], [true, BOOKING_ACTION.PASSCODE])
const badPass = classifyBookingFailure({ status: 403, code: 'PASSCODE_INVALID', message: 'Invalid passcode' })
check('passcode invalid is retryable', [badPass.needsPasscode, badPass.retryable], [true, true])
// The code is read before the status, so a passcode case is never mistaken
// for a generic 403.
check('code wins over status', classifyBookingFailure({ status: 403, code: 'PASSCODE_INVALID' }).action, BOOKING_ACTION.PASSCODE)

check('404', classifyBookingFailure({ status: 404, message: 'Event not found' }).message, 'This event could not be found.')
// OPEN but never synced to TIQR: no ticket exists, so retrying cannot help.
check('409 is not retryable', classifyBookingFailure({ status: 409 }).retryable, false)
check('502 is retryable', classifyBookingFailure({ status: 502 }).retryable, true)
check('transport failure is retryable', classifyBookingFailure({ status: null }).retryable, true)
// A cross-origin write from an unlisted origin arrives as exactly this.
check('bare Forbidden is not shown raw', classifyBookingFailure({ status: 403, message: 'Forbidden' }).message, 'This booking was refused. Please try again later.')
check('nothing known still says something', Boolean(classifyBookingFailure({}).message), true)

/* ---- whether booking is even possible ---- */
const OPEN_EVENT = { id: 12, status: 'OPEN', bookable: true, ticketId: 777 }
const WITH_PHONE = { phone: '9876543210' }
check('open event with a phone is bookable', bookingBlocker(OPEN_EVENT, WITH_PHONE).blocked, false)
check('closed event blocked', bookingBlocker({ ...OPEN_EVENT, status: 'CLOSED', bookable: false }, WITH_PHONE).reason, 'closed')
// OPEN locally but the TIQR push failed, so there is no ticket to sell.
check('unsynced event blocked', bookingBlocker({ ...OPEN_EVENT, bookable: false }, WITH_PHONE).reason, 'unsynced')
check('signed out blocked', bookingBlocker(OPEN_EVENT, null).reason, 'signIn')
check('no phone blocked', bookingBlocker(OPEN_EVENT, { phone: null }).reason, 'phone')
check('no event blocked', bookingBlocker(null, WITH_PHONE).reason, 'missing')

/* ---- the request body ---- */
check('our event id, quantity, nothing else', buildBookingBody({ eventId: 12 }), { eventId: 12, quantity: 1 })
check('passcode included when given', buildBookingBody({ eventId: 12, passcode: ' s3cret ' }).passcode, 's3cret')
check('blank passcode omitted', 'passcode' in buildBookingBody({ eventId: 12, passcode: '   ' }), false)
check('referral included when held', buildBookingBody({ eventId: 12, referralCode: 'AB12CD' }).referralCode, 'AB12CD')
check('no referral key when none', 'referralCode' in buildBookingBody({ eventId: 12, referralCode: null }), false)

/* ---- coming back from payment ---- */
check('attempt cap', MAX_CONFIRMATION_ATTEMPTS, 6)
// The server debounces a live read to ten seconds and says how long is left;
// polling faster only collects cache hits.
check('waits out the debounce', confirmationDelay(10000), 10250)
check('two second floor', confirmationDelay(0), 2000)
check('floor when absent', confirmationDelay(undefined), 2000)
check('floor when nonsense', confirmationDelay(-5), 2000)

const CONFIRMED = { status: 'CONFIRMED' }
check('confirmed booking', paymentOutcome({ booking: CONFIRMED, attemptsLeft: 5 }), 'confirmed')
check('pending once attempts run out', paymentOutcome({ booking: { status: 'PENDING' }, attemptsLeft: 0 }), 'pending')
check('still polling', paymentOutcome({ booking: null, attemptsLeft: 3 }), 'processing')
// The query string says charged but nothing reached TIQR. Saying "failed"
// here would be wrong: the money may well have left.
check('charged but missing', paymentOutcome({ booking: null, chargeStatus: 'CHARGED', attemptsLeft: 0 }), 'charged')
check('charged is case-insensitive', paymentOutcome({ booking: null, chargeStatus: 'charged', attemptsLeft: 0 }), 'charged')
check('nothing at all', paymentOutcome({ booking: null, chargeStatus: null, attemptsLeft: 0 }), 'missing')
// A charge claim can never outrank an actual confirmed booking, nor invent one.
check('a booking outranks the query', paymentOutcome({ booking: CONFIRMED, chargeStatus: 'FAILED', attemptsLeft: 0 }), 'confirmed')
check('no booking is never confirmed', paymentOutcome({ booking: null, chargeStatus: 'CHARGED', attemptsLeft: 0 }) === 'confirmed', false)

/* ---- the multipart profile save, through the mock adapter ---- */
// The profile form always sends FormData. The stub covers the real network
// path; this covers the mock path, which is what development runs on.
const savedForm = await api.put(PATHS.user, buildProfileFormData({ name: 'Grace Hopper', semester: 6 }), {
  headers: { 'Content-Type': undefined },
})
check('mock accepts FormData', savedForm.status, 200)
check('mock applied the form fields', [savedForm.data.user.name, savedForm.data.user.semester], ['Grace Hopper', 6])
check('refCode mirrored for older clients', 'refCode' in savedForm.data.user, true)
await api.put(PATHS.user, buildProfileFormData({}), { headers: { 'Content-Type': undefined } }).then(
  () => check('empty form rejected', 'resolved', '400'),
  (e) => check('empty form rejected', apiErrorMessage(e), 'No valid fields to update'),
)

console.log(`\n${pass} passed, ${fails.length} failed`)
if (fails.length) {
  console.log('\nFAILURES:')
  for (const f of fails) console.log('  - ' + f)
  process.exit(1)
}
