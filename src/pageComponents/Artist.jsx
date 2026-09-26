"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ──────────────────────────────────────────────────────────
   ARTIST DATA
   ────────────────────────────────────────────────────────── */
const SHARED_ARTWORK = [
  {
    src: "https://c.animaapp.com/z3WmKXFp/img/rectangle-10@2x.png",
    alt: "Performing on stage",
    className:
      "absolute top-[308px] left-[391px] w-[178px] h-[252px] -rotate-180 object-cover",
  },
  {
    src: "https://c.animaapp.com/z3WmKXFp/img/rectangle-11@2x.png",
    alt: "Performance artwork",
    className:
      "absolute top-[354px] left-[37px] w-[178px] h-[252px] -rotate-180",
  },
];

const SHARED_CONNECTORS = [
  {
    src: "https://c.animaapp.com/z3WmKXFp/img/connector.svg",
    alt: "Decorative connector",
    className:
      "absolute top-[397px] left-[620px] w-[76px] h-[88px] -rotate-180",
  },
  {
    src: "https://c.animaapp.com/z3WmKXFp/img/connector-1.svg",
    alt: "Decorative connector",
    className:
      "absolute top-[61px] left-[620px] w-[76px] h-[88px] -rotate-180",
  },
  {
    src: "https://c.animaapp.com/z3WmKXFp/img/connector-2.svg",
    alt: "Decorative connector",
    className:
      "absolute top-[338px] left-[319px] w-[76px] h-[88px] -rotate-180",
  },
];

/* ⚠️ TODO — REPLACE THESE WITH REAL PER-ARTIST TRANSPARENT CUTOUT PNGs.
   Each artist needs their own transparent-background cutout PNG —
   sharing one file across artists makes the crossfade invisible.
   Swap each `mainImage` with that artist's own cutout PNG. */
const artists = [
  {
    name: "Shreya Ghoshal",
    mainImage: "https://c.animaapp.com/z3WmKXFp/img/image-98.png",
    bgColor: "#33145c",
    artworkAssets: SHARED_ARTWORK,
    connectorAssets: SHARED_CONNECTORS,
  },
  {
    name: "Arijit Singh",
    mainImage: "https://c.animaapp.com/BV8mRzVS/img/image-96.png", // TODO: replace with real cutout PNG
    bgColor: "#1a3654",
    // Tweak this one token until his fill matches Shreya's (same
    // container + object-contain, so the smaller source needs a boost).
    // Must stay a full literal class — Tailwind can't see constructed names.
    imgClassName: "scale-[2] translate-x-[200px]",
    artworkAssets: SHARED_ARTWORK,
    connectorAssets: SHARED_CONNECTORS,
  },
];

/* ──────────────────────────────────────────────────────────
   RIGHT-SIDE CARD — one per artist
   ────────────────────────────────────────────────────────── */
