'use client'

import { useRef, useLayoutEffect, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// Adjust this path if your alias differs (file lives at src/app/components/TopoBackground.jsx)
import TopoBackground from '@/components/TopoBackground'
import './HorizontalGallery.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
  // FIX 1: mobile address bar show/hide no longer triggers a ScrollTrigger refresh
  ScrollTrigger.config({ ignoreMobileResize: true })
}

const GRID_SPACER = 'clamp(2rem, 6vw, 6rem)'

// Extra empty space after the last image (desktop). Increase for a longer
// horizontal scroll. The 95vw lead-in on the track is unchanged.
const EXTRA_END_SPACE = '40vw'

const IMG_BASE =
  'relative shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-white/12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] bg-[#121212]'

const GALLERY_GROUPS = [
  // 01 + 02
  {
    type: 'pair',
    items: [
      {
        id: 1,
        itemClass: 'w-[calc(var(--vh,1vh)*27)] aspect-[0.81/1]',
        src: 'https://cdn-next-main.tathva.org/images/HorizontalGallery/p3.webp',
        alt: 'Lando in casual clothes',
        extraClass: '-translate-y-16 md:-translate-y-24',
      },
      {
        id: 2,
        itemClass: 'w-[calc(var(--vh,1vh)*29.3)] aspect-square',
        src: 'https://cdn-next-main.tathva.org/images/HorizontalGallery/p2.webp',
        alt: 'Lando in tux',
        extraClass: 'translate-y-16 md:translate-y-24',
      },
    ],
  },

  // 03
  {
    type: 'featured',
    id: 3,
   
    quotePosition: 'top',
    itemClass: 'w-[calc(var(--vh,1vh)*65.48)] aspect-[1.1/1]',
    src: 'https://cdn-next-main.tathva.org/images/HorizontalGallery/p1.webp',
    alt: 'Lando lifting trophy',
  },

  // 04 + 05
  {
    type: 'pair',
    items: [
      {
        id: 4,
        itemClass:
          'w-[calc(var(--vh,1vh)*31.75)] h-[calc(var(--vh,1vh)*28.75)]',
        src: 'https://cdn-next-main.tathva.org/images/HorizontalGallery/p4.webp',
        alt: 'Lando playing golf',
        extraClass: '-translate-y-20 md:-translate-y-28',
      },
      {
        id: 5,
        itemClass:
          'h-[calc(var(--vh,1vh)*20.96)] w-[calc(var(--vh,1vh)*21.98)]',
        src: 'https://cdn-next-main.tathva.org/images/HorizontalGallery/p5.webp',
        alt: 'Lando in helmet',
        extraClass: 'translate-y-12 md:translate-y-20',
      },
    ],
  },

  // 06 + 07
  {
    type: 'pair',
    items: [
      {
        id: 6,
        itemClass:
          'w-[calc(var(--vh,1vh)*21.38)] h-[calc(var(--vh,1vh)*26.48)]',
        src: 'https://cdn-next-main.tathva.org/images/HorizontalGallery/p8.webp',
        alt: 'Lando gala',
        extraClass: '-translate-y-16 md:-translate-y-24',
      },
      {
        id: 7,
        itemClass:
          'w-[calc(var(--vh,1vh)*20.74)] h-[calc(var(--vh,1vh)*20.74)]',
        src: 'https://cdn-next-main.tathva.org/images/HorizontalGallery/p7.webp',
        alt: 'Lando battersea',
        extraClass: 'translate-y-16 md:translate-y-24',
      },
    ],
  },

  // 08
  {
    type: 'featured',
    id: 8,
    
    quotePosition: 'bottom',
    itemClass: 'w-[calc(var(--vh,1vh)*60.95)] h-[calc(var(--vh,1vh)*60.95)]',
    src: 'https://cdn-next-main.tathva.org/images/HorizontalGallery/p6.webp',
    alt: 'Lando taking photo',
  },

  // 09 + 10
  {
    type: 'pair',
    items: [
      {
        id: 9,
        itemClass:
          'h-[calc(var(--vh,1vh)*24.91)] w-[calc(var(--vh,1vh)*27.42)]',
        src: 'https://cdn-next-main.tathva.org/images/HorizontalGallery/p9.webp',
        alt: 'Lando austria',
        extraClass: '-translate-y-20 md:-translate-y-28',
      },
      {
        id: 10,
        itemClass: 'w-[calc(var(--vh,1vh)*31.69)] h-[calc(var(--vh,1vh)*30.9)]',
        src: 'https://cdn-next-main.tathva.org/images/HorizontalGallery/p10.webp',
        alt: 'Lando US',
        extraClass: 'translate-y-12 md:translate-y-20',
      },
    ],
  },


]

