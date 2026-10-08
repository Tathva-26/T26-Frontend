/**
 * The boundary between the backend's `Event` and the shape the cards render.
 *
 * Everything the UI used to hardcode is derived here, once, so the view files
 * never touch a raw API field. Three traps this exists to close:
 *
 *   - `Event.id` (ours) and `tiqrEventId` (TIQR's) are not interchangeable.
 *     Booking takes ours; joining a booking to an event takes theirs.
 *   - `venue` is an object, so interpolating it renders "[object Object]".
 *   - `price` is integer paise, so a 250 rupee workshop arrives as 25000.
 */

import {
  eventDateParts,
  formatDuration,
  formatPrice,
  formatTimeRange,
  venueLabel,
  venueName,
} from './format.js'

/**
 * Bookability is two conditions, not one. An event can be `OPEN` locally
 * while its push to TIQR never finished, which leaves `ticketId` null — and
 * booking it answers 409. Disabling it up front is kinder than letting the
 * user pick an event and then be refused at checkout.
 */
export function isBookable(event) {
  return event?.status === 'OPEN' && Boolean(event?.ticketId)
}

/** Lower sorts earlier: ready to book, then open-but-unsynced, then closed. */
function rank(event) {
  if (isBookable(event)) return 0
  if (event?.status === 'OPEN') return 1
  return 2
}

function timeValue(iso) {
  if (!iso) return Number.POSITIVE_INFINITY
  const ms = new Date(iso).getTime()
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms
}

/**
 * `/api/events/all` has no `orderBy`, so row order is whatever Postgres
 * returns and can change between two identical calls. Nothing is renderable
 * until this has run.
 *
 * Takes raw events or normalised ones — both carry `status` and `ticketId`.
 */
export function sortEvents(events) {
  if (!Array.isArray(events)) return []

  return [...events].sort((a, b) => {
    const byRank = rank(a) - rank(b)
    if (byRank !== 0) return byRank

    return timeValue(a?.datetime) - timeValue(b?.datetime)
  })
}

/**
 * One raw event to the card/modal shape.
 *
 * `label` is the static kind shown on the card ("Workshop"), which is a view
 * decision rather than data. `fallbackImage` covers a null `picture`, since
 * `next/image` requires a `src`.
 *
 * Deliberately absent, because the backend has no field for them:
 * badge, instructor, activityPoints, prerequisites, and spotsLeft.
 * `ticketsRemaining` is a capacity seed that is never refreshed from TIQR,
 * so it must not be rendered as seats left.
 */
