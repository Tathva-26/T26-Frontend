"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Navbar
 * ------
 * Minimal, dark, "watery" navigation bar.
 *
 * - No visible bar, border or shadow at rest — only an extremely faint
 *   frosted blur and a slow, deep pulse of light that intensify slightly
 *   as the page scrolls.
 * - Nav links use a vertical text-replacement hover (à la landonorris.com):
 *   the current label slides up and out while an identical copy slides
 *   up and in from below.
 * - The bar itself continuously interpolates between a spacious "top of
 *   page" size and a compact "scrolled" size using a single eased scroll
 *   value (`--scroll-progress`), rather than snapping between two states.
 *
 * Drop this file in as-is. The <style> block is scoped to `nb*` class
 * names, so it's safe to render alongside any existing app styles — move
 * it into Navbar.module.css (and swap classNames accordingly) if this
 * project uses CSS Modules instead.
 */

const NAV_LINKS = [
  { label: "Workshops", href: "#work" },
  { label: "Lectures", href: "#studio" },
  { label: "ProShow", href: "#journal" },
  { label: "Accomodation", href: "#contact" },
];

const SCROLL_RANGE = 140; // px of scroll over which the bar fully compacts
const EASE = 0.12; // per-frame lerp factor — gives the resize physical weight

/* ---- FlipLink portal tuning ------------------------------------------ */
const PORTAL_DURATION = 520; // ms, whole transition (first letter to last)
const PORTAL_SPREAD = 0.3; // share of the duration used to ripple outward from the cursor
const PORTAL_SIGMA_EM = 2.8; // width of the warp falloff, in em
const PORTAL_PINCH = 0.28; // how strongly letters are pulled toward the cursor x
const PORTAL_STRETCH = 0.45; // extra vertical stretch at the contact point
const PORTAL_SQUASH = 0.16; // horizontal squeeze at the contact point
const PORTAL_SKEW = 14; // degrees of shear at maximum influence

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

