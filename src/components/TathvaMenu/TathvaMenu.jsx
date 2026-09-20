"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
    </div>
  );
}





