/**
 * Fixtures for `NEXT_PUBLIC_USE_MOCK_DATA=true`.
 *
 * These match the real envelopes, units and casing, and deliberately include
 * the awkward cases that have caused visible bugs before:
 *
 *   - two DRAFT events, which must never reach a public response
 *   - an OPEN event whose TIQR push failed, so `ticketId` is null
 *   - a CLOSED event, which stays in the list as "Booking closed"
 *   - a free event (price 0) and one with no price yet (null)
 *   - an event with no cover image
 *   - a passcode-gated event
 *   - `committee` values as production actually holds them: organiser names
 *     typed by hand, with a trailing space, a typo and an empty string. They
 *     are not event subjects, so nothing should render them as a category.
 *   - timestamps as UTC with milliseconds, which is how the live API
 *     serialises timestamptz — NOT with a +05:30 offset.
 *
 * If a response shape changes on the backend, change it here in the same
 * commit — this file doubles as the worked example of what the app expects.
 */

const VENUES = {
  audi: { id: 1, name: 'Main Auditorium', location: 'Near Gate 3' },
  lab4: { id: 2, name: 'Lab 4, Tech Block', location: 'CSE Department' },
  arena: { id: 3, name: 'Robotics Arena', location: 'Mechanical Block' },
  seminar: { id: 4, name: 'Seminar Complex', location: null },
}

/**
 * Full rows, as the detail route returns them. The list route projects a
 * trimmed subset off these — see `listFields` in ./index.js.
 */
