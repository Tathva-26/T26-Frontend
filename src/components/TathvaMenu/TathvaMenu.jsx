"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Jockey_One } from "next/font/google";

const jockeyOne = Jockey_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const leftMenu = [
  { label: "HOME", href: "/" },
  { label: "ANNOUNCEMENTS", href: "/announcements" },
  { label: "ACCOMMODATIONS", href: "/accommodations" },
  { label: "LECTURES", href: "/lectures" },
  { label: "CREDITS", href: "/credits" },
  { label: "ROBOWARS", href: "/robowars" },
];

const rightMenu = [
  { label: "PROFILE", href: "/profile" },
  { label: "WORKSHOPS", href: "/workshops" },
  { label: "PASSES", href: "/passes" },
  { label: "MAP", href: "/map" },
  { label: "COMPETITIONS", href: "/competitions" },
  { label: "CONTACT", href: "/contact" },
];

/* -----------------------------------------------------------------------
   Portal text hover (ported from the reference Navbar's FlipLink)
   -----------------------------------------------------------------------
   Same constants and per-character math as the reference implementation,
   character-by-character outgoing/incoming rows, requestAnimationFrame
   render loop, Gaussian cursor-proximity warp, prefers-reduced-motion
   bailout. Nothing here is approximated with a CSS transition.

   One adaptation: in the reference file the hovered <a> WAS the text, so
   pointer position and the "link" bounding box were the same box. Here
   each <Link> also wraps the leftwave/rightwave images, so PortalText
   owns its own wrapping span (ref'd, hover-bound) around just the text,
   and all pointer/offset math is taken relative to that span. That keeps
   the character distances correct regardless of the images/gap sitting
   next to it, without touching the wave images or the Link itself.
----------------------------------------------------------------------- */

const PORTAL_DURATION = 520; // ms, whole transition (first letter to last)
const PORTAL_SPREAD = 0.3; // share of the duration used to ripple outward from the cursor
const PORTAL_SIGMA_EM = 2.8; // width of the warp falloff, in em
const PORTAL_PINCH = 0.28; // how strongly letters are pulled toward the cursor x
const PORTAL_STRETCH = 0.45; // extra vertical stretch at the contact point
const PORTAL_SQUASH = 0.16; // horizontal squeeze at the contact point
const PORTAL_SKEW = 14; // degrees of shear at maximum influence

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

