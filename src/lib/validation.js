/**
 * Input rules mirrored from the backend, so a user is told what is wrong
 * before a round trip is spent finding out.
 *
 * These are deliberately no stricter than the server. A client rule the
 * server does not share rejects input the backend would have accepted, which
 * is worse than letting the request through and showing the real error.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** An optional leading +, then 10 to 15 digits. */
export const PHONE_PATTERN = /^\+?\d{10,15}$/

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value ?? '').trim())
}

/** Spaces and separators are cosmetic; the backend ignores them too. */
export function normalisePhone(value) {
  return String(value ?? '').replace(/[\s()-]/g, '')
}

export function isValidPhone(value) {
  return PHONE_PATTERN.test(normalisePhone(value))
}

/**
 * The profile endpoint stores digits only and strips a leading 91 or 0, so
 * what is read back there differs from what was sent. Used by the profile
 * form to compare against the stored value without reporting a false change.
 */
export function toStoredPhone(value) {
  return normalisePhone(value).replace(/^\+/, '').replace(/^(91|0)/, '')
}

/* ---- contact form ---------------------------------------------------- */

export const CONTACT_FIELDS = ['topic', 'name', 'email', 'phone', 'query']

const CONTACT_LABELS = {
  topic: 'a topic',
  name: 'your name',
  email: 'your email',
  phone: 'your phone number',
  query: 'your query',
}

/**
 * All five fields are required by the backend, which answers
 * `400 { message: "All fields are required" }` — note `message`, not `error`.
 *
 * Returns `{ field: message }`, empty when the input is acceptable.
 */
export function validateContact(values) {
  const errors = {}

  for (const field of CONTACT_FIELDS) {
    const value = String(values?.[field] ?? '').trim()
    if (!value) errors[field] = `Enter ${CONTACT_LABELS[field]}`
  }

  if (!errors.email && !isValidEmail(values?.email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!errors.phone && !isValidPhone(values?.phone)) {
    errors.phone = 'Enter a valid phone number'
  }

  return errors
}