export function normaliseEvent(raw, { label = '', fallbackImage = null } = {}) {
  if (!raw || typeof raw !== 'object') return null

  const date = eventDateParts(raw.datetime)
  const bookable = isBookable(raw)

  const heading = typeof raw.heading === 'string' ? raw.heading : ''
  const description = typeof raw.description === 'string' ? raw.description : ''

  // Committee values are free text typed by admins, and production currently
  // holds five spellings of "Workshop Committee" plus two empty strings.
  // Trim here so the UI is not comparing or displaying whitespace.
  const committee =
    typeof raw.committee === 'string' ? raw.committee.trim() : ''

  // `time` is a pre-formatted display string in the temp frontend's contract,
  // but the live API does not send it on either route. Prefer it when it is
  // there, derive it otherwise — so this works whichever is true.
  const time =
    typeof raw.time === 'string' && raw.time.trim()
      ? raw.time.trim()
      : formatTimeRange(raw.startTime, raw.endTime, raw.datetime)

  return {
    // identity
    id: raw.id,
    tiqrEventId: raw.tiqrEventId ?? null,
    ticketId: raw.ticketId ?? null,

    // state
    status: raw.status ?? null,
    bookable,
    bookingClosed: raw.status === 'CLOSED',
    passcodeRequired: Boolean(raw.passcodeRequired),

    // text
    title: label,
    fullTitle: heading,
    type: raw.type ?? null,
    category: committee || null,
    description,
    extraInfo: raw.extraInfo ?? null,

    // when
    datetime: raw.datetime ?? null,
    dateDay: date?.day ?? null,
    dateMonth: date?.month ?? null,
    dateFull: date?.full ?? null,
    time,
    duration: formatDuration(raw.startTime, raw.endTime),

    // where
    venue: venueName(raw.venue),
    venueFull: venueLabel(raw.venue),

    // money
    fee: formatPrice(raw.price),
    priceInPaise: typeof raw.price === 'number' ? raw.price : null,

    // media
    image: raw.picture || fallbackImage,

    // teams
    isTeamEvent: Boolean(raw.isTeamEvent),
    teamSize: raw.teamSize ?? null,

    /**
     * Lowercased haystack for the search box. Views filter on this rather
     * than reaching for individual fields: the old UI searched
     * `item.instructor`, which the API has no field for, and calling
     * `.toLowerCase()` on the resulting undefined throws.
     */
    searchText: [heading, label, committee, description, venueName(raw.venue)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }
}

/** Fetch-to-render in one step: normalise everything, then sort. */
export function normaliseEvents(events, options) {
  if (!Array.isArray(events)) return []

  return sortEvents(
    events.map((event) => normaliseEvent(event, options)).filter(Boolean),
  )
}

/**
 * Stopgap competition categories by keyword matching on heading + description.
 * 
 * Fragile by design: a cleverly-named new event will land in "Others" (or the
 * wrong bucket) until its keyword is added here. Verified against the 27 live
 * competitions on 2026-10-08.
 */
const COMPETITION_CATEGORY_RULES = [
  ['Passes', ['pass']],
  [
    'Robotics',
    [
      'robo',
      'robot',
      'tracercon',
      'soccer',
      'maze',
      'autonomous',
      'line-follow',
    ],
  ],
  [
    'Electronics',
    [
      'circuit',
      'electronic',
      'electrical',
      'watt',
      'pcb',
      'arduino',
      'embedded',
      'bomb',
      'solder',
    ],
  ],
  [
    'Code & Cyber',
    [
      'kod',
      'debug',
      'hack',
      'cyber',
      'ctf',
      'capture the flag',
      'coding',
      'hackerrank',
      'programmer',
    ],
  ],
  [
    'Design & Build',
    [
      'cad',
      'civil',
      'mechanic',
      'mech',
      'architect',
      'craft',
      'draft',
      'construction',
      'paper tower',
      'paper pinnacle',
      'infranox',
    ],
  ],
  [
    'Expo & Pitch',
    [
      // Word-boundary: a plain substring would match "expose" (as it did for
      // THE ASTRAEA INCIDENT, a murder-mystery that landed here wrongly).
      /\bexpo\b/,
      'exhibit',
      'pitch',
      'startup',
      'investor',
      'innovex',
      'dealx',
      'protopitch',
      'showcase',
    ],
  ],
]

export const COMPETITION_CATEGORY_ALL = 'All'
export const COMPETITION_CATEGORY_OTHER = 'Others'

/** Category chip order for the competitions page. */
export const COMPETITION_CATEGORIES = [
  ...COMPETITION_CATEGORY_RULES.map(([name]) => name),
  COMPETITION_CATEGORY_OTHER,
]

/** Takes a normalised event (or a raw one — both carry heading/description). */
export function competitionCategory(event) {
  const text =
    `${event?.fullTitle ?? event?.heading ?? ''} ${event?.description ?? ''}`.toLowerCase()

  for (const [name, keywords] of COMPETITION_CATEGORY_RULES) {
    if (
      keywords.some((keyword) =>
        keyword instanceof RegExp ? keyword.test(text) : text.includes(keyword),
      )
    ) {
      return name
    }
  }
  return COMPETITION_CATEGORY_OTHER
}
