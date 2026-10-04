'use client'

import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/pageComponents/Navbar/Navbar'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import Checkout from '@/components/Checkout/Checkout'
import { useEventDetails } from '@/hooks/useEventDetails'

const FALLBACK_IMAGE = 'https://cdn-next-main.tathva.org/images/workshops/workshop-astronaut.jpg'

const fontFaceStyles = `
@import url('https://fonts.googleapis.com/css2?family=Jaro:opsz@6..72&family=Jost:wght@400;600&display=swap');

@font-face {
  font-family: 'Event Detail Fragment Serif';
  src: url('https://cdn-next-main.tathva.org/fonts/PPFragment-SerifExtraBold.otf') format('opentype');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}

.event-detail-fragment-serif {
  font-family: 'Event Detail Fragment Serif', serif;
}

.event-detail-jaro {
  font-family: 'Jaro', sans-serif;
}
`

/**
 * The full-page replacement for what used to be the Workshops/Competitions/
 * Lectures detail modal. Same content, same data source (`useEventDetails`),
 * just routed to instead of opened over the list — so an event has its own
 * shareable URL (`/<eventType>/<id>`), matching how the old site worked.
 */
export default function EventDetailPage({ id, eventType, label, heading, backHref }) {
  const { event, loading, error, notFound } = useEventDetails(id, {
    label,
    fallbackImage: FALLBACK_IMAGE,
  })

  return (
    <div className='min-h-screen w-full bg-[#06070d] text-white'>
      <style>{fontFaceStyles}</style>
      <Navbar />
      <TathvaMenu />

      <main className='mx-auto w-full max-w-[1000px] px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8'>
        <Link
          href={backHref}
          className='mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white'
        >
          <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
          </svg>
          Back to {heading}
        </Link>

        {loading ? (
          <div className='flex min-h-[40vh] items-center justify-center'>
            <p className='text-sm tracking-[0.18em] text-white/60'>LOADING…</p>
          </div>
        ) : notFound ? (
          <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center'>
            <p className='text-lg font-semibold text-white'>This {label.toLowerCase()} could not be found.</p>
            <Link href={backHref} className='text-sm text-[#8f9cff] underline'>
              Back to {heading}
            </Link>
          </div>
        ) : error ? (
          <div className='flex min-h-[40vh] items-center justify-center text-center'>
            <p className='text-sm text-[#f0a3a3]'>{error}</p>
          </div>
        ) : event ? (
          <div className='relative w-full rounded-[24px] border border-white/10 bg-[#0d0a17]/90 px-7 py-7 shadow-2xl backdrop-blur-sm sm:px-10 sm:py-9'>
            <div className='grid gap-x-10 gap-y-8 sm:grid-cols-[340px_minmax(0,1fr)] sm:items-start'>
              <div>
                <div className='relative aspect-square overflow-hidden rounded-[10px] border border-[#737373]'>
                  <Image
                    src={event.image}
                    alt={event.fullTitle}
                    fill
                    sizes='340px'
                    className='object-cover object-center'
                  />
                </div>

                <div className='mt-3 flex items-end justify-between px-1'>
                  <span className='flex items-baseline leading-none text-white'>
                    {event.priceInPaise > 0 ? (
                      <>
                        <span className='font-sans text-4xl font-bold'>₹</span>
                        <span className='event-detail-jaro text-4xl'>
                          {event.fee.replace(/^₹/, '')}
                        </span>
                      </>
                    ) : (
                      <span className='event-detail-jaro text-4xl'>{event.fee}</span>
                    )}
                  </span>
                  <span className='font-bold text-lg leading-none text-white'>
                    {event.dateDay} {event.dateMonth}
                  </span>
                </div>

                <div className='mt-2 [&_button]:py-3 [&_button]:text-base [&_dl]:text-xs'>
                  <Checkout event={event} />
                </div>
              </div>

              <div className='pt-2' style={{ containerType: 'inline-size' }}>
                <h1 className='event-detail-fragment-serif max-w-full overflow-hidden whitespace-nowrap text-[clamp(2.25rem,8cqw,4rem)] leading-none text-white'>
                  {heading}
                </h1>

                <div className='mt-7 space-y-2'>
                  <h3 className='text-lg font-semibold text-[#e2e2e2]'>
                    {event.fullTitle}
                  </h3>
                  <p className='text-sm leading-[1.6] text-[#8d8d8d]'>{event.description}</p>
                </div>

                {(event.isTeamEvent || event.bookingClosed) && (
                  <div className='mt-4 space-y-1 text-xs uppercase leading-tight text-white'>
                    {event.isTeamEvent && (
                      <p>
                        Team event
                        {event.teamSize ? ` · up to ${event.teamSize} members` : ''}
                      </p>
                    )}
                    {event.bookingClosed && <p className='text-[#f0a3a3]'>Booking closed</p>}
                  </div>
                )}

                {event.extraInfo && (
                  <div className='mt-6'>
                    <h3 className='text-sm font-bold uppercase text-white'>Details :</h3>
                    <p className='mt-2 whitespace-pre-line text-sm leading-[1.6] text-[#8d8d8d]'>
                      {event.extraInfo}
                    </p>
                  </div>
                )}

                {(event.venueFull || event.time) && (
                  <div className='mt-5 space-y-1 text-xs uppercase leading-tight text-white'>
                    {event.time && <p>{event.time}</p>}
                    {event.venueFull && <p className='text-[#8d8d8d]'>{event.venueFull}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
