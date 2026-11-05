'use client'

import Link from 'next/link'
import Navbar from '@/pageComponents/Navbar/Navbar'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import Checkout from '@/components/Checkout/Checkout'
import { useEventDetails } from '@/hooks/useEventDetails'

const FALLBACK_IMAGE = 'https://cdn-next-main.tathva.org/images/workshops/workshop-astronaut.jpg'

const fontFaceStyles = `
/* Jaro + Jost served from globals.css @font-face (R2 CDN) */

@font-face {
  font-family: 'Event Detail Fragment Serif';
  src: url('/fonts/PPFragment-SerifExtraBold.woff2') format('woff2');
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

function renderFormattedText(text) {
  if (!text) return null
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    if (/^(https?:\/\/|www\.)/.test(part)) {
      const match = part.match(/^(.*?)([.,;:)]?)$/)
      const url = match ? match[1] : part
      const trailing = match ? match[2] : ''
      const href = url.startsWith('http') ? url : `https://${url}`

      return (
        <span key={index}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8f9cff] underline hover:text-[#b4bdff] transition-colors break-all"
          >
            {url}
          </a>
          {trailing}
        </span>
      )
    }
    return part
  })
}

/**
 * The full-page replacement for what used to be the Workshops/Competitions/
 * Lectures detail modal. Same content, same data source (`useEventDetails`),
 * just routed to instead of opened over the list — so an event has its own
 * shareable URL (`/<eventType>/<id>`), matching how the old site worked.
 */
export default function EventDetailPage({ id, label, heading, backHref }) {
  const { event, loading, error, notFound } = useEventDetails(id, {
    label,
    fallbackImage: FALLBACK_IMAGE,
  })

  return (
    <div className='min-h-screen w-full bg-[#06070d] text-white'>
      <style>{fontFaceStyles}</style>
      <Navbar />
      <TathvaMenu />

      <main className='mx-auto w-full max-w-[1280px] px-4 pb-16 pt-28 lg:pt-20 sm:px-6 sm:pt-32 lg:px-8'>
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
          <div className='relative w-full rounded-[24px] border border-white/10 bg-[#0d0a17]/90 px-7 py-7 shadow-2xl backdrop-blur-sm sm:px-10 sm:py-9 overflow-hidden'>
            <div className='grid gap-x-10 gap-y-8 sm:grid-cols-[440px_minmax(0,1fr)] sm:items-start lg:grid-rows-[auto_auto]'>
              {/* Poster image (Col 1, Row 1) */}
              <div className='order-1 sm:order-none sm:col-start-1 sm:row-start-1 relative overflow-hidden rounded-[10px] border border-[#737373] bg-[#08090e]'>
                <img
                  src={event.image}
                  alt={event.fullTitle}
                  className='block h-auto w-full'
                />
              </div>

              {/* Title & Description (Col 2, Row 1) */}
              <div className='order-2 sm:order-none sm:col-start-2 sm:row-start-1 pt-2 sm:pt-4 space-y-2 min-w-0'>
                <div className="flex justify-between items-start gap-4">
                  <h2 className='text-3xl md:text-5xl font-semibold text-[#e2e2e2]'>
                    {event.fullTitle} 
                  </h2>
                  {event.bookingClosed && (
                    <span className='shrink-0 rounded-xl bg-red-500 p-2 text-sm md:text-xl font-bold text-white text-center'>
                      Closed
                    </span>
                  )}
                </div>
                {event.description && (
                  <div className='flex items-center'>
                    <p className='md:text-lg leading-[1.6] text-[#8d8d8d] break-words [overflow-wrap:anywhere]'>
                      {renderFormattedText(event.description)}
                    </p>
                  </div>
                )}
              </div>

              {/* Logistics & Details (Col 1, Row 2 - under poster on the left) */}
              <div className='order-3 sm:order-none sm:col-start-1 sm:row-start-2 sm:self-start space-y-4 min-w-0'>
                {(event.venueFull || event.time) && (
                  <div className='space-y-1 text-xs uppercase leading-tight text-white'>
                    {event.time && <div className='text-lg md:text-xl font-bold'>{event.time}</div>}
                    {event.venueFull && <div className='text-[#8d8d8d]'>{event.venueFull}</div>}
                  </div>
                )}

                {event.isTeamEvent && (
                  <div>
                    <div className='inline-block rounded-2xl bg-[#3B82C4] px-4 py-2 text-sm font-bold uppercase leading-tight text-white'>
                      Team event{event.teamSize ? ` · up to ${event.teamSize} members` : ''}
                    </div>
                  </div>
                )}

                {event.extraInfo && (
                  <div className='min-w-0'>
                    <h3 className='text-sm font-bold uppercase text-white'>Details :</h3>
                    <p className='mt-2 whitespace-pre-line text-base md:text-lg leading-[1.6] text-[#8d8d8d] break-words [overflow-wrap:anywhere]'>
                      {renderFormattedText(event.extraInfo)}
                    </p>
                  </div>
                )}
              </div>

              {/* Pricing & Register Section (Col 2, Row 2 - moved to the right side) */}
              <div className='order-4 sm:order-none sm:col-start-2 sm:row-start-2 sm:self-start min-w-0'>
                <div className='flex items-center justify-between px-1'>
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
                  <span className='font-bold text-3xl leading-none text-white'>
                    {event.dateDay} {event.dateMonth}
                  </span>
                </div>

                <div className='mt-2 [&_button]:py-3 [&_button]:text-base [&_dl]:text-xs'>
                  <Checkout event={event} />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
