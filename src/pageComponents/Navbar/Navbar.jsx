"use client";

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Hammersmith_One, Instrument_Serif } from "next/font/google";
import Link from "next/link";
/**
 * Navbar
 * ------
 * Minimal, dark navigation bar with a vertical text-replacement hover
 * ("portal") on every link, including the Register CTA.
 *
 * Fonts are self-hosted via next/font/google, scoped to this component
 * through CSS variables (--font-hammersmith / --font-instrument-serif).
 * If these fonts are already loaded globally elsewhere in the app (e.g.
 * in layout.jsx), you can remove the two calls below and just reference
 * the same variable names instead.
 */

const hammersmithOne = Hammersmith_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-hammersmith",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
  variable: "--font-instrument-serif",
});

const NAV_LINKS = [
  { label: "Workshops", href: "/workshops" },
  { label: "Lectures", href: "/lectures" },
  { label: "ProShow", href: "/proshow" },
  { label: "Accommodation", href: "/accommodation" },
  { label: "Map", href: "/map" },

];

const SCROLL_RANGE = 140; // px of scroll over which the bar fully compacts
const EASE = 0.12; // per-frame lerp factor — gives the resize physical weight

/* ---- FlipText portal tuning ------------------------------------------ */
const PORTAL_DURATION = 520; // ms, whole transition (first letter to last)
const PORTAL_SPREAD = 0.3; // share of the duration used to ripple outward from the cursor
const PORTAL_SIGMA_EM = 2.8; // width of the warp falloff, in em
const PORTAL_PINCH = 0.28; // how strongly letters are pulled toward the cursor x
const PORTAL_STRETCH = 0.45; // extra vertical stretch at the contact point
const PORTAL_SQUASH = 0.16; // horizontal squeeze at the contact point
const PORTAL_SKEW = 14; // degrees of shear at maximum influence

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

/**
 * FlipText
 * --------
 * The portal animation itself, detached from any particular wrapper
 * element. Used directly inside nav links (via FlipLink) and inside the
 * Register CTA, which needs the line/arrow to sit outside the flip.
 *
 * Exposes trigger(event) via ref so a parent element (like the whole CTA
 * button) can start the animation on its own pointerenter, using this
 * span's position for the warp math. The span also wires its own
 * pointerenter as a sane default for plain nav-link usage.
 */
