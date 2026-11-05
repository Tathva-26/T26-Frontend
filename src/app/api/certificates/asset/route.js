// GET ?k=<asset id> with header X-S: <session>
// A design file for a signed-in visitor, scrambled per session (see server.js).
import { checkSession, scrambledAsset } from '@/lib/certificates/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'private, no-store' }

export function GET(request) {
  const token = request.headers.get('x-s')
  if (!checkSession(token)) return Response.json({ error: 'auth' }, { status: 401, headers: noStore })
  const bytes = scrambledAsset(new URL(request.url).searchParams.get('k') || '', token)
  if (!bytes) return Response.json({ error: 'missing' }, { status: 404, headers: noStore })
  return new Response(bytes, { headers: { ...noStore, 'Content-Type': 'application/octet-stream' } })
}
