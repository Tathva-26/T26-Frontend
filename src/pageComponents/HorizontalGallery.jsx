'use client';

import { useRef, useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CRTWarp from './CRTWarp';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const GALLERY_GROUPS = [
  // Group 1: Staggered pair 1 (Top-left & Bottom-right)
  {
    type: 'pair',
    items: [
      {
        id: 1,
        itemClass: 'is-home-1 aspect-[0.81/1]',
        src: 'https://placehold.co/800x1000/18181b/c084fc?text=Placeholder+01',
        alt: 'Lando in casual clothes',
        extraClass: '-translate-y-16 md:-translate-y-24',
      },
      {
        id: 2,
        itemClass: 'is-home-2 aspect-square',
        src: 'https://placehold.co/800x1000/18181b/a855f7?text=Placeholder+02',
        alt: 'Lando in tux',
        extraClass: 'translate-y-16 md:translate-y-24',
      },
    ],
  },
  // Group 2: Featured Large Card + Quote
  {
    type: 'featured',
    id: 3,
    quote: 'Tathva message 1',
    quotePosition: 'top',
    itemClass: 'is-home3 aspect-[1.1/1]',
    src: 'https://placehold.co/1200x1000/18181b/e879f9?text=Placeholder+03',
    alt: 'Lando lifting trophy',
  },
  // Group 3: Staggered pair 2
  {
    type: 'pair',
    items: [
      {
        id: 4,
        itemClass: 'is-home-4',
        src: 'https://placehold.co/800x1000/18181b/c084fc?text=Placeholder+04',
        alt: 'Lando playing golf',
        extraClass: '-translate-y-20 md:-translate-y-28',
      },
      {
        id: 5,
        itemClass: 'is-home-5',
        src: 'https://placehold.co/800x1000/18181b/a855f7?text=Placeholder+05',
        alt: 'Lando in helmet',
        extraClass: 'translate-y-12 md:translate-y-20',
      },
    ],
  },
  // Group 4: Staggered pair 3
  {
    type: 'pair',
    items: [
      {
        id: 6,
        itemClass: 'is-home-6',
        src: 'https://placehold.co/800x1000/18181b/e879f9?text=Placeholder+06',
        alt: 'Lando gala',
        extraClass: '-translate-y-16 md:-translate-y-24',
      },
      {
        id: 7,
        itemClass: 'is-home-7',
        src: 'https://placehold.co/800x1000/18181b/c084fc?text=Placeholder+07',
        alt: 'Lando battersea',
        extraClass: 'translate-y-16 md:translate-y-24',
      },
    ],
  },
  // Group 5: Featured Large Card 2 + Quote
  {
    type: 'featured',
    id: 8,
    quote: 'Tathva message 2',
    quotePosition: 'bottom',
    itemClass: 'is-home8',
    src: 'https://placehold.co/1200x1200/18181b/a855f7?text=Placeholder+08',
    alt: 'Lando taking photo',
  },
  // Group 6: Staggered pair 4
  {
    type: 'pair',
    items: [
      {
        id: 9,
        itemClass: 'is-home9',
        src: 'https://placehold.co/800x1000/18181b/e879f9?text=Placeholder+09',
        alt: 'Lando austria',
        extraClass: '-translate-y-20 md:-translate-y-28',
      },
      {
        id: 10,
        itemClass: 'is-home10',
        src: 'https://placehold.co/800x1000/18181b/c084fc?text=Placeholder+10',
        alt: 'Lando US',
        extraClass: 'translate-y-12 md:translate-y-20',
      },
    ],
  },
];

export default function HorizontalGallery() {
  const containerRef = useRef(null);
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const updateVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    updateVh();
    window.addEventListener('resize', updateVh);
    return () => window.removeEventListener('resize', updateVh);
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!container || !section || !track) return;

    const ctx = gsap.context(() => {
      let tl;

      const build = () => {
        if (tl) {
          tl.scrollTrigger?.kill();
          tl.kill();
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const scrollAmount = track.scrollWidth - vw;

        // Total distance translated across the full scroll sequence
        const exitShift = vh * 0.6;
        const totalTranslation = scrollAmount + exitShift;
        const totalDuration = vh * 2 + scrollAmount;

        // Container height accommodates entrance (1vh), sticky scrollAmount, and exit (1vh)
        container.style.height = `${totalDuration}px`;

        tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: container,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        // 1. Single unbroken linear horizontal translation — 0 jump down or up!
        tl.to(track, { x: -totalTranslation, duration: totalDuration, ease: 'none' }, 0);

        // 2. Entrance opacity fade-in over 1vh
        tl.fromTo(
          track,
          { opacity: 0.85 },
          { opacity: 1, duration: vh, ease: 'none' },
          0
        );

        // 3. Outro Exit opacity fade-out over 1vh
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
        resizeTimer = setTimeout(() => ctx.add(build), 150);
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
    <div ref={containerRef} className="relative w-full">
      <section
        ref={sectionRef}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#080808]"
      >
        {/* Soft gradient masks for smooth entrance/exit transitions */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 h-32 bg-gradient-to-b from-[#080808] via-[#080808]/50 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-32 bg-gradient-to-t from-[#080808] via-[#080808]/50 to-transparent" />

        {/* Animated CRTWarp background */}
        <div className="absolute inset-0 z-0 h-full w-full">
          <CRTWarp
            color="#683ab5"
            backgroundColor="#080808"
            speed={0.4}
            curvature={0}
            scanlineStrength={0.17}
            scanlineFrequency={100}
            waveAmplitude={0.63}
            waveFrequency={3.6}
            bloom={1.5}
            bloomRadius={0.75}
            noise={0.085}
            vignette={0.62}
            brightness={1.15}
            pixelation={1}
            rgbShift={0.008}
            mouseReact
            mouseStrength={0.39}
            dpr={1}
            fps={30}
            paused={false}
          />
        </div>

        <div
          ref={trackRef}
          className="relative z-10 flex h-full w-max items-center pl-[75vw] md:pl-[80vw] lg:pl-[80vw] will-change-transform"
          style={{ paddingRight: 'var(--grid-spacer)' }}
        >
          {GALLERY_GROUPS.map((group, gIdx) => (
            <div key={`g-${gIdx}`} className="flex items-center flex-shrink-0">
              {gIdx > 0 && <div className="flex-none" style={{ width: 'var(--grid-spacer)' }} />}
              {group.type === 'featured' ? (
                <div className="flex flex-col items-center flex-shrink-0 justify-center">
                  {group.quotePosition === 'top' && (
                    <p className="font-serif text-xl md:text-2xl lg:text-3xl italic text-neutral-200 max-w-lg text-center leading-relaxed mb-6 font-light">
                      "{group.quote}"
                    </p>
                  )}
                  <div className="flex flex-col items-start">
                    <div className={`horizontal-item-img-w ${group.itemClass}`}>
                      <img
                        src={group.src}
                        alt={group.alt}
                        loading="lazy"
                        className="image is-horizontal-scroll h-full w-full object-cover scale-110"
                      />
                    </div>
                  </div>
                  {group.quotePosition === 'bottom' && (
                    <p className="font-serif text-xl md:text-2xl lg:text-3xl italic text-neutral-200 max-w-lg text-center leading-relaxed mt-6 font-light">
                      "{group.quote}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center flex-shrink-0" style={{ gap: 'var(--grid-spacer)' }}>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col items-start ${item.extraClass || ''}`}
                    >
                      <div className={`horizontal-item-img-w ${item.itemClass}`}>
                        <img
                          src={item.src}
                          alt={item.alt}
                          loading="lazy"
                          className="image is-horizontal-scroll h-full w-full object-cover scale-110"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}