function PortalText({ text }) {
  const wrapRef = useRef(null);
  const outgoingRef = useRef([]);
  const incomingRef = useRef([]);
  const animationRef = useRef(null);
  const runningRef = useRef(false);

  /*
   * Hover is only the TRIGGER. Once started, the animation runs to
   * completion on its own: no pointerleave handler, no pointermove
   * tracking, nothing reads hover state after this function returns.
   */
  const trigger = (event) => {
    const wrap = wrapRef.current;
    if (!wrap || runningRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const out = outgoingRef.current;
    const inc = incomingRef.current;
    if (!out[0] || !inc[0]) return;

    runningRef.current = true;

    /*
     * Capture the exact cursor X, relative to this text span. Character
     * centres come from layout offsets (not bounding rects) so they are
     * unaffected by any transform left over from the previous run.
     */
    const pointerX = event.clientX - wrap.getBoundingClientRect().left;
    const H = inc[0].offsetHeight; // height of one row = travel distance
    const sigma =
      parseFloat(window.getComputedStyle(wrap).fontSize) * PORTAL_SIGMA_EM;

    /*
     * Per-character distance from the cursor and a smooth gaussian
     * influence (1 under the cursor, falling off continuously). A cursor
     * between two letters gives both neighbours nearly equal influence,
     * so the warp originates between them.
     */
    const cells = [];
    for (let i = 0; i < text.length; i++) {
      const char = out[i];
      if (!char) {
        cells.push({ d: 0, w: 0 });
        continue;
      }
      const d = char.offsetLeft + char.offsetWidth / 2 - pointerX;
      cells.push({ d, w: Math.exp(-((d / sigma) * (d / sigma))) });
    }

    /*
     * Draws one frame for BOTH copies from a single timeline value t (0..1).
     * The incoming copy is the outgoing copy shifted one row down, with the
     * identical warp, so together they form one continuous strip passing
     * through the clipped window.
     */
    const render = (t) => {
      for (let i = 0; i < text.length; i++) {
        const o = out[i];
        const n = inc[i];
        if (!o || !n) continue;

        const { d, w } = cells[i];

        /* Letters near the cursor start immediately; the rest ripple out. */
        const local = clamp01(
          (t - PORTAL_SPREAD * (1 - w)) / (1 - PORTAL_SPREAD)
        );
        const p = easeOutQuart(local); // 0 -> 1, fast start, soft landing

        /* Warp strength: 0 at rest, peaks early, back to 0 on arrival. */
        const bell = Math.sin(Math.PI * p) * w;

        const dx = -d * PORTAL_PINCH * bell;
        const skew = (d / sigma) * PORTAL_SKEW * bell;
        const sx = 1 - PORTAL_SQUASH * bell;
        const sy = 1 + PORTAL_STRETCH * bell;
        const shape = ` skewX(${skew}deg) scale(${sx}, ${sy})`;

        o.style.transform = `translate3d(${dx}px, ${-p * H}px, 0)` + shape;
        n.style.transform = `translate3d(${dx}px, ${H - p * H}px, 0)` + shape;

        /* Outgoing copy dissolves only as it leaves the window. */
        o.style.opacity = String(1 - clamp01((p - 0.6) / 0.4));
        n.style.opacity = "1";
      }
    };

    /*
     * Clean start: outgoing copy at its natural position, incoming copy
     * one row below. On a repeat run the previous incoming copy is
     * showing identical text in the identical spot, so this swap is
     * invisible. Frame 0 is drawn now, so there is no delay before motion.
     */
    render(0);

    const start = performance.now();

    const tick = (now) => {
      const raw = clamp01((now - start) / PORTAL_DURATION);
      render(raw);

      if (raw < 1) {
        animationRef.current = requestAnimationFrame(tick);
        return;
      }

      /*
       * Finish: outgoing copy stays parked and hidden above the window;
       * incoming copy stays exactly at its resting position, fully
       * visible. Nothing is cleared back to the offscreen CSS start.
       */
      for (let i = 0; i < text.length; i++) {
        const o = out[i];
        const n = inc[i];
        if (!o || !n) continue;
        o.style.transform = `translate3d(0, ${-H}px, 0)`;
        o.style.opacity = "0";
        n.style.transform = "none";
        n.style.opacity = "1";
      }

      runningRef.current = false;
      animationRef.current = null;
    };

    animationRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <span ref={wrapRef} className="mlink-flip" onPointerEnter={trigger}>
      <span className="mlink-portal">
        {/* OUTGOING */}
        <span className="mlink-row mlink-outgoing">
          {text.split("").map((char, index) => (
            <span
              key={`out-${index}`}
              ref={(el) => {
                outgoingRef.current[index] = el;
              }}
              className="mlink-char"
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>

        {/* INCOMING */}
        <span className="mlink-row mlink-incoming" aria-hidden="true">
          {text.split("").map((char, index) => (
            <span
              key={`in-${index}`}
              ref={(el) => {
                incomingRef.current[index] = el;
              }}
              className="mlink-char"
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

export default function TathvaMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const dividerRef = useRef(null);
  const triggerRef = useRef(null);

  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);

  const timelineRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (
        !panelRef.current ||
        !dividerRef.current ||
        !triggerRef.current ||
        !leftColumnRef.current ||
        !rightColumnRef.current
      ) {
        return;
      }

      const leftItems = Array.from(leftColumnRef.current.children);
      const rightItems = Array.from(rightColumnRef.current.children);

      /* -----------------------------------------------
         INITIAL STATE
      ------------------------------------------------ */

      gsap.set(panelRef.current, {
        width: 110,
        height: 0,
      });

      gsap.set(dividerRef.current, {
        height: 0,
        opacity: 0,
      });

      gsap.set([...leftItems, ...rightItems], {
        opacity: 0,
        y: -14,
      });

      gsap.set(triggerRef.current, {
        y: 0,
      });

      /* -----------------------------------------------
         MAIN MENU TIMELINE
      ------------------------------------------------ */

      const tl = gsap.timeline({
        paused: true,
      });

      timelineRef.current = tl;

      /* 1. VERTICAL UNROLL: STRIP DROPS & NARROW PANEL UNROLLS VERTICALLY ATTACHED */
      tl.to(
        triggerRef.current,
        {
          y: 380,
          duration: 0.5,
          ease: "power2.inOut",
        },
        0
      );

      tl.to(
        panelRef.current,
        {
          height: 385,
          duration: 0.5,
          ease: "power2.inOut",
        },
        0
      );

      /* 2. HORIZONTAL EXPANSION */
      tl.to(
        panelRef.current,
        {
          width: () => Math.min(580, window.innerWidth * 0.92),
          duration: 0.55,
          ease: "expo.out",
        },
        ">"
      );

      /* 3. CENTER LINE FALLS */
      tl.to(
        dividerRef.current,
        {
          height: 320,
          opacity: 1,
          duration: 0.35,
          ease: "power3.out",
        },
        "-=0.25"
      );

      /* 4. TEXT APPEARS */
      tl.to(
        [...leftItems, ...rightItems],
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: {
            each: 0.035,
          },
          ease: "power2.out",
        },
        "-=0.15"
      );
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  /* =====================================================
     OPEN / CLOSE MENU
  ===================================================== */

  const toggleMenu = () => {
    const timeline = timelineRef.current;

    if (!timeline) return;
    if (timeline.isActive()) return;

    if (!isOpen) {
      timeline.play();
      setIsOpen(true);
    } else {
      timeline.reverse();
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="
        pointer-events-none
        fixed
        inset-0
        z-[9999]
        h-full
        w-full
      "
    >
      {/* =================================================
          DARK MENU PANEL
      ================================================= */}

      <div
        ref={panelRef}
        className="
          pointer-events-auto
          absolute
          left-1/2
          top-0
          flex
          -translate-x-1/2
          justify-center
          overflow-hidden
          bg-[#2E2E2F]
          shadow-2xl
          [clip-path:polygon(0_0,100%_0,100%_92%,93%_100%,7%_100%,0_92%)]
        "
      >
        {/* LEFT MENU */}

        <nav
          ref={leftColumnRef}
          className="
            absolute
            left-0
            top-0
            flex
            h-full
            w-1/2
            flex-col
            items-center
            justify-center
            gap-[18px]
            px-4
            py-6
          "
        >
          {leftMenu.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                if (isOpen) toggleMenu();
              }}
              className={`
                group
                relative
                flex
                items-center
                justify-center
                gap-2.5
                whitespace-nowrap
                text-[18px]
                font-normal
                leading-none
                tracking-[1px]
                text-[#999999]
                no-underline
                opacity-0
                transition-colors
                duration-200
                hover:text-white
                ${jockeyOne.className}
              `}
            >
              <img
                src="/images/menu/leftwave.png"
                alt=""
                draggable={false}
                className="
                  pointer-events-none
                  h-[14px]
                  w-auto
                  object-contain
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  -translate-x-1
                "
              />

              <PortalText text={item.label} />

              <img
                src="/images/menu/rightwave.png"
                alt=""
                draggable={false}
                className="
                  pointer-events-none
                  h-[14px]
                  w-auto
                  object-contain
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  translate-x-1
                "
              />
            </Link>
          ))}
        </nav>

        {/* CENTER LINE */}

        <div
          ref={dividerRef}
          className="
            absolute
            left-1/2
            top-5
            z-10
            w-px
            -translate-x-1/2
            origin-top
            bg-[#444444]
          "
        />

        {/* RIGHT MENU */}

        <nav
          ref={rightColumnRef}
          className="
            absolute
            right-0
            top-0
            flex
            h-full
            w-1/2
            flex-col
            items-center
            justify-center
            gap-[18px]
            px-4
            py-6
          "
        >
          {rightMenu.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                if (isOpen) toggleMenu();
              }}
              className={`
                group
                relative
                flex
                items-center
                justify-center
                gap-2.5
                whitespace-nowrap
                text-[18px]
                font-normal
                leading-none
                tracking-[1px]
                text-[#999999]
                no-underline
                opacity-0
                transition-colors
                duration-200
                hover:text-white
                ${jockeyOne.className}
              `}
            >
              <img
                src="/images/menu/leftwave.png"
                alt=""
                draggable={false}
                className="
                  pointer-events-none
                  h-[14px]
                  w-auto
                  object-contain
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  -translate-x-1
                "
              />

              <PortalText text={item.label} />

              <img
                src="/images/menu/rightwave.png"
                alt=""
                draggable={false}
                className="
                  pointer-events-none
                  h-[14px]
                  w-auto
                  object-contain
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  translate-x-1
                "
              />
            </Link>
          ))}
        </nav>
      </div>

      {/* =================================================
          MAIN TATHVA TOP CENTER STRIP BUTTON
      ================================================= */}

      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        className="
          pointer-events-auto
          absolute
          left-1/2
          top-0
          z-20
          flex
          h-[38px]
          w-[110px]
          -translate-x-1/2
          cursor-pointer
          items-center
          justify-center
          border-0
          bg-transparent
          p-0
          outline-none
        "
      >
        <img
          src="/images/menu/tathva.png"
          alt="Tathva 26"
          draggable={false}
          className="
            pointer-events-none
            block
            h-full
            w-full
            select-none
            object-contain
          "
        />
      </button>

      <style>{`
        .mlink-flip {
          display: block;
          height: 1.3em;
          overflow: visible;
        }

        .mlink-portal {
          position: relative;
          display: block;
          height: 1.3em;
          overflow: visible;
          clip-path: inset(0 -0.6em);
        }

        .mlink-row {
          display: flex;
          align-items: center;
          height: 1.3em;
          line-height: 1.3em;
          white-space: nowrap;
        }

        .mlink-outgoing {
          position: relative;
        }

        .mlink-incoming {
          position: absolute;
          inset: 0;
        }

        .mlink-char {
          display: inline-block;
          will-change: transform, opacity;
        }

        .mlink-incoming .mlink-char {
          transform: translate3d(0, 110%, 0);
        }
      `}</style>
    </div>
  );
}