const MOBILE_CONFIG = {
  1: {
    align: 'justify-start',
    width: 'w-[46vw] max-w-[230px]',
    aspect: 'aspect-[0.81/1]',
  },
  2: {
    align: 'justify-end',
    width: 'w-[50vw] max-w-[250px]',
    aspect: 'aspect-square',
  },
  3: {
    align: 'justify-center',
    width: 'w-[86vw] max-w-md',
    aspect: 'aspect-[1.1/1]',
  },
  4: {
    align: 'justify-end',
    width: 'w-[52vw] max-w-[260px]',
    aspect: 'aspect-[31.75/28.75]',
  },
  5: {
    align: 'justify-start',
    width: 'w-[36vw] max-w-[180px]',
    aspect: 'aspect-[21.98/20.96]',
  },
  6: {
    align: 'justify-start',
    width: 'w-[44vw] max-w-[220px]',
    aspect: 'aspect-[21.38/26.48]',
  },
  7: {
    align: 'justify-end',
    width: 'w-[42vw] max-w-[210px]',
    aspect: 'aspect-square',
  },
  8: {
    align: 'justify-center',
    width: 'w-[86vw] max-w-md',
    aspect: 'aspect-square',
  },
  9: {
    align: 'justify-start',
    width: 'w-[46vw] max-w-[230px]',
    aspect: 'aspect-[27.42/24.91]',
  },
  10: {
    align: 'justify-end',
    width: 'w-[50vw] max-w-[250px]',
    aspect: 'aspect-[31.69/30.9]',
  },
}

