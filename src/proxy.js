import { NextResponse } from 'next/server'

/**
 * The payment gateway (Easebuzz, behind TIQR) returns the buyer by POSTing a
 * form to `callback_url`, not by a GET. /accommodation is a static page, and
 * static pages only answer GET, so every return landed on a 405. (/events/[id]
 * never hit this because it is rendered per request.)
 *
 * Answer the POST with a 303 to the same path, which the browser follows as a
 * GET. Only `status` is carried over: the form also holds the buyer's name,
 * email and phone, and none of that belongs in a URL.
 */
export async function proxy(request) {
  if (request.method !== 'POST') return NextResponse.next()

  const url = request.nextUrl.clone()

  try {
    const form = await request.formData()
    const status = form.get('status')
    if (typeof status === 'string' && status && !url.searchParams.has('status')) {
      url.searchParams.set('status', status.slice(0, 40))
    }
  } catch {
    // No readable form: still send the buyer back to the page.
  }

  return NextResponse.redirect(url, 303)
}

export const config = {
  matcher: '/accommodation',
}
