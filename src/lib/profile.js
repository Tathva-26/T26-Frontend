/**
 * Profile editing rules, mirrored from `PUT /api/user/`.
 *
 * Two things about that endpoint shape everything here:
 *
 *   - Exactly eight fields are accepted and everything else is dropped.
 *     `role` is not merely ignored, it is a 403.
 *   - An empty string for any field is a 400. To leave a field alone you omit
 *     it, which means a field cannot be cleared once set, and the request has
 *     to carry only what actually changed.
 */

import { isValidPhone, normalisePhone, toStoredPhone } from './validation.js'

/** The only fields the endpoint accepts. Order matters for nothing. */
export const PROFILE_FIELDS = [
  'name',
  'phone',
  'college',
  'branch',
  'semester',
  'year',
  'district',
  'state',
]

const NUMERIC_FIELDS = { semester: { min: 1, max: 10 }, year: { min: 1, max: 5 } }

/** Fields the UI insists on before a save, matching the form's own markers. */
const REQUIRED_FIELDS = ['name', 'phone', 'college']

export const LABELS = {
  name: 'Name',
  phone: 'Phone Number',
  college: 'College',
  branch: 'Branch',
  semester: 'Semester',
  year: 'Year of Study',
  district: 'District',
  state: 'State',
}

/**
 * Mirrors the backend's own cleaning: NFC normalised, angle brackets and
 * control/zero-width characters stripped, whitespace collapsed. Applied
 * before length checks so "a" padded with zero-width spaces is not accepted
 * here and then rejected there.
 */
export function cleanName(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/[<>]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

/** A user object to editable form values, all as strings. */
export function toDraft(user) {
  const draft = {}
  for (const field of PROFILE_FIELDS) {
    const value = user?.[field]
    draft[field] = value === null || value === undefined ? '' : String(value)
  }
  return draft
}

/**
 * `{ field: message }`, empty when the draft is acceptable.
 *
 * A field that currently holds a value cannot be emptied, because the backend
 * refuses an empty string and omitting it would silently keep the old value
 * while appearing to have saved the change.
 */
export function validateProfile(draft, user = null) {
  const errors = {}

  for (const field of PROFILE_FIELDS) {
    const raw = draft?.[field]
    const value = field === 'name' ? cleanName(raw) : String(raw ?? '').trim()

    if (!value) {
      const hadValue = user?.[field] !== null && user?.[field] !== undefined && user?.[field] !== ''
      if (REQUIRED_FIELDS.includes(field)) {
        errors[field] = `Enter your ${LABELS[field].toLowerCase()}`
      } else if (hadValue) {
        errors[field] = `${LABELS[field]} cannot be cleared once set`
      }
      continue
    }

    if (field === 'name' && value.length > 50) {
      errors.name = 'Name must be 50 characters or fewer'
      continue
    }

    if (field === 'phone' && !isValidPhone(value)) {
      errors.phone = 'Enter a valid phone number'
      continue
    }

    const range = NUMERIC_FIELDS[field]
    if (range) {
      const parsed = Number(value)
      if (!Number.isInteger(parsed) || parsed < range.min || parsed > range.max) {
        errors[field] = `${LABELS[field]} must be between ${range.min} and ${range.max}`
      }
    }
  }

  return errors
}

/**
 * Only the fields that actually changed, typed as the endpoint wants them.
 *
 * Phone is compared after normalising both sides, because the backend stores
 * digits only and strips a leading 91 or 0 — so "+91 98765 43210" read back
 * as "9876543210" is not a change, and sending it every save would be noise.
 *
 * Empty values are never included: they would 400, and there is no way to
 * clear a field through this endpoint.
 */
export function changedFields(user, draft) {
  const changed = {}

  for (const field of PROFILE_FIELDS) {
    const raw = draft?.[field]
    if (raw === null || raw === undefined || String(raw).trim() === '') continue

    if (field === 'phone') {
      if (toStoredPhone(raw) !== toStoredPhone(user?.phone)) {
        changed.phone = normalisePhone(raw)
      }
      continue
    }

    if (NUMERIC_FIELDS[field]) {
      const parsed = Number(String(raw).trim())
      if (Number.isInteger(parsed) && parsed !== Number(user?.[field])) {
        changed[field] = parsed
      }
      continue
    }

    const value = field === 'name' ? cleanName(raw) : String(raw).trim()
    const current = user?.[field] === null || user?.[field] === undefined ? '' : String(user[field])
    if (value !== current) changed[field] = value
  }

  return changed
}

/** 400 KB, the server's hard ceiling for a profile picture. */
export const MAX_AVATAR_BYTES = 400 * 1024

export function avatarProblem(file) {
  if (!file) return null
  if (!String(file.type || '').startsWith('image/')) return 'Choose an image file.'
  if (file.size > MAX_AVATAR_BYTES) {
    return `That image is ${Math.round(file.size / 1024)} KB. The limit is 400 KB.`
  }
  return null
}

/**
 * The request body. Sent as multipart always, so an optional avatar travels
 * with the text fields in one request rather than needing a second call.
 *
 * Content-Type is deliberately not set anywhere: the browser has to choose
 * the multipart boundary itself.
 */
export function buildProfileFormData(changed, imageFile = null) {
  const form = new FormData()

  for (const [field, value] of Object.entries(changed)) {
    form.append(field, String(value))
  }

  if (imageFile) form.append('image', imageFile)

  return form
}

/** Nothing to send means nothing to do — the endpoint 400s on an empty body. */
export function hasChanges(changed, imageFile = null) {
  return Object.keys(changed).length > 0 || Boolean(imageFile)
}