export const EVENTS = [
  {
    id: 12,
    tiqrEventId: 900,
    ticketId: 777,
    type: 'workshops',
    heading: 'Deep Space Robotics & Autonomous Navigation',
    datetime: '2026-10-09T04:30:00.000Z',
    startTime: '2026-10-09T04:30:00.000Z',
    endTime: '2026-10-09T10:30:00.000Z',
    price: 49900,
    venueId: 2,
    venue: VENUES.lab4,
    description:
      'Autonomous rover guidance, spatial sensor fusion and zero-gravity control systems.',
    extraInfo:
      'Build and test a simulated lunar rover trajectory from scratch. Bring a laptop with Python 3.11 installed.',
    picture: '/images/dummy/poster.webp',
    teamSize: null,
    isTeamEvent: false,
    committee: 'Workshop Committee',
    ticketsRemaining: 150,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-08-01T03:30:00.000Z',
    updatedAt: '2026-09-20T03:30:00.000Z',
  },
  {
    id: 13,
    tiqrEventId: 901,
    ticketId: 778,
    type: 'workshops',
    heading: 'Next-Gen Humanoid & Cybernetic Systems',
    datetime: '2026-10-10T08:30:00.000Z',
    startTime: '2026-10-10T08:30:00.000Z',
    endTime: '2026-10-10T13:30:00.000Z',
    price: 54900,
    venueId: 3,
    venue: VENUES.arena,
    description: 'ROS2, kinematic simulation and computer vision for bipedal manipulation.',
    extraInfo: null,
    picture: '/images/dummy/poster.webp',
    teamSize: 3,
    isTeamEvent: true,
    committee: 'Workshop committee ',
    ticketsRemaining: 60,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: true, // exercises the passcode field at checkout
    createdAt: '2026-08-02T03:30:00.000Z',
    updatedAt: '2026-09-21T03:30:00.000Z',
  },
  {
    id: 14,
    tiqrEventId: 902,
    ticketId: null, // published here, but the TIQR push failed: booking would 409
    type: 'workshops',
    heading: 'Quantum Algorithms & Quantum Machine Learning',
    datetime: '2026-10-11T05:30:00.000Z',
    startTime: '2026-10-11T05:30:00.000Z',
    endTime: '2026-10-11T09:30:00.000Z',
    price: 44900,
    venueId: 4,
    venue: VENUES.seminar,
    description: 'Quantum superposition and entanglement, with circuits on Qiskit.',
    extraInfo: 'Linear algebra basics assumed.',
    picture: '/images/dummy/poster.webp',
    teamSize: null,
    isTeamEvent: false,
    committee: 'Workshop Committe',
    ticketsRemaining: 40,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-08-03T03:30:00.000Z',
    updatedAt: '2026-09-22T03:30:00.000Z',
  },
  {
    id: 15,
    tiqrEventId: 903,
    ticketId: 779,
    type: 'workshops',
    heading: 'Zero-Trust Cybersecurity & Threat Simulation',
    datetime: '2026-10-09T04:30:00.000Z',
    startTime: null,
    endTime: null,
    price: 0, // renders "Free"
    venueId: 2,
    venue: VENUES.lab4,
    description: 'Live-fire threat simulation against a zero-trust reference network.',
    extraInfo: null,
    picture: '/images/dummy/poster.webp',
    teamSize: null,
    isTeamEvent: false,
    committee: '',
    ticketsRemaining: 80,
    dynamicPricing: false,
    status: 'CLOSED', // stays in the list, renders "Booking closed"
    passcodeRequired: false,
    createdAt: '2026-08-04T03:30:00.000Z',
    updatedAt: '2026-09-25T03:30:00.000Z',
  },
  {
    id: 20,
    tiqrEventId: 910,
    ticketId: 790,
    type: 'competitions',
    heading: 'RoboWars 2026',
    datetime: '2026-10-10T03:30:00.000Z',
    startTime: '2026-10-10T03:30:00.000Z',
    endTime: '2026-10-10T12:30:00.000Z',
    price: 120000,
    venueId: 3,
    venue: VENUES.arena,
    description: 'Combat robotics, 15kg class, single elimination.',
    extraInfo: 'Teams of up to 5. Robot inspection closes an hour before the first bout.',
    picture: 'https://cdn.tathva.org/events/robowars.webp',
    teamSize: 5,
    isTeamEvent: true,
    committee: 'Program Committee',
    ticketsRemaining: 32,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-08-05T03:30:00.000Z',
    updatedAt: '2026-09-26T03:30:00.000Z',
  },
  {
    id: 21,
    tiqrEventId: 911,
    ticketId: 791,
    type: 'competitions',
    heading: 'Capture The Flag',
    datetime: '2026-10-11T04:30:00.000Z',
    startTime: '2026-10-11T04:30:00.000Z',
    endTime: '2026-10-11T16:30:00.000Z',
    price: 25000,
    venueId: 2,
    venue: VENUES.lab4,
    description: 'Twelve hours, four categories, one scoreboard.',
    extraInfo: null,
    picture: null,
    teamSize: 4,
    isTeamEvent: true,
    committee: '',
    ticketsRemaining: 100,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-08-06T03:30:00.000Z',
    updatedAt: '2026-09-27T03:30:00.000Z',
  },
  {
    id: 30,
    tiqrEventId: 920,
    ticketId: 800,
    type: 'lectures',
    heading: 'Building at the Edge of Physics',
    datetime: '2026-10-09T11:30:00.000Z',
    startTime: '2026-10-09T11:30:00.000Z',
    endTime: '2026-10-09T13:00:00.000Z',
    price: 0,
    venueId: 1,
    venue: VENUES.audi,
    description: 'A conversation on instrumentation, failure and the long game.',
    extraInfo: null,
    picture: 'https://cdn.tathva.org/events/edge-of-physics.webp',
    teamSize: null,
    isTeamEvent: false,
    committee: null,
    ticketsRemaining: 900,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-08-07T03:30:00.000Z',
    updatedAt: '2026-09-28T03:30:00.000Z',
  },
  {
    id: 31,
    tiqrEventId: 921,
    ticketId: 801,
    type: 'lectures',
    heading: 'What Comes After Transformers',
    datetime: '2026-10-10T10:30:00.000Z',
    startTime: null,
    endTime: null,
    price: null, // renders "TBA"
    venueId: 1,
    venue: VENUES.audi,
    description: 'Architectures, scaling limits and what the next decade asks for.',
    extraInfo: null,
    picture: null,
    teamSize: null,
    isTeamEvent: false,
    committee: null,
    ticketsRemaining: 900,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-08-08T03:30:00.000Z',
    updatedAt: '2026-09-29T03:30:00.000Z',
  },

  /* ---- passes: four, so the carousel's centre/left/right/far slots all
          get exercised. Prices are in paise, matching the live tickets
          (Rs 200 / 1,200 / 1,100 / 2,000). -------------------------------- */
  {
    id: 40,
    tiqrEventId: 930,
    ticketId: 810,
    type: 'passes',
    heading: 'Tathva Pass - All Days',
    datetime: '2026-10-08T18:30:00.000Z',
    startTime: '2026-10-08T18:30:00.000Z',
    endTime: '2026-10-11T18:29:00.000Z',
    price: 200000,
    venueId: null,
    venue: null,
    description: 'Proshow, events and conclave across all three days.',
    extraInfo: null,

    picture: 'https://cdn.tathva.org/events/506476dc-25d4-4813-8c88-c7344395c099.webp',
    teamSize: null,
    isTeamEvent: false,
    committee: null,
    ticketsRemaining: 4000,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-08-09T03:30:00.000Z',
    updatedAt: '2026-09-30T03:30:00.000Z',
  },
  {
    id: 42,
    tiqrEventId: 932,
    ticketId: 812,
    type: 'passes',
    heading: 'Tathva Pass - Day 2',
    datetime: '2026-10-09T18:30:00.000Z',
    startTime: null,
    endTime: null,
    price: 100000,
    venueId: null,
    venue: null,
    description: 'Proshow and events on day two.',
    extraInfo: null,
    picture: 'https://cdn-next-main.tathva.org/images/tickets/day2pass.webp',
    teamSize: null,
    isTeamEvent: false,
    committee: null,
    ticketsRemaining: 4000,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-08-11T03:30:00.000Z',
    updatedAt: '2026-09-30T03:30:00.000Z',
  },
  {
    id: 43,
    tiqrEventId: 933,
    ticketId: 813,
    type: 'passes',
    heading: 'Tathva Pass - Day 3',
    datetime: '2026-10-10T18:30:00.000Z',
    startTime: null,
    endTime: null,
    price: 110000,
    venueId: null,
    venue: null,
    description: 'Proshow and events on day three.',
    extraInfo: null,
    picture: 'https://cdn-next-main.tathva.org/images/tickets/day3pass.webp',
    teamSize: null,
    isTeamEvent: false,
    committee: null,
    ticketsRemaining: 4000,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-08-12T03:30:00.000Z',
    updatedAt: '2026-09-30T03:30:00.000Z',
  },
  {
    id: 41,
    tiqrEventId: 931,
    ticketId: 811,
    type: 'passes',
    heading: 'Tathva Pass - Day 1',
    datetime: '2026-10-08T18:30:00.000Z',
    startTime: null,
    endTime: null,
    price: 20000,
    venueId: null,
    venue: null,
    description: 'Wheels, RoboWars and the conclave on day one.',
    extraInfo: null,
    picture: 'https://cdn-next-main.tathva.org/images/tickets/day1pass.webp',
    teamSize: null,
    isTeamEvent: false,
    committee: null,
    ticketsRemaining: 4000,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-08-10T03:30:00.000Z',
    updatedAt: '2026-09-30T03:30:00.000Z',
  },
  {
    // The one bulk-bookable event (BULK_EVENTS in lib/booking.js).
    id: 105,
    tiqrEventId: 2243,
    ticketId: 3483,
    type: 'passes',
    heading: 'All Day Student Pass',
    datetime: '2026-10-08T18:30:00.000Z',
    startTime: '2026-10-08T18:30:00.000Z',
    endTime: '2026-10-09T18:29:00.000Z',
    price: 3000,
    venueId: null,
    venue: null,
    description: 'Entry for the day, with access to events across campus. Proshow not included.',
    extraInfo: null,
    picture: 'https://cdn.tathva.org/events/pass-day1.webp',
    teamSize: null,
    isTeamEvent: false,
    committee: null,
    ticketsRemaining: 999,
    dynamicPricing: false,
    status: 'OPEN',
    passcodeRequired: false,
    createdAt: '2026-10-06T14:45:12.204Z',
    updatedAt: '2026-10-06T15:43:31.888Z',
  },

  /* ---- drafts: these must NEVER appear in a public response ---------- */
  {
    id: 90,
    tiqrEventId: null,
    ticketId: null,
    type: 'workshops',
    heading: 'DRAFT - Unannounced Workshop',
    datetime: '2026-10-12T04:30:00.000Z',
    startTime: null,
    endTime: null,
    price: 30000,
    venueId: null,
    venue: null,
    description: 'If this is visible in the UI, the draft filter is broken.',
    extraInfo: null,
    picture: null,
    teamSize: null,
    isTeamEvent: false,
    committee: null,
    ticketsRemaining: 50,
    dynamicPricing: false,
    status: 'DRAFT',
    passcodeRequired: false,
    createdAt: '2026-09-01T03:30:00.000Z',
    updatedAt: '2026-09-01T03:30:00.000Z',
  },
  {
    id: 91,
    tiqrEventId: null,
    ticketId: null,
    type: 'competitions',
    heading: 'DRAFT - Unannounced Competition',
    datetime: '2026-10-12T08:30:00.000Z',
    startTime: null,
    endTime: null,
    price: 50000,
    venueId: null,
    venue: null,
    description: 'If this is visible in the UI, the draft filter is broken.',
    extraInfo: null,
    picture: null,
    teamSize: null,
    isTeamEvent: false,
    committee: null,
    ticketsRemaining: 50,
    dynamicPricing: false,
    status: 'DRAFT',
    passcodeRequired: false,
    createdAt: '2026-09-02T03:30:00.000Z',
    updatedAt: '2026-09-02T03:30:00.000Z',
  },
]