function ArtistCard({ artist }) {
  return (
    <div className="w-full flex justify-center overflow-hidden">
    {/* Fixed 700px design box, scaled down on small screens (all
        inner coordinates are absolute px, so scale beats re-layout) */}
    <div className="relative w-[700px] h-[700px] flex-shrink-0 origin-top scale-[0.5] min-[500px]:scale-[0.65] md:scale-[0.8] xl:scale-100">
      {/* Board frame */}
      <img
        className="absolute top-0 left-0 w-full h-[659px] object-cover"
        alt="Concert planning board"
        src="https://c.animaapp.com/z3WmKXFp/img/rectangle-14.png"
      />

      {/* Inner board */}
      <div className="absolute top-[2px] left-[26px] w-[690px] h-[620px] flex overflow-hidden">
        <div className="w-full h-[611px] relative bg-white border border-solid border-black rotate-180">
          {/* Board background texture */}
          <img
            className="absolute top-[-187px] left-px w-[828px] h-[853px] -rotate-180 object-cover"
            alt="Concert board background"
            src="https://c.animaapp.com/z3WmKXFp/img/rectangle-9.png"
          />

          {artist.artworkAssets.map((asset) => (
            <img
              key={asset.src}
              className={asset.className}
              alt={asset.alt}
              src={asset.src}
            />
          ))}

          <div
            className="absolute -top-12 left-[386px] w-[164px] h-[218px] bg-[#c4c4c4] rotate-180"
            aria-hidden="true"
          />
          <div
            className="absolute top-[23px] left-[37px] w-[178px] h-[252px] bg-[#c4c4c4] rotate-180"
            aria-hidden="true"
          />

          {artist.connectorAssets.map((asset) => (
            <img
              key={asset.src}
              className={asset.className}
              alt={asset.alt}
              src={asset.src}
            />
          ))}

          <div className="absolute top-[274px] left-72 rotate-[-164.87deg] [font-family:'Crafty_Girls',cursive] font-normal text-[#c0bebe] text-[44.3px] tracking-[0] leading-[normal]">
            {artist.name}
          </div>

          <img
            className="absolute top-[450px] left-[691px] w-[60px] h-[60px] -rotate-180 object-cover"
            alt="Decorative artist emblem"
            src="https://c.animaapp.com/z3WmKXFp/img/ellipse-5@2x.png"
          />
        </div>
      </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   FULL-WIDTH STICKY BACKGROUND
   This is a separate component that sits behind both columns
   and uses `position: fixed` + `inset: 0` to always cover
   the viewport. It is rendered OUTSIDE the flex layout.
   GSAP animates the opacity of each color layer.
   ────────────────────────────────────────────────────────── */
function FullScreenBackground({ bgRefs: bgRefsProp }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Stacked color layers — one per artist */}
      {artists.map((artist, i) => (
        <div
          key={`bg-${artist.name}`}
          ref={(el) => {
            bgRefsProp.current[i] = el;
          }}
          className="absolute inset-0"
          style={{ backgroundColor: artist.bgColor }}
        />
      ))}

      {/* Starry overlay with mix-blend-screen */}
      <img
        className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-60"
        alt="Starry purple concert background"
        src="https://c.animaapp.com/z3WmKXFp/img/image-97.png"
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MAIN FRAME COMPONENT
   ────────────────────────────────────────────────────────── */
export const Frame = () => {
  const outerRef = useRef(null);
  const imageRefs = useRef([]);
  const bgRefs = useRef([]);
  const rightPanelRefs = useRef([]);

  useEffect(() => {
    /* ── Page-level smooth scrolling via Lenis ──
       duration: 1.8 — slightly heavier/more deliberate feel.
       wheelMultiplier: 0.8 — 20% slower scroll speed. */
    let lenis = null;

    async function initLenis() {
      try {
        const { default: Lenis } = await import("lenis");
        lenis = new Lenis({
          duration: 1.8,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 0.8,
          touchMultiplier: 1.5,
        });

        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      } catch {
        // Lenis not installed — scroll still works natively
      }
    }

    initLenis();

    const ctx = gsap.context(() => {
      const images = imageRefs.current.filter(Boolean);
      const bgs = bgRefs.current.filter(Boolean);
      const panels = rightPanelRefs.current.filter(Boolean);

      if (images.length < 2 || panels.length < 2) return;

      /* ── Initial state ── */
      images.forEach((img, i) => {
        gsap.set(img, {
          opacity: i === 0 ? 1 : 0,
          // Now that the left column clips (overflow-hidden), this offset is
          // actually hidden below the visible frame instead of floating
          // un-masked over other content — safe to push deeper.
          y: i === 0 ? 0 : 650,
          willChange: "auto",
        });
      });
      bgs.forEach((bg, i) => {
        gsap.set(bg, {
          opacity: i === 0 ? 1 : 0,
        });
      });

      /* ── Crossfade timelines ──
         Trigger: each right panel's top edge.
         start: "top bottom" → transition begins when panel
                enters viewport from below.
         end: "top 5%" → mapped to an even larger scroll area.
         scrub: 2.5 → animation trails scroll with high lag. */
      panels.forEach((panel, i) => {
        if (i === 0) return;

        const prev = images[i - 1];
        const curr = images[i];
        const prevBg = bgs[i - 1];
        const currBg = bgs[i];
        if (!prev || !curr) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            // Anchored to the panel's CENTER (where its ArtistCard sits,
            // since the card is vertically centered inside the panel) so
            // the crossfade progress tracks when the card is actually
            // visible on screen, instead of finishing near the panel's
            // top edge before the card is centered.
            start: "center 90%",
            end: "center 10%",
            scrub: 2.5,
            onEnter: () => {
              gsap.set(prev, { willChange: "opacity" });
              gsap.set(curr, { willChange: "opacity, transform" });
              if (prevBg) gsap.set(prevBg, { willChange: "opacity" });
              if (currBg) gsap.set(currBg, { willChange: "opacity" });
            },
            onLeaveBack: () => {
              gsap.set(curr, { willChange: "auto" });
              if (currBg) gsap.set(currBg, { willChange: "auto" });
            },
            onLeave: () => {
              gsap.set(prev, { willChange: "auto" });
              gsap.set(curr, { willChange: "auto" });
              if (prevBg) gsap.set(prevBg, { willChange: "auto" });
              if (currBg) gsap.set(currBg, { willChange: "auto" });
            },
            onEnterBack: () => {
              gsap.set(prev, { willChange: "opacity" });
              gsap.set(curr, { willChange: "opacity, transform" });
              if (prevBg) gsap.set(prevBg, { willChange: "opacity" });
              if (currBg) gsap.set(currBg, { willChange: "opacity" });
            },
          },
        });

        /* Outgoing: fade out, stays in place */
        tl.to(prev, { opacity: 0, duration: 1, ease: "power2.inOut" }, 0);

        /* Incoming movement: rise smoothly from deep below */
        tl.to(curr, { y: 0, duration: 1, ease: "power2.out" }, 0);
        /* Incoming opacity: lag behind movement (starts at 0.4s) */
        tl.to(curr, { opacity: 1, duration: 0.6, ease: "power2.inOut" }, 0.4);

        if (prevBg) tl.to(prevBg, { opacity: 0, duration: 1, ease: "power2.inOut" }, 0);
        if (currBg) tl.to(currBg, { opacity: 1, duration: 1, ease: "power2.inOut" }, 0);
      });
    }, outerRef);

    return () => {
      ctx.revert();
      if (lenis) {
        lenis.destroy();
      }
    };
  }, []);

  return (
    <>
      {/* Full-screen fixed background — covers BOTH columns.
          position: fixed means it never scrolls and never fights
          with sticky or overflow. GSAP crossfades the color layers
          via bgRefs. */}
      <FullScreenBackground bgRefs={bgRefs} />

      <section
        ref={outerRef}
        className="relative w-full flex flex-col md:flex-row overflow-x-clip"
        style={{ zIndex: 1 }}
        data-model-id="54:35"
      >
        {/* ═══════════  LEFT COLUMN (CSS STICKY)  ═══════════ */}
        <div
          className="w-full md:w-[50%] h-[62vh] md:h-screen self-start overflow-hidden"
          style={{ position: "sticky", top: 0 }}
        >
          {/* Tathva logo */}
          <div
            className="absolute top-[68px] left-0 w-[55px] h-[46px] bg-[url(https://c.animaapp.com/z3WmKXFp/img/tathvawhitelogo-1@2x.png)] bg-cover bg-[50%_50%] z-10"
            role="img"
            aria-label="Tathva logo"
          />

          {/* Stacked hero images — centered + fluid on mobile, exact design coords on md+ */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[615px] aspect-[615/495] md:left-[55px] md:top-[203px] md:translate-x-0 md:translate-y-0 md:w-[615px] md:h-[495px] md:aspect-auto">
            {artists.map((artist, i) => (
              <img
                key={artist.name}
                ref={(el) => {
                  imageRefs.current[i] = el;
                }}
                className={`absolute inset-0 w-full h-full object-contain ${artist.imgClassName ?? ""}`}
                alt={`${artist.name} performing`}
                src={artist.mainImage}
              />
            ))}
          </div>
        </div>

        {/* ═══════════  RIGHT COLUMN (SCROLLS)  ═══════════ */}
        <div className="relative w-full md:w-[50%]">
          {/* Fixed Proshow banner */}
          <div
            className="sticky top-[68px] z-50 pointer-events-none"
            style={{ height: 0 }}
          >
            <div className="relative left-[40px]">
              <img
                className="absolute top-0 left-[-41px] w-[162px] h-[30px]"
                alt="Proshow decorative banner"
                src="https://c.animaapp.com/z3WmKXFp/img/vector-6.svg"
              />
              <div className="absolute top-[3px] left-[12px] [font-family:'Instrument_Serif',Helvetica] font-normal text-[#ffdfc4] text-[18.1px] tracking-[0] leading-[normal]">
                Proshow
              </div>
            </div>
          </div>

          <div className="relative">
            {artists.map((artist, i) => (
              <div
                key={artist.name}
                ref={(el) => {
                  rightPanelRefs.current[i] = el;
                }}
                className="relative w-full flex items-center justify-center py-10"
                style={{ minHeight: "200vh" }}
              >
                <ArtistCard artist={artist} />
              </div>
            ))}
            {/* Extra scroll runway so the last artist's scrubbed
                animation (scrub: 1.2) has room to fully complete
                even during fast scrolls. Without this, the page
                hits the scroll boundary before the animation
                catches up, leaving the last image half-faded. */}
            <div style={{ height: "50vh" }} aria-hidden="true" />
          </div>
        </div>
      </section>
    </>
  );
};