function FlipLink({ href, children, onClick }) {
  const linkRef = useRef(null);
  const outgoingRef = useRef([]);
  const incomingRef = useRef([]);
  const animationRef = useRef(null);
  const runningRef = useRef(false);

  const text = String(children);

  /*
   * Hover is only the TRIGGER. Once started, the animation runs to
   * completion on its own: no pointerleave handler, no pointermove
   * tracking, nothing reads hover state after this function returns.
   */
  const trigger = (event) => {
    const link = linkRef.current;
    if (!link || runningRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const out = outgoingRef.current;
    const inc = incomingRef.current;
    if (!out[0] || !inc[0]) return;

    runningRef.current = true;

    /*
     * Capture the exact cursor X, relative to the link. Character centres
     * come from layout offsets (not bounding rects) so they are unaffected
     * by any transform left over from the previous run. The rows share the
     * link's left edge, so both coordinates are in the same space.
     */
    const pointerX = event.clientX - link.getBoundingClientRect().left;
    const H = inc[0].offsetHeight; // height of one row = travel distance
    const sigma =
      parseFloat(window.getComputedStyle(link).fontSize) * PORTAL_SIGMA_EM;

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
    <a
      ref={linkRef}
      href={href}
      className="nb-link"
      onPointerEnter={trigger}
      onClick={onClick}
    >
      <span className="nb-link__flip">
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
          <span
            className="nb-link__row nb-link__incoming"
            aria-hidden="true"
          >
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
    </a>
  );
}

export default function Navbar() {
  const navRef = useRef(null);
  const triggerRef = useRef(null);
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
        triggerRef.current?.focus();
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
      <nav ref={navRef} className="nb" aria-label="Primary">
        <div className="nb__glow" aria-hidden="true" />

        <div className="nb__left">
          <a href="#top" className="nb__mark" aria-label="Home">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 3a9 9 0 100 18 7.2 7.2 0 010-18Z"
              />
            </svg>
          </a>

          <ul className="nb__links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <FlipLink href={link.href}>{link.label}</FlipLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="nb__right">
          <a href="#register" className="nb__cta">
            Register
          </a>

          <button
            ref={triggerRef}
            type="button"
            className={`nb__trigger ${menuOpen ? "is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="nb-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
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
          padding-block: calc(30px - var(--scroll-progress, 0) * 16px);
          padding-inline: calc(40px - var(--scroll-progress, 0) * 14px);
          background: rgba(8, 10, 14, calc(var(--scroll-progress, 0) * 0.05));
          backdrop-filter: blur(calc(2px + var(--scroll-progress, 0) * 9px));
          -webkit-backdrop-filter: blur(calc(2px + var(--scroll-progress, 0) * 9px));
          font-family: "Bebas Neue", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif;
          color: #eef3f7;
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
          gap: calc(3.6rem - var(--scroll-progress, 0) * 0.9rem);
          z-index: 1;
        }

        .nb__mark {
          display: flex;
          color: #eef3f7;
          opacity: 0.92;
          flex-shrink: 0;
          border-radius: 4px;
        }

        .nb__mark svg {
          width: calc(22px - var(--scroll-progress, 0) * 5px);
          height: calc(22px - var(--scroll-progress, 0) * 5px);
          display: block;
        }

.nb__links {
  display: flex;
  align-items: center;
  gap: calc(3.2rem - var(--scroll-progress, 0) * 0.8rem);
  list-style: none;
  margin: 0;
  padding: 0;

  font-family: "Mona Sans Variable", Arial, sans-serif;
  font-size: var(--text--btn-primary);
  font-variation-settings: "wdth" 86;
  text-transform: uppercase;
  font-weight: 800;
  line-height: 1;

  color: #f5f9ff;
}

        .nb-link {
          position: relative;
          display: inline-block;
          color: inherit;
          text-decoration: none;
          opacity: 0.78;
          border-radius: 3px;
          transition: opacity 0.35s ease;
        }

        .nb-link:hover,
        .nb-link:focus-within {
          opacity: 1;
        }

        /* ---- FlipLink portal ------------------------------------------ */
.nb-link__flip {
  display: block;
  height: 1.3em;
  overflow: visible;            /* was hidden */
}

.nb-link__portal {
  position: relative;
  display: block;
  height: 1.3em;
  overflow: visible;            /* was hidden */
  clip-path: inset(0 -0.6em);   /* clip top/bottom exactly, allow 0.6em sideways */
}

.nb-link__outgoing {
  position: relative;
  /* remove: margin-right: -0.18em; */
}

        .nb-link__row {
          display: flex;
          align-items: center;
          height: 1.3em;
          line-height: 1.3em;
          white-space: nowrap;
        }

        /*
         * Outgoing row stays in normal flow so it gives the link its width.
         * Incoming row is laid exactly on top of it, in the same slot.
         */

        .nb-link__incoming {
          position: absolute;
          inset: 0;
        }

        .nb-link__char {
          display: inline-block;
          will-change: transform, opacity;
        }

        /* Rest state: incoming copy waits fully below the clipped window. */
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
          color: #eef3f7;
          text-decoration: none;
          font-size: calc(0.72rem - var(--scroll-progress, 0) * 0.03rem);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: calc(0.85em - var(--scroll-progress, 0) * 0.15em) calc(1.9em - var(--scroll-progress, 0) * 0.3em);
          border: 1px solid rgba(238, 243, 247, 0.4);
          border-radius: 999px;
          white-space: nowrap;
          transition: background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease;
        }

        .nb__cta:hover {
          background-color: rgba(238, 243, 247, 0.92);
          color: #0a0c10;
          border-color: rgba(238, 243, 247, 0.92);
        }

        .nb__trigger {
          display: none;
          position: relative;
          width: 26px;
          height: 16px;
          padding: 0;
          background: none;
          border: none;
          cursor: pointer;
        }

        .nb__trigger span {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: #eef3f7;
          transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1), top 0.4s ease;
        }

        .nb__trigger span:nth-child(1) { top: 2px; }
        .nb__trigger span:nth-child(2) { top: 13px; }

        .nb__trigger.is-open span:nth-child(1) { top: 7px; transform: rotate(45deg); }
        .nb__trigger.is-open span:nth-child(2) { top: 7px; transform: rotate(-45deg); }

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
          color: #eef3f7;
          text-decoration: none;
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          opacity: 0.9;
          transition: opacity 0.25s ease;
        }

        .nb-mobile__link:hover,
        .nb-mobile__link:focus-visible {
          opacity: 1;
        }

        .nb-mobile__cta {
          color: #0a0c10;
          background: #eef3f7;
          text-decoration: none;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 1em 2.2em;
          border-radius: 999px;
        }

        .nb-link:focus-visible,
        .nb__mark:focus-visible,
        .nb__cta:focus-visible,
        .nb__trigger:focus-visible,
        .nb-mobile__cta:focus-visible {
          outline: 1px solid rgba(238, 243, 247, 0.65);
          outline-offset: 4px;
        }

        @media (max-width: 720px) {
          .nb {
            padding-inline: 20px;
          }
          .nb__links,
          .nb__cta {
            display: none;
          }
          .nb__trigger {
            display: block;
          }
          .nb-mobile {
            display: flex;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nb__glow {
            animation: none;
            opacity: 0.06;
          }
          .nb__trigger span {
            transition: none;
          }
          .nb-mobile {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}