export default function HorizontalGallery({ coordinatedEntrance = false }) {
  const containerRef = useRef(null);
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  /* -----------------------------------------
     VIEWPORT HEIGHT VARIABLE
  ----------------------------------------- */
  useEffect(() => {
    const updateVh = () => {
      document.documentElement.style.setProperty(
        '--vh',
        `${window.innerHeight * 0.01}px`,
      )
    }

    updateVh()
    window.addEventListener('resize', updateVh)

    return () => {
      window.removeEventListener('resize', updateVh)
    }
  }, [])

  /* -----------------------------------------
     DESKTOP GSAP HORIZONTAL SCROLL
     MOBILE: GSAP disabled, normal vertical scroll.
  ----------------------------------------- */
  useLayoutEffect(() => {
    const scroller = document.querySelector('.main-scroll') || window
    const container = containerRef.current
    const section = sectionRef.current
    const track = trackRef.current

    if (!container || !section || !track) return

    const ctx = gsap.context(() => {
      let tl

      const build = () => {
        /* Kill previous animation */
        if (tl) {
          tl.scrollTrigger?.kill()
          tl.kill()
          tl = null
        }

        const vw = window.innerWidth

        /* MOBILE */
        if (vw < 768) {
          gsap.set([container, section, track], { clearProps: 'all' })
          container.style.height = 'auto'
          return
        }

        /* DESKTOP */
        const vh = window.innerHeight

        // Full width of the track (lead-in + images + gaps + end spacer),
        // minus one screen. Translation doesn't affect width, so this is
        // correct even if the track is currently moved.
        const scrollAmount = Math.max(
          track.getBoundingClientRect().width - vw,
          0,
        )
        /*
          CONTINUOUS DIAGONAL EXIT (no stop-then-go)

          The horizontal travel is spread evenly across the WHOLE scroll
          range, so the cards never pause: they keep sliding left while
          the section rises in, stays pinned, and scrolls out.

          Phases (scroll distance):
          1) ENTRANCE [0 -> vh]            section rises, cards already moving
          2) PINNED   [vh -> vh + pin]     section pinned, cards moving
          3) EXIT     [vh + pin -> range]  section scrolls up, cards STILL moving

          The pin is shortened by the 2 viewport heights spent in entrance
          and exit, so cards still travel 1:1 with the scroll:
          range = pin + 2vh = scrollAmount
        */
        const pin = Math.max(scrollAmount - vh * 2, 0)
        const range = pin + vh * 2

        // Where the Expo bridge lets go of the page (it records that on its
        // own element). This definition went missing from main in a merge
        // while the two lines that call it stayed, which threw as soon as the
        // gallery mounted and took the whole home page down with it.
        const openingScroll = () => {
          const release = Number(document.querySelector('[data-expo-end]')?.dataset.expoEnd)
          // Child layout effects can run before the bridge has registered its
          // pin. The scheduled global refresh will replace this initial value.
          return Number.isFinite(release) ? release : (scroller.scrollTop || 0) + container.getBoundingClientRect().top
        }

        // Sticky pin length = container height - vh = pin
        container.style.height = `${pin + vh}px`

        tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            scroller,
            trigger: container,
            // Use the bridge's exact release coordinate rather than deriving
            // a second entrance from overlapping sticky/pinned geometry.
            start: () => coordinatedEntrance && Number.isFinite(openingScroll()) ? openingScroll() : 'top bottom',
            end: coordinatedEntrance ? () => openingScroll() + container.offsetHeight - window.innerHeight : 'bottom top',
            // Lenis already smooths the scroll position, so `true` tracks it
            // directly instead of adding a second layer of lag.
            scrub: true,
            invalidateOnRefresh: true,
            // The Expo bridge establishes its upstream pin spacing first.
            refreshPriority: coordinatedEntrance ? -20 : 0,
            onRefresh: (self) => {
              container.dataset.galleryStart = self.start;
              container.dataset.galleryEnd = self.end;
            },
          },
        })
        /* Horizontal movement: one linear tween over the entire range */
        tl.to(track, { x: -scrollAmount, duration: range, ease: 'none' }, 0)

        /* Entrance opacity */
        tl.fromTo(
          track,
          { opacity: 0.85 },
          { opacity: 1, duration: vh, ease: 'none' },
          0,
        )
      }

      build()

      /* Rebuild once fonts / images / layout have settled, in case the first
         measurement ran too early (this differs between machines). */
      const onLoad = () => {
        build()
        ScrollTrigger.refresh()
      }
      window.addEventListener('load', onLoad, { once: true })
      document.fonts?.ready.then(onLoad)

      let resizeTimer
      let lastWidth = window.innerWidth

      const handleResize = () => {
        // FIX 2: mobile address bar show/hide only changes height, so there
        // is nothing to rebuild. Skip it to avoid the scroll jump.
        if (window.innerWidth < 768 && window.innerWidth === lastWidth) return
        lastWidth = window.innerWidth

        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          build()
          ScrollTrigger.refresh()
        }, 150)
      }

      window.addEventListener('resize', handleResize)

      return () => {
        clearTimeout(resizeTimer)
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('load', onLoad)
      }
    }, container)

    return () => {
      ctx.revert();
      delete container.dataset.galleryStart;
      delete container.dataset.galleryEnd;
    };
  }, [coordinatedEntrance]);

  return (
    <div ref={containerRef} className='relative w-full shrink-0'>
      {/* =========================================
          STICKY SECTION
          `isolate` creates a stacking context so the
          TopoBackground canvas (z-index: -1) stays
          inside this section, above its bg colour.
      ========================================= */}
      <section
        ref={sectionRef}
        className='
          relative
          isolate
          md:sticky
          md:top-0

          min-h-screen
          md:h-screen

          w-full
          md:overflow-hidden
          bg-[#1d1725]
        '
      >
        {/* TOP GRADIENT */}
        <div
          className='
            pointer-events-none
            absolute
            top-0
            left-0
            right-0
            z-20

            h-20
            md:h-32

            bg-gradient-to-b
            from-[#1d1725]
            via-[#1d1725]/50
            to-transparent
          '
        />

        {/* BOTTOM GRADIENT — fades to the page's black (the Footer's own
            backdrop) right at the seam, instead of this section's own
            purple, so the two sections blend instead of cutting hard. */}
        <div
          className='
            pointer-events-none
            absolute
            bottom-0
            left-0
            right-0
            z-20

            h-32
            md:h-48

            bg-gradient-to-t
            from-black
            via-[#1d1725]/80
            to-transparent
          '
        />

        {/* =====================================
            TOPO BACKGROUND
        ===================================== */}
        <TopoBackground
          fixed={false}
          background='#1d1725'
          lineColor='138,111,174'
          lineOpacity={0.22}
          lineWidth={1}
          levels={7}
          scale={0.0016}
          speed={0.06}
          cell={16}
        />

        {/* =========================================
            GALLERY TRACK (desktop: horizontal)
        ========================================= */}
        <div
          ref={trackRef}
          className='
            relative
            z-10

            hidden
            md:flex
            md:flex-row
            md:w-max
            md:h-full
            md:items-center

            md:py-0
            md:pl-[95vw]

            will-change-transform
          '
        >
          {GALLERY_GROUPS.map((group, gIdx) => (
            <div
              key={`g-${gIdx}`}
              className='
                flex
                flex-col

                w-full

                flex-shrink-0

                md:flex-row
                md:w-auto
              '
            >
              {/* SPACE BETWEEN GROUPS */}
              {gIdx > 0 && (
                <div
                  className='
                    flex-none

                    h-20
                    w-full

                    md:h-auto
                    md:w-[clamp(2rem,6vw,6rem)]
                  '
                />
              )}

              {/* FEATURED IMAGE */}
              {group.type === 'featured' ? (
                <div
                  className='
                    flex
                    flex-col
                    items-center
                    justify-center

                    w-full

                    flex-shrink-0

                    py-10

                    md:w-auto
                    md:py-0
                  '
                >
                  {/* TOP QUOTE */}
                  {group.quotePosition === 'top' && (
                    <p
                      className='
                        font-serif
                        italic
                        font-light
                        text-neutral-200
                        text-center
                        leading-relaxed

                        text-base
                        px-8
                        mb-5

                        md:text-xl
                        lg:text-3xl
                        md:max-w-lg
                        md:px-0
                        md:mb-6
                      '
                    >
                     
                    </p>
                  )}

                  {/* IMAGE */}
                  <div className={`${IMG_BASE} ${group.itemClass}`}>
                    <img
                      src={group.src}
                      alt={group.alt}
                      loading='lazy'
                      className='
                        image
                        is-horizontal-scroll

                        h-full
                        w-full

                        object-cover
                        scale-110
                      '
                    />
                  </div>

                  {/* BOTTOM QUOTE */}
                  {group.quotePosition === 'bottom' && (
                    <p
                      className='
                        font-serif
                        italic
                        font-light
                        text-neutral-200
                        text-center
                        leading-relaxed

                        text-base
                        px-8
                        mt-5

                        md:text-xl
                        lg:text-3xl
                        md:max-w-lg
                        md:px-0
                        md:mt-6
                      '
                    >
                    </p>
                  )}
                </div>
              ) : (
                /* PAIR */
                <div
                  className='
                    flex
                    flex-col

                    w-full

                    flex-shrink-0

                    md:flex-row
                    md:w-auto

                    md:items-center
                  '
                  style={{ gap: GRID_SPACER }}
                >
                  {group.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`
                        flex
                        flex-col
                        flex-shrink-0

                        w-full

                        ${index % 2 === 0 ? 'items-start pl-[5vw]' : 'items-end pr-[5vw]'}

                        md:w-auto
                        md:items-start
                        md:pl-0
                        md:pr-0

                        ${item.extraClass || ''}
                      `}
                    >
                      <div className={`${IMG_BASE} ${item.itemClass}`}>
                        <img
                          src={item.src}
                          alt={item.alt}
                          loading='lazy'
                          className='
                            image
                            is-horizontal-scroll

                            h-full
                            w-full

                            object-cover
                            scale-110
                          '
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* END SPACER: extra scroll length after the last image.
              A real element, so the track width never depends on
              padding behaviour that can differ between browsers. */}
          <div
            aria-hidden='true'
            className='flex-none hidden md:block'
            style={{ width: `calc(${GRID_SPACER} + ${EXTRA_END_SPACE})` }}
          />
        </div>

        {/* =========================================
            MOBILE GALLERY (STATIC EDITORIAL ZIG-ZAG)
        ========================================= */}
        <div className='relative z-10 flex flex-col w-full px-[5vw] pt-16 pb-16 space-y-16 md:hidden'>
          {GALLERY_GROUPS.map((group, gIdx) => {
            if (group.type === 'featured') {
              const isTopQuote = group.quotePosition === 'top'
              const config = MOBILE_CONFIG[group.id] || {
                align: 'justify-center',
                width: 'w-[86vw]',
                aspect: 'aspect-square',
              }

              return (
                <div
                  key={`m-g-${gIdx}`}
                  className='flex flex-col items-center justify-center w-full py-8 space-y-8'
                >
                  {/* TOP QUOTE */}
                  {isTopQuote && group.quote && (
                    <p className='font-serif italic font-light text-neutral-200 text-center leading-relaxed text-base px-4 max-w-xs sm:max-w-sm'>
                      &ldquo;{group.quote}&rdquo;
                    </p>
                  )}

                  {/* FEATURED CENTERED IMAGE (03 or 08) */}
                  <div className={`flex w-full ${config.align}`}>
                    <div
                      className={`${IMG_BASE} ${config.width} ${config.aspect}`}
                    >
                      <img
                        src={group.src}
                        alt={group.alt}
                        loading='lazy'
                        className='h-full w-full object-cover'
                      />
                    </div>
                  </div>

                  {/* BOTTOM QUOTE */}
                  {!isTopQuote && group.quote && (
                    <p className='font-serif italic font-light text-neutral-200 text-center leading-relaxed text-base px-4 max-w-xs sm:max-w-sm'>
                      &ldquo;{group.quote}&rdquo;
                    </p>
                  )}
                </div>
              )
            }

            return (
              <div
                key={`m-g-${gIdx}`}
                className='flex flex-col w-full space-y-16'
              >
                {group.items.map((item) => {
                  const config = MOBILE_CONFIG[item.id] || {
                    align: 'justify-start',
                    width: 'w-[56vw]',
                    aspect: 'aspect-square',
                  }

                  return (
                    <div
                      key={`m-item-${item.id}`}
                      className={`flex w-full ${config.align}`}
                    >
                      <div
                        className={`${IMG_BASE} ${config.width} ${config.aspect}`}
                      >
                        <img
                          src={item.src}
                          alt={item.alt}
                          loading='lazy'
                          className='h-full w-full object-cover'
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  );
}