const FlipText = React.forwardRef(function FlipText(
  { text, className },
  ref
) {
  const rootRef = useRef(null);
  const outgoingRef = useRef([]);
  const incomingRef = useRef([]);
  const animationRef = useRef(null);
  const runningRef = useRef(false);

  const trigger = useCallback(
    (event) => {
      const root = rootRef.current;
      if (!root || runningRef.current) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const out = outgoingRef.current;
      const inc = incomingRef.current;
      if (!out[0] || !inc[0]) return;

      runningRef.current = true;

      /*
       * Capture the exact cursor X, relative to this span. Character
       * centres come from layout offsets (not bounding rects) so they
       * are unaffected by any transform left over from the previous run.
       */
      const pointerX = event.clientX - root.getBoundingClientRect().left;
      const H = inc[0].offsetHeight; // height of one row = travel distance
      const sigma =
        parseFloat(window.getComputedStyle(root).fontSize) *
        PORTAL_SIGMA_EM;

      /*
       * Per-character distance from the cursor and a smooth gaussian
       * influence (1 under the cursor, falling off continuously). A
       * cursor between two letters gives both neighbours nearly equal
       * influence, so the warp originates between them.
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
       * Draws one frame for BOTH copies from a single timeline value
       * t (0..1). The incoming copy is the outgoing copy shifted one row
       * down, with the identical warp, so together they form one
       * continuous strip passing through the clipped window.
       */
      const render = (t) => {
        for (let i = 0; i < text.length; i++) {
          const o = out[i];
          const n = inc[i];
          if (!o || !n) continue;

          const { d, w } = cells[i];

          const local = clamp01(
            (t - PORTAL_SPREAD * (1 - w)) / (1 - PORTAL_SPREAD)
          );
          const p = easeOutQuart(local);

          const bell = Math.sin(Math.PI * p) * w;

          const dx = -d * PORTAL_PINCH * bell;
          const skew = (d / sigma) * PORTAL_SKEW * bell;
          const sx = 1 - PORTAL_SQUASH * bell;
          const sy = 1 + PORTAL_STRETCH * bell;
          const shape = ` skewX(${skew}deg) scale(${sx}, ${sy})`;

          o.style.transform = `translate3d(${dx}px, ${-p * H}px, 0)` + shape;
          n.style.transform =
            `translate3d(${dx}px, ${H - p * H}px, 0)` + shape;

          o.style.opacity = String(1 - clamp01((p - 0.6) / 0.4));
          n.style.opacity = "1";
        }
      };

      render(0);

      const start = performance.now();

      const tick = (now) => {
        const raw = clamp01((now - start) / PORTAL_DURATION);
        render(raw);

        if (raw < 1) {
          animationRef.current = requestAnimationFrame(tick);
          return;
        }

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
    },
    [text]
  );

  useImperativeHandle(ref, () => ({ trigger }), [trigger]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <span
      ref={rootRef}
      className={`nb-link__flip${className ? ` ${className}` : ""}`}
      onPointerEnter={trigger}
    >
      <span className="nb-link__portal">
        {/* OUTGOING */}
        <span className="nb-link__row nb-link__outgoing">
          {text.split("").map((char, index) => (
            <span
              key={`out-${index}`}
              ref={(el) => {
                outgoingRef.current[index] = el;
              }}
              className="nb-link__char"
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>

        {/* INCOMING */}
        <span className="nb-link__row nb-link__incoming" aria-hidden="true">
          {text.split("").map((char, index) => (
            <span
              key={`in-${index}`}
              ref={(el) => {
                incomingRef.current[index] = el;
              }}
              className="nb-link__char"
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
});

function FlipLink({ href, children, onClick, className }) {
  return (
    <a
      href={href}
      className={`nb-link${className ? ` ${className}` : ""}`}
      onClick={onClick}
    >
      <FlipText text={String(children)} />
    </a>
  );
}

function MenuIcon() {
  return (
    <svg
      width="27"
      height="18"
      viewBox="0 0 27 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line
        x1="6.5"
        y1="3.5"
        x2="20.5"
        y2="3.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="1.5"
        y1="9.5"
        x2="25.5"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="6.5"
        y1="16.5"
        x2="20.5"
        y2="16.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const navRef = useRef(null);
  const menuButtonRef = useRef(null);
  const registerFlipRef = useRef(null);
  const rafId = useRef(null);
  const current = useRef(0);
  const target = useRef(0);
  const reduceMotion = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Continuous, eased scroll progress (0 → 1) driving every size change.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion.current = media.matches;
    const handleMediaChange = () => {
      reduceMotion.current = media.matches;
    };
    media.addEventListener?.("change", handleMediaChange);

    const applyProgress = (value) => {
      navRef.current?.style.setProperty("--scroll-progress", value.toFixed(4));
    };

    const step = () => {
      const diff = target.current - current.current;
      if (reduceMotion.current || Math.abs(diff) < 0.001) {
        current.current = target.current;
        applyProgress(current.current);
        rafId.current = null;
        return;
      }
      current.current += diff * EASE;
      applyProgress(current.current);
      rafId.current = requestAnimationFrame(step);
    };

    const requestStep = () => {
      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(step);
      }
    };

    const handleScroll = () => {
      const y = window.scrollY || 0;
      target.current = Math.min(1, Math.max(0, y / SCROLL_RANGE));
      requestStep();
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      media.removeEventListener?.("change", handleMediaChange);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Lock background scroll while the mobile menu is open; close on Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <nav
        ref={navRef}
        className={`nb ${hammersmithOne.variable} ${instrumentSerif.variable}`}
        aria-label="Primary"
      >
        <div className="nb__glow" aria-hidden="true" />

        <div className="nb__left">
          <Link href="/hero" className="nb__mark" aria-label="Home">
            <img src="/images/hero/tathvalogo.png" alt="Tathva" />
          </Link>

          <ul className="nb__links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <FlipLink href={link.href}>{link.label}</FlipLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="nb__right">
          <a
            href="#register"
            className="nb__cta"
            onPointerEnter={(event) => registerFlipRef.current?.trigger(event)}
          >
            <span className="nb__cta-line" aria-hidden="true" />
            <FlipText ref={registerFlipRef} text="Register" />
            <img
              src="/images/hero/regarrow.svg"
              alt=""
              className="nb__cta-arrow"
            />
          </a>

          <button
            ref={menuButtonRef}
            type="button"
            className="nb__menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="nb-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      <div
        id="nb-mobile-menu"
        className={`nb-mobile ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobile">
          <ul className="nb-mobile__links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="nb-mobile__link"
                  onClick={closeMenu}
                  tabIndex={menuOpen ? 0 : -1}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#register"
            className="nb-mobile__cta"
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
          >
            Register
          </a>
        </nav>
      </div>

      <style>{`
        .nb {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
padding-block: calc(18px - var(--scroll-progress, 0) * 10px);
padding-inline: calc(24px - var(--scroll-progress, 0) * 8px);
          background: rgba(8, 10, 14, calc(var(--scroll-progress, 0) * 0.05));
          -webkit-backdrop-filter: blur(calc(2px + var(--scroll-progress, 0) * 9px));
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif;
          color: #fff;
          --scroll-progress: 0;
        }

        .nb__glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: min(460px, 55%);
          height: 160px;
          background: radial-gradient(circle, rgba(58, 88, 108, 0.9) 0%, rgba(58, 88, 108, 0) 72%);
          filter: blur(42px);
          opacity: 0.07;
          z-index: 0;
          pointer-events: none;
          animation: nb-pulse 12s ease-in-out infinite;
        }

        @keyframes nb-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.05; }
          50% { transform: translate(-50%, -50%) scale(1.18); opacity: 0.12; }
        }

        .nb__left {
          display: flex;
          align-items: center;
          gap: calc(2.1rem - var(--scroll-progress, 0) * 0.5rem);
          z-index: 1;
        }

        .nb__mark {
          display: flex;
          align-items: center;
          opacity: 0.95;
          flex-shrink: 0;
          border-radius: 4px;
        }

        .nb__mark img {
          height: calc(32px - var(--scroll-progress, 0) * 8px);
          width: auto;
          display: block;
        }

        .nb__menu {
          display: none;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          flex-shrink: 0;
          opacity: 0.9;
          transition: opacity 0.25s ease;
        }

        .nb__menu:hover {
          opacity: 1;
        }

        .nb__menu svg {
          width: calc(25px - var(--scroll-progress, 0) * 4px);
          height: auto;
          display: block;
        }

        .nb__links {
          display: flex;
          align-items: center;
          gap: 0;
          list-style: none;
          margin: 0;
          padding: 0;
          font-family: var(--font-hammersmith), Arial, sans-serif;
          font-size: calc(0.73rem - var(--scroll-progress, 0) * 0.04rem);
          font-style: normal;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: normal;
          color: #fff;
        }

        .nb__links li {
          display: flex;
          align-items: center;
        }

        .nb__links li:not(:last-child)::after {
          content: "/";
          margin: 0 0.9em;
          color: rgba(255, 255, 255, 0.4);
        }

        .nb-link {
          position: relative;
          display: inline-block;
          color: inherit;
          text-decoration: none;
          opacity: 0.82;
          border-radius: 3px;
          transition: opacity 0.35s ease;
        }

        .nb-link:hover,
        .nb-link:focus-within {
          opacity: 1;
        }

        /* ---- FlipText portal -------------------------------------------- */

        .nb-link__flip {
          display: block;
          height: 1.4em;
          overflow: visible;
        }

        .nb-link__portal {
          position: relative;
          display: block;
          height: 1.4em;
          overflow: visible;
          clip-path: inset(0 -0.6em);
        }

        .nb-link__row {
          display: flex;
          align-items: center;
          height: 1.4em;
          line-height: 1.4em;
          white-space: nowrap;
        }

        .nb-link__outgoing {
          position: relative;
        }

        .nb-link__incoming {
          position: absolute;
          inset: 0;
        }

        .nb-link__char {
          display: inline-block;
          will-change: transform, opacity;
        }

        .nb-link__incoming .nb-link__char {
          transform: translate3d(0, 110%, 0);
        }

        .nb__right {
          display: flex;
          align-items: center;
          gap: 1.4rem;
          z-index: 1;
        }

        .nb__cta {
          display: inline-flex;
          align-items: center;
          gap: 0.9em;
          color: #fff;
          text-decoration: none;
          font-family: var(--font-instrument-serif), Georgia, "Times New Roman", serif;
          font-style: italic;
          font-weight: 400;
          font-size: calc(1.34rem - var(--scroll-progress, 0) * 0.16rem);
          line-height: normal;
          opacity: 0.88;
          transition: opacity 0.35s ease;
        }

        .nb__cta:hover {
          opacity: 1;
        }

        .nb__cta-line {
          width: calc(46px - var(--scroll-progress, 0) * 12px);
          height: 1px;
          background: rgba(255, 255, 255, 0.6);
          display: block;
          flex-shrink: 0;
        }

.nb__cta-arrow {
  width: calc(60px - var(--scroll-progress, 0) * 5px);  /* was 20px - ...4px */
  height: auto;
  display: block;
  flex-shrink: 0;
  transition: transform 0.35s ease;
}

        .nb__cta:hover .nb__cta-arrow {
          transform: translate(2px, -2px);
        }

        .nb-mobile {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: none;
          align-items: center;
          justify-content: center;
          background: rgba(6, 8, 11, 0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.35s ease;
        }

        .nb-mobile.is-open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .nb-mobile nav {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3rem;
        }

        .nb-mobile__links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.6rem;
        }

        .nb-mobile__link {
          color: #fff;
          text-decoration: none;
          font-family: var(--font-hammersmith), Arial, sans-serif;
          font-size: 1.05rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          opacity: 0.9;
          transition: opacity 0.25s ease;
        }

        .nb-mobile__link:hover,
        .nb-mobile__link:focus-visible {
          opacity: 1;
        }

        .nb-mobile__cta {
          color: #fff;
          text-decoration: none;
          font-family: var(--font-instrument-serif), Georgia, "Times New Roman", serif;
          font-style: italic;
          font-size: 1.6rem;
          font-weight: 400;
        }

        .nb-link:focus-visible,
        .nb__mark:focus-visible,
        .nb__menu:focus-visible,
        .nb__cta:focus-visible,
        .nb-mobile__cta:focus-visible {
          outline: 1px solid rgba(255, 255, 255, 0.65);
          outline-offset: 4px;
        }

@media (max-width: 720px) {
  .nb { padding-inline: 20px; }
  .nb__links,
  .nb__cta { display: none; }
  .nb__right { display: flex; gap: 0; }
  .nb__menu { display: flex; }
  .nb-mobile { display: flex; }
}
  @media (max-width: 1023px), (hover: none) {
  .nb,
  .nb-mobile {
    display: none !important;
  }
}

        @media (prefers-reduced-motion: reduce) {
          .nb__glow {
            animation: none;
            opacity: 0.06;
          }
          .nb-mobile {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}