/** `GET /api/user/` — flat, with no `{ user }` wrapper. */
export const USER = {
  id: 'V1StGXR8_Z',
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  phone: '9876543210',
  referralCode: null,
  college: 'NIT Calicut',
  district: 'Kozhikode',
  state: 'Kerala',
  role: 'USER',
  branch: 'CSE',
  semester: 5,
  year: 3,
  picture: null,
  createdAt: '2026-07-01T03:30:00.000Z',
}

/**
 * `GET /api/booking/my` — TIQR's own snake_case, passed straight through.
 * `ticket.event` is TIQR's event id, so it joins on `Event.tiqrEventId`.
 */
export const BOOKINGS = [
  {
    id: 1001,
    ticket: { id: 777, type: 'General', amount: 49900, event: 900 },
    email: 'ada@example.com',
    first_name: 'Ada',
    last_name: 'Lovelace',
    status: 'CONFIRMED',
    quantity: 1,
    user: { id: 42, email: 'ada@example.com' },
    booked_by: null,
    referred_by: null,
    created_at: '2026-09-19T12:00:00Z',
  },
  {
    id: 1002,
    ticket: { id: 790, type: 'Team Entry', amount: 120000, event: 910 },
    email: 'ada@example.com',
    first_name: 'Ada',
    last_name: 'Lovelace',
    status: 'PENDING',
    quantity: 1,
    user: { id: 42, email: 'ada@example.com' },
    booked_by: null,
    referred_by: null,
    created_at: '2026-09-28T07:30:00Z',
  },
]

