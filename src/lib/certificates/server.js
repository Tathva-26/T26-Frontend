// Server-side helpers for the certificates API routes (Vercel serverless
// functions - no separate backend). Only imported by src/app/api/certificates/*.
//
// certificates-data/bundle.bin holds the recipients (by email) and the design
// files, encrypted because this repo is public. It's written by
// certificate-tathva/web/export-site.mjs. Env (Vercel project settings):
//   CERT_DATA_KEY                  base64 AES-256 key for bundle.bin
//   CERT_SESSION_SECRET            HMAC key for the short-lived download session
//   NEXT_PUBLIC_GOOGLE_CLIENT_ID   OAuth client the sign-in popup uses
import { createDecipheriv, createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'

const SESSION_TTL_SECONDS = 30 * 60

let bundle
function data() {
  if (!bundle) {
    const raw = readFileSync(join(process.cwd(), 'certificates-data', 'bundle.bin'))
    const key = Buffer.from(process.env.CERT_DATA_KEY || '', 'base64')
    const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12))
    decipher.setAuthTag(raw.subarray(12, 28))
    const json = gunzipSync(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]))
    bundle = JSON.parse(json.toString())
  }
  return bundle
}

// Gmail ignores dots and anything after "+", and googlemail.com is the same
// inbox, so "a.b+x@gmail.com" finds the certificates registered as "ab@gmail.com".
// Must match normaliseEmail in certificate-tathva/web/export-site.mjs.
export function normaliseEmail(email) {
  const [local, domain] = String(email).trim().toLowerCase().split('@')
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${local.split('+')[0].replace(/\./g, '')}@gmail.com`
  }
  // NIT Calicut addresses are firstname_rollno@nitc.ac.in and the roll number is
  // unique, so match on it alone (some sheets give only a roll number).
  const roll = domain === 'nitc.ac.in' && /_([a-z]\d{6}[a-z]{2})$/.exec(local)
  if (roll) return `${roll[1]}@nitc.ac.in`
  return `${local}@${domain}`
}

export function certificatesFor(email) {
  return data().r[normaliseEmail(email)] || []
}

/**
 * Checks an access token from the Google sign-in popup with Google itself and
 * returns the verified email. The token must have been issued to our client.
 */
export async function verifyGoogleToken(token) {
  if (!token) throw new Error('no token')
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('invalid token')
  const info = await res.json()
  if (info.aud !== process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) throw new Error('token for another app')
  if (!info.email || String(info.email_verified) !== 'true') throw new Error('email not verified')
  return info.email
}

function secret() {
  const value = process.env.CERT_SESSION_SECRET
  if (!value || value.length < 32) throw new Error('CERT_SESSION_SECRET must be set (32+ characters)')
  return value
}

// Short-lived token proving the browser signed in; required to fetch designs.
export function issueSession(email) {
  const body = Buffer.from(
    JSON.stringify({ e: normaliseEmail(email), x: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }),
  ).toString('base64url')
  return `${body}.${createHmac('sha256', secret()).update(body).digest('base64url')}`
}

export function checkSession(token) {
  const [body, mac] = String(token || '').split('.')
  if (!body || !mac) return null
  const expected = createHmac('sha256', secret()).update(body).digest()
  const given = Buffer.from(mac, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  const session = JSON.parse(Buffer.from(body, 'base64url').toString())
  return session.x > Date.now() / 1000 ? session : null
}

/**
 * A design file (template PDF or font) XOR-scrambled with a key derived from
 * the session, so designs never travel as recognisable files. The page reverses
 * it with the same derivation.
 */
export function scrambledAsset(id, token) {
  const b64 = data().a[id]
  if (!b64) return null
  const bytes = Buffer.from(b64, 'base64')
  const key = createHash('sha256').update(`${token}:${id}`).digest()
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= key[i % key.length] ^ ((i * 151) & 255)
  return bytes
}
