'use client';

import { useRef, useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// Adjust this path if your alias differs (file lives at src/app/components/TopoBackground.jsx)
import TopoBackground from '@/components/TopoBackground';
import './HorizontalGallery.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const GRID_SPACER = 'clamp(2rem, 6vw, 6rem)';

const IMG_BASE =
  'relative shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-white/12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] bg-[#121212]';

const GALLERY_GROUPS = [
  // 01 + 02
  {
    type: 'pair',
    items: [
      {
        id: 1,
        itemClass: 'w-[calc(var(--vh,1vh)*27)] aspect-[0.81/1]',
        src: 'https://placehold.co/800x1000/18181b/c084fc?text=Placeholder+01',
        alt: 'Lando in casual clothes',
        extraClass: '-translate-y-16 md:-translate-y-24',
      },
      {
        id: 2,
        itemClass: 'w-[calc(var(--vh,1vh)*29.3)] aspect-square',
        src: 'https://placehold.co/800x1000/18181b/a855f7?text=Placeholder+02',
        alt: 'Lando in tux',
        extraClass: 'translate-y-16 md:translate-y-24',
      },
    ],
  },

  // 03
  {
    type: 'featured',
    id: 3,
    quote: 'Tathva message 1',
    quotePosition: 'top',
    itemClass: 'w-[calc(var(--vh,1vh)*65.48)] aspect-[1.1/1]',
    src: 'https://placehold.co/1200x1000/18181b/e879f9?text=Placeholder+03',
    alt: 'Lando lifting trophy',
  },

  // 04 + 05
  {
    type: 'pair',
    items: [
      {
        id: 4,
        itemClass: 'w-[calc(var(--vh,1vh)*31.75)] h-[calc(var(--vh,1vh)*28.75)]',
        src: 'https://placehold.co/800x1000/18181b/c084fc?text=Placeholder+04',
        alt: 'Lando playing golf',
        extraClass: '-translate-y-20 md:-translate-y-28',
      },
      {
        id: 5,
        itemClass: 'h-[calc(var(--vh,1vh)*20.96)] w-[calc(var(--vh,1vh)*21.98)]',
        src: 'https://placehold.co/800x1000/18181b/a855f7?text=Placeholder+05',
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
        itemClass: 'w-[calc(var(--vh,1vh)*21.38)] h-[calc(var(--vh,1vh)*26.48)]',
        src: 'https://placehold.co/800x1000/18181b/e879f9?text=Placeholder+06',
        alt: 'Lando gala',
        extraClass: '-translate-y-16 md:-translate-y-24',
      },
      {
        id: 7,
        itemClass: 'w-[calc(var(--vh,1vh)*20.74)] h-[calc(var(--vh,1vh)*20.74)]',
        src: 'https://placehold.co/800x1000/18181b/c084fc?text=Placeholder+07',
        alt: 'Lando battersea',
        extraClass: 'translate-y-16 md:translate-y-24',
      },
    ],
  },

  // 08
  {
    type: 'featured',
    id: 8,
    quote: 'Tathva message 2',
    quotePosition: 'bottom',
    itemClass: 'w-[calc(var(--vh,1vh)*60.95)] h-[calc(var(--vh,1vh)*60.95)]',
    src: 'https://placehold.co/1200x1200/18181b/a855f7?text=Placeholder+08',
    alt: 'Lando taking photo',
  },

  // 09 + 10
  {
    type: 'pair',
    items: [
      {
        id: 9,
        itemClass: 'h-[calc(var(--vh,1vh)*24.91)] w-[calc(var(--vh,1vh)*27.42)]',
        src: 'https://placehold.co/800x1000/18181b/e879f9?text=Placeholder+09',
        alt: 'Lando austria',
        extraClass: '-translate-y-20 md:-translate-y-28',
      },
      {
        id: 10,
        itemClass: 'w-[calc(var(--vh,1vh)*31.69)] h-[calc(var(--vh,1vh)*30.9)]',
        src: 'https://placehold.co/800x1000/18181b/c084fc?text=Placeholder+10',
        alt: 'Lando US',
        extraClass: 'translate-y-12 md:translate-y-20',
      },
    ],
  },
];

const MOBILE_CONFIG = {
  1: { align: 'justify-start', width: 'w-[46vw] max-w-[230px]', aspect: 'aspect-[0.81/1]' },
  2: { align: 'justify-end', width: 'w-[50vw] max-w-[250px]', aspect: 'aspect-square' },
  3: { align: 'justify-center', width: 'w-[86vw] max-w-md', aspect: 'aspect-[1.1/1]' },
  4: { align: 'justify-end', width: 'w-[52vw] max-w-[260px]', aspect: 'aspect-[31.75/28.75]' },
  5: { align: 'justify-start', width: 'w-[36vw] max-w-[180px]', aspect: 'aspect-[21.98/20.96]' },
  6: { align: 'justify-start', width: 'w-[44vw] max-w-[220px]', aspect: 'aspect-[21.38/26.48]' },
  7: { align: 'justify-end', width: 'w-[42vw] max-w-[210px]', aspect: 'aspect-square' },
  8: { align: 'justify-center', width: 'w-[86vw] max-w-md', aspect: 'aspect-square' },
  9: { align: 'justify-start', width: 'w-[46vw] max-w-[230px]', aspect: 'aspect-[27.42/24.91]' },
  10: { align: 'justify-end', width: 'w-[50vw] max-w-[250px]', aspect: 'aspect-[31.69/30.9]' },
};

export default function HorizontalGallery() {
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
        `${window.innerHeight * 0.01}px`
      );
    };

    updateVh();
    window.addEventListener('resize', updateVh);

    return () => {
      window.removeEventListener('resize', updateVh);
    };
  }, []);

  /* -----------------------------------------
     DESKTOP GSAP HORIZONTAL SCROLL
     MOBILE: GSAP disabled, normal vertical scroll.
  ----------------------------------------- */
  useLayoutEffect(() => {
    const scroller = document.querySelector('.main-scroll') || window;
    const container = containerRef.current;
    const section = sectionRef.current;
    const track = trackRef.current;

    if (!container || !section || !track) return;

    const ctx = gsap.context(() => {
      let tl;

      const build = () => {
        /* Kill previous animation */
        if (tl) {
          tl.scrollTrigger?.kill();
          tl.kill();
          tl = null;
        }

        const vw = window.innerWidth;

        /* MOBILE */
        if (vw < 768) {
          gsap.set([container, section, track], { clearProps: 'all' });
          container.style.height = 'auto';
          return;
        }

        /* DESKTOP */
        const vh = window.innerHeight;
        const scrollAmount = Math.max(track.scrollWidth - vw, 0);
        const exitShift = vh * 0.6;
        const totalTranslation = scrollAmount + exitShift;
        const totalDuration = vh * 2 + scrollAmount;

        container.style.height = `${totalDuration}px`;

        tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            scroller,
            trigger: container,
            start: 'top bottom',
            end: 'bottom top',
            // Lenis already smooths the scroll position, so `true` tracks it
            // directly instead of adding a second layer of lag.
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        /* Horizontal movement */
        tl.to(
          track,
          { x: -totalTranslation, duration: totalDuration, ease: 'none' },
          0
        );

        /* Entrance opacity */
        tl.fromTo(
          track,
          { opacity: 0.85 },
          { opacity: 1, duration: vh, ease: 'none' },
          0
        );

        /* Exit opacity */
        tl.fromTo(
          track,
          { opacity: 1 },
          { opacity: 0.85, duration: vh, ease: 'none', immediateRender: false },
          vh + scrollAmount
        );
      };

      build();

      let resizeTimer;

      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          build();
          ScrollTrigger.refresh();
        }, 150);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', handleResize);
      };
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full shrink-0">
      {/* =========================================
          STICKY SECTION
          `isolate` creates a stacking context so the
          TopoBackground canvas (z-index: -1) stays
          inside this section, above its bg colour.
      ========================================= */}
      <section
        ref={sectionRef}
        className="
          relative
          isolate
          md:sticky
          md:top-0

          min-h-screen
          md:h-screen

          w-full
          md:overflow-hidden
          bg-[#080808]
        "
      >
        {/* TOP GRADIENT */}
        <div
          className="
            pointer-events-none
            absolute
            top-0
            left-0
            right-0
            z-20

            h-20
            md:h-32

            bg-gradient-to-b
            from-[#080808]
            via-[#080808]/50
            to-transparent
          "
        />

        {/* BOTTOM GRADIENT */}
        <div
          className="
            pointer-events-none
            absolute
            bottom-0
            left-0
            right-0
            z-20

            h-32
            md:h-48

            bg-gradient-to-t
            from-[#080808]
            via-[#080808]/60
            to-transparent
          "
        />

        {/* =====================================
            TOPO BACKGROUND
        ===================================== */}
        <TopoBackground
          fixed={false}
          background="#080808"
          lineColor="111, 72, 177"
          lineOpacity={0.22}
          lineWidth={1}
          levels={7}
          scale={0.0016}
          speed={0.06}
          cell={10}
        />

        {/* =========================================
            GALLERY TRACK (desktop: horizontal)
        ========================================= */}
        <div
          ref={trackRef}
          className="
            relative
            z-10

            hidden
            md:flex
            md:flex-row
            md:w-max
            md:h-full
            md:items-center

            md:py-0
            md:pl-[80vw]

            will-change-transform
          "
          style={{ paddingRight: GRID_SPACER }}
        >
          {GALLERY_GROUPS.map((group, gIdx) => (
            <div
              key={`g-${gIdx}`}
              className="
                flex
                flex-col

                w-full

                flex-shrink-0

                md:flex-row
                md:w-auto
              "
            >
              {/* SPACE BETWEEN GROUPS */}
              {gIdx > 0 && (
                <div
                  className="
                    flex-none

                    h-20
                    w-full

                    md:h-auto
                    md:w-[clamp(2rem,6vw,6rem)]
                  "
                />
              )}

              {/* FEATURED IMAGE */}
              {group.type === 'featured' ? (
                <div
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center

                    w-full

                    flex-shrink-0

                    py-10

                    md:w-auto
                    md:py-0
                  "
                >
                  {/* TOP QUOTE */}
                  {group.quotePosition === 'top' && (
                    <p
                      className="
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
                      "
                    >
                      &ldquo;{group.quote}&rdquo;
                    </p>
                  )}

                  {/* IMAGE */}
                  <div className={`${IMG_BASE} ${group.itemClass}`}>
                    <img
                      src={group.src}
                      alt={group.alt}
                      loading="lazy"
                      className="
                        image
                        is-horizontal-scroll

                        h-full
                        w-full

                        object-cover
                        scale-110
                      "
                    />
                  </div>

                  {/* BOTTOM QUOTE */}
                  {group.quotePosition === 'bottom' && (
                    <p
                      className="
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
                      "
                    >
                      &ldquo;{group.quote}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                /* PAIR */
                <div
                  className="
                    flex
                    flex-col

                    w-full

                    flex-shrink-0

                    md:flex-row
                    md:w-auto

                    md:items-center
                  "
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
                          loading="lazy"
                          className="
                            image
                            is-horizontal-scroll

                            h-full
                            w-full

                            object-cover
                            scale-110
                          "
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* =========================================
            MOBILE GALLERY (STATIC EDITORIAL ZIG-ZAG)
        ========================================= */}
        <div className="relative z-10 flex flex-col w-full px-[5vw] pt-16 pb-16 space-y-16 md:hidden">
          {GALLERY_GROUPS.map((group, gIdx) => {
            if (group.type === 'featured') {
              const isTopQuote = group.quotePosition === 'top';
              const config = MOBILE_CONFIG[group.id] || {
                align: 'justify-center',
                width: 'w-[86vw]',
                aspect: 'aspect-square',
              };

              return (
                <div
                  key={`m-g-${gIdx}`}
                  className="flex flex-col items-center justify-center w-full py-8 space-y-8"
                >
                  {/* TOP QUOTE */}
                  {isTopQuote && group.quote && (
                    <p className="font-serif italic font-light text-neutral-200 text-center leading-relaxed text-base px-4 max-w-xs sm:max-w-sm">
                      &ldquo;{group.quote}&rdquo;
                    </p>
                  )}

                  {/* FEATURED CENTERED IMAGE (03 or 08) */}
                  <div className={`flex w-full ${config.align}`}>
                    <div className={`${IMG_BASE} ${config.width} ${config.aspect}`}>
                      <img
                        src={group.src}
                        alt={group.alt}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  {/* BOTTOM QUOTE */}
                  {!isTopQuote && group.quote && (
                    <p className="font-serif italic font-light text-neutral-200 text-center leading-relaxed text-base px-4 max-w-xs sm:max-w-sm">
                      &ldquo;{group.quote}&rdquo;
                    </p>
                  )}
                </div>
              );
            }

            return (
              <div key={`m-g-${gIdx}`} className="flex flex-col w-full space-y-16">
                {group.items.map((item) => {
                  const config = MOBILE_CONFIG[item.id] || {
                    align: 'justify-start',
                    width: 'w-[56vw]',
                    aspect: 'aspect-square',
                  };

                  return (
                    <div key={`m-item-${item.id}`} className={`flex w-full ${config.align}`}>
                      <div className={`${IMG_BASE} ${config.width} ${config.aspect}`}>
                        <img
                          src={item.src}
                          alt={item.alt}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}