export const VENUE_LIST = Object.values(VENUES)

export const SEAT_COUNT = 3821

export const REFERRALS = {
  referralCode: 'AB12CD',
  successfulTicketCount: 5,
  successfulSalesAmount: 250000,
  registered: true,
}

/* ---- accommodation --------------------------------------------------- */

/**
 * Mirrors `GET /api/accommodation/options` exactly, including the shapes that
 * are awkward: the API serves THREE FLAT LISTS, not a nested catalogue, and
 * the page assembles its tier view from them.
 *
 * The edges worth exercising are all here:
 *
 *   - 4-sharing has no female stock, so it has no female SKU rows and no
 *     female availability row at all. A tier that simply does not exist for
 *     this buyer is different from one that sold out.
 *   - `byNight` differs across nights, because a stay occupies a RANGE: two
 *     bookings starting on different days still collide in the middle. A
 *     fixture with flat nights would hide every bug in that logic.
 *   - Enums are uppercase (MALE/FEMALE, VEG/NONVEG), matching the backend's
 *     Prisma enums rather than the lowercase ids a frontend would pick.
 *   - Prices are per WHOLE STAY. Three dormitory nights is less than three
 *     times one night, so nothing here can be derived by multiplication.
 */

const ROOM_PRICES = {
  dormitory: { 1: 20000, 2: 34000, 3: 48000 },
  'sharing-3': { 1: 100000, 2: 180000, 3: 265000 },
  'sharing-4': { 1: 110000, 2: 200000, 3: 290000 },
}

const STOCK = [
  { tier: 'dormitory', gender: 'MALE', unit: 'bed', total: 450 },
  { tier: 'dormitory', gender: 'FEMALE', unit: 'bed', total: 120 },
  { tier: 'sharing-3', gender: 'MALE', unit: 'room', total: 10 },
  { tier: 'sharing-3', gender: 'FEMALE', unit: 'room', total: 25 },
  { tier: 'sharing-4', gender: 'MALE', unit: 'room', total: 8 },
]

/** Units held on each night, so `byNight` is not uniformly the total. */
const HELD = {
  'sharing-4|MALE': { 1: 6, 2: 6, 3: 0 },
  'sharing-3|FEMALE': { 1: 0, 2: 25, 3: 0 },
}

export const ACCOMMODATION = {
  festNights: 3,
  checkIn: '11:00',
  checkOut: '10:00',
  notes: [
    'Check-in from 11:00 AM, check-out by 10:00 AM.',
    'Bring your own bedsheets.',
  ],

  rooms: STOCK.flatMap(({ tier, gender }) =>
    [1, 2, 3].map((nights) => ({
      tier,
      gender,
      nights,
      price: ROOM_PRICES[tier][nights],
      onSale: true,
    })),
  ),

  availability: STOCK.map(({ tier, gender, unit, total }) => {
    const held = HELD[`${tier}|${gender}`] ?? {}
    return {
      tier,
      gender,
      unit,
      total,
      byNight: {
        1: total - (held[1] ?? 0),
        2: total - (held[2] ?? 0),
        3: total - (held[3] ?? 0),
      },
    }
  }),
}

/** GET /api/food/options. Food is its own TIQR event, checked out separately. */
export const FOOD = {
  notes: ['Each coupon covers breakfast and lunch for its day.'],
  food: [1, 2, 3].flatMap((day) =>
    ['VEG', 'NONVEG'].map((diet) => ({ day, diet, price: 18000, onSale: true })),
  ),
}