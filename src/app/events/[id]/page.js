import { Suspense } from 'react'
import EventReturn from '@/pageComponents/EventReturn/EventReturn'

export const metadata = {
  title: "Your booking - Tathva '26",
}

/**
 * The payment return route. The backend hands TIQR
 * `{FRONTEND_URL}/events/{event.id}`, so this path and this id are fixed by
 * the API, not by us.
 *
 * `params` is a Promise in Next 16; synchronous access was removed.
 */
export default async function EventReturnPage({ params }) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#06070d] text-slate-100">
          <p className="text-sm text-slate-400">One moment.</p>
        </main>
      }
    >
      <EventReturn eventId={id} />
    </Suspense>
  )
}
