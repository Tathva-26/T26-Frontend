// POST { token } (Google access token from the sign-in popup)
//   -> { e: email, s: session, c: [[name, event, activity, team, role, layout], ...] }
import { certificatesFor, issueSession, verifyGoogleToken } from '@/lib/certificates/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'private, no-store' }

export async function POST(request) {
  let email
  try {
    const { token } = await request.json()
    email = await verifyGoogleToken(token)
  } catch {
    return Response.json({ error: 'auth' }, { status: 401, headers: noStore })
  }
  return Response.json({ e: email, s: issueSession(email), c: certificatesFor(email) }, { headers: noStore })
}
