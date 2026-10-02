/**
 * A stub of the Tathva API, on node:http with no dependencies.
 *
 *   node scripts/e2e/stub-backend.mjs            # listens on 8787
 *
 * This exists so the app can be driven over real HTTP rather than through the
 * axios mock adapter. The mock adapter short-circuits the network, which
 * means it cannot prove the things that actually break in production:
 *
 *   - that a profile save goes out as multipart/form-data with a boundary
 *     the browser chose, rather than as JSON
 *   - that credentials are attached
 *   - that CORS is satisfied, including the preflight on a write
 *
 * It mirrors the documented response shapes, not the real backend's data.
 * `GET /__received` returns what it has been sent, for assertions.
 */

import { createServer } from 'node:http'

const PORT = Number(process.env.STUB_PORT || 8787)
const ORIGIN = process.env.STUB_ALLOW_ORIGIN || 'http://localhost:3000'

const received = []

let user = {
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
}

const events = [
  {
    id: 12, tiqrEventId: 900, ticketId: 777, type: 'workshops',
    heading: 'Deep Space Robotics', datetime: '2026-10-09T04:30:00.000Z',
    price: 49900, description: 'Autonomous rover guidance.',
    picture: null, committee: 'Workshop Committee', status: 'OPEN',
    passcodeRequired: false, venue: { name: 'Lab 4' },
  },
]

const bookings = [
  {
    id: 1001,
    ticket: { id: 777, type: 'General', amount: 49900, event: 900 },
    email: 'ada@example.com', status: 'CONFIRMED', quantity: 1,
    created_at: '2026-09-19T12:00:00Z',
  },
]

function cors(req, res) {
  const origin = req.headers.origin
  // Fails closed, exactly like the real backend: an unlisted origin gets no
  // allow-origin header, so the browser rejects the response.
  if (origin === ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
}

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
  })

/** Enough multipart parsing to see which fields a request carried. */
function parseMultipart(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '')
  if (!match) return null

  const boundary = `--${match[1] || match[2]}`
  const fields = {}
  const files = {}

  for (const part of buffer.toString('binary').split(boundary)) {
    const split = part.indexOf('\r\n\r\n')
    if (split === -1) continue

    const headers = part.slice(0, split)
    const name = /name="([^"]+)"/.exec(headers)?.[1]
    if (!name) continue

    const value = part.slice(split + 4).replace(/\r\n$/, '')
    if (/filename="/.test(headers)) files[name] = { bytes: value.length }
    else fields[name] = value
  }

  return { fields, files }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  cors(req, res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (url.pathname === '/__received') return json(res, 200, received)

  if (url.pathname === '/__reset') {
    received.length = 0
    user = { ...user, name: 'Ada Lovelace', semester: 5, year: 3, branch: 'CSE' }
    return json(res, 200, { ok: true })
  }

  if (url.pathname === '/healthz') return json(res, 200, { ok: true })
  if (url.pathname === '/api/auth/ok') return json(res, 200, { ok: true })

  if (url.pathname === '/api/events/all' && req.method === 'GET') {
    return json(res, 200, { events })
  }

  if (url.pathname === '/api/booking/my' && req.method === 'GET') {
    const fresh = url.searchParams.get('refresh')
    return json(res, 200, {
      bookings, count: bookings.length, cachedAt: Date.now(),
      refreshed: Boolean(fresh), refreshableInMs: 10000,
    })
  }

  if (url.pathname === '/api/user/' && req.method === 'GET') {
    // Flat, with no { user } wrapper.
    return json(res, 200, user)
  }

  if (url.pathname === '/api/user/' && req.method === 'PUT') {
    const raw = await readBody(req)
    const contentType = req.headers['content-type'] || ''
    const parsed = parseMultipart(raw, contentType)

    received.push({
      method: 'PUT',
      path: url.pathname,
      contentType,
      isMultipart: /^multipart\/form-data/.test(contentType),
      hasBoundary: /boundary=/.test(contentType),
      fields: parsed?.fields ?? null,
      files: parsed?.files ?? null,
      rawIsJson: contentType.includes('application/json'),
    })

    if (!parsed) return json(res, 400, { error: 'Expected multipart/form-data' })
    if ('role' in parsed.fields) return json(res, 403, { error: 'Role cannot be updated here' })
    if (Object.keys(parsed.fields).length === 0 && Object.keys(parsed.files).length === 0) {
      return json(res, 400, { error: 'No valid fields to update' })
    }

    for (const [key, value] of Object.entries(parsed.fields)) {
      user[key] = key === 'semester' || key === 'year' ? Number(value) : value
    }
    if (parsed.files.image) user.picture = 'http://localhost:8787/stub-avatar.webp'

    return json(res, 200, { message: 'User updated successfully', user: { ...user, refCode: user.referralCode } })
  }

  json(res, 404, { error: 'Not Found' })
}).listen(PORT, () => {
  console.log(`stub backend on http://localhost:${PORT} (allowing ${ORIGIN})`)
})
