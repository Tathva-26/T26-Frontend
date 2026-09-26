"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";

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

const allMenuItems = [...leftMenu, ...rightMenu];

export default function TathvaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const dividerRef = useRef(null);
  const triggerRef = useRef(null);

  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);

  const timelineRef = useRef(null);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isMobileOpen) setIsMobileOpen(false);
        if (isOpen && timelineRef.current) {
          timelineRef.current.reverse();
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, isOpen]);

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
         INITIAL STATE (Desktop)
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
         MAIN MENU TIMELINE (Desktop)
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
     OPEN / CLOSE DESKTOP MENU
  ===================================================== */

  const toggleDesktopMenu = () => {
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
          MOBILE NAVIGATION HEADER & HAMBURGER (Mobile only)
      ================================================= */}
      <header
        className="
          pointer-events-auto
          fixed
          top-0
          left-0
          right-0
          z-[10002]
          flex
          h-14
          items-center
          bg-[#2E2E2F]
          px-3
          shadow-lg
          border-b
          border-white/10
          md:hidden
        "
      >
        {/* Left: Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileOpen}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-md
            p-2
            text-white
            hover:bg-white/10
            focus:outline-none
            transition-colors
          "
        >
          <span className="sr-only">Toggle navigation menu</span>
          <div className="relative flex h-4 w-5 flex-col justify-between">
            <span
              className={`
                h-0.5
                w-full
                rounded-full
                bg-white
                transition-all
                duration-300
                ease-in-out
                ${isMobileOpen ? "translate-y-[7px] rotate-45" : ""}
              `}
            />
            <span
              className={`
                h-0.5
                w-full
                rounded-full
                bg-white
                transition-all
                duration-200
                ease-in-out
                ${isMobileOpen ? "opacity-0 scale-x-0" : "opacity-100"}
              `}
            />
            <span
              className={`
                h-0.5
                w-full
                rounded-full
                bg-white
                transition-all
                duration-300
                ease-in-out
                ${isMobileOpen ? "-translate-y-[7px] -rotate-45" : ""}
              `}
            />
          </div>
        </button>
      </header>

      {/* =================================================
          MOBILE MENU BACKDROP OVERLAY
      ================================================= */}
      <div
        onClick={() => setIsMobileOpen(false)}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
        className={`
          pointer-events-auto
          fixed
          inset-0
          top-14
          z-[10000]
          transition-opacity
          duration-[250ms]
          ease
          md:hidden
          ${isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        aria-hidden="true"
      />

      {/* =================================================
          MOBILE MENU PANEL (Left side only)
      ================================================= */}
      <aside
        className={`
          pointer-events-auto
          fixed
          top-14
          left-0
          bottom-0
          z-[10001]
          flex
          w-[75%]
          max-w-[280px]
          flex-col
          bg-[#2E2E2F]
          shadow-2xl
          border-r
          border-white/10
          transition-transform
          duration-300
          ease-in-out
          md:hidden
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav
          className="
            flex-1
            overflow-y-auto
            px-4
            py-[22px]
            pb-12
            flex
            flex-col
            items-start
            gap-[14px]
          "
        >
          {allMenuItems.map((item, idx) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              style={{
                transitionDelay: isMobileOpen
                  ? `${(0.05 + idx * 0.06).toFixed(2)}s`
                  : "0s",
              }}
              className={`
                group
                relative
                flex
                w-full
                items-center
                justify-start
                gap-2.5
                px-2
                py-1.5
                rounded-lg
                text-left
                text-[19px]
                font-normal
                tracking-[1.5px]
                text-[#999999]
                no-underline
                transition-all
                duration-300
                ease
                hover:text-white
                hover:bg-white/5
                active:text-[#00E564]
                font-jockey
                ${
                  isMobileOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-[10px]"
                }
              `}
            >
              <img
                src="/images/menu/leftwave.png"
                alt=""
                draggable={false}
                className="
                  pointer-events-none
                  h-[12px]
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

              <span>{item.label}</span>

              <img
                src="/images/menu/rightwave.png"
                alt=""
                draggable={false}
                className="
                  pointer-events-none
                  h-[12px]
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
      </aside>

      {/* =================================================
          DESKTOP DARK MENU PANEL (Hidden on mobile)
      ================================================= */}

      <div
        ref={panelRef}
        className="
          pointer-events-auto
          absolute
          left-1/2
          top-0
          hidden
          md:flex
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
                if (isOpen) toggleDesktopMenu();
              }}
              className="
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
                font-jockey
              "
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

              <span>{item.label}</span>

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
                if (isOpen) toggleDesktopMenu();
              }}
              className="
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
                font-jockey
              "
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

              <span>{item.label}</span>

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
          DESKTOP MAIN TATHVA TOP CENTER STRIP BUTTON (Hidden on mobile)
      ================================================= */}

      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDesktopMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        className="
          pointer-events-auto
          absolute
          left-1/2
          top-0
          z-20
          hidden
          md:flex
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
    </div>
  );
}
