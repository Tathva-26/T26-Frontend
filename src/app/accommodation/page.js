import { Suspense } from 'react'
import Accommodation from '@/pageComponents/Accomodation/Accommodation'

/**
 * Doubles as the payment return route: the booking call hands the gateway
 * `/accommodation?status=…`, so this page reads search params and therefore
 * needs a Suspense boundary, the same as the events return route.
 */
export default function Acc() {
  return (
    <Suspense
      fallback={
        <main className='flex min-h-dvh items-center justify-center bg-black text-white'>
          <p className='text-sm text-white/50'>One moment.</p>
        </main>
      }
    >
      <Accommodation />
    </Suspense>
  )
}
