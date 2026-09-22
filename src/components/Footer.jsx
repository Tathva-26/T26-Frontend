"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Bebas_Neue, Varela } from "next/font/google";
import { GlowLetters } from "./glow";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const varela = Varela({ weight: "400", subsets: ["latin"], variable: "--font-varela" });

const EVENT_DATE = new Date("2026-11-13T00:00:00");

const linkColumns = [
  {
    heading: "EXPLORE",
    links: ["ANOUNCEMENTS", "TEAMS", "MAP", "CONTACTS"],
  },
  {
    heading: "ABOUT",
    links: ["HOME", "EVENTS", "LECTURES", "WORKSHOPS", "PASSES"],
  },
  {
    heading: "MORE",
    links: ["GALLERY", "FAQ", "CARRERS", "SPONSORS"],
  },
];

function useCountdown(target) {
  const [timeLeft, setTimeLeft] = useState({ d: "00", h: "00", m: "00", s: "00" });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      const totalSeconds = Math.floor(diff / 1000);

      const d = Math.floor(totalSeconds / 86400);
      const h = Math.floor((totalSeconds % 86400) / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      const pad = (n) => n.toString().padStart(2, "0");
      setTimeLeft({ d: pad(d), h: pad(h), m: pad(m), s: pad(s) });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return timeLeft;
}

function CountdownUnit({ value }) {
  const ref = useRef(null);
  const previous = useRef(value);

  useGSAP(() => {
    if (previous.current !== value) {
      gsap.fromTo(
        ref.current,
        { y: -8, opacity: 0.4, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }
      );
      previous.current = value;
    }
  }, [value]);

  return <span ref={ref}>{value}</span>;
}

function FooterLink({ label }) {
  const arrowRef = useRef(null);
  const textRef = useRef(null);
  const { contextSafe } = useGSAP();

  const onEnter = contextSafe(() => {
    gsap.to(textRef.current, { x: 3, color: "#F19EDC", duration: 0.25, ease: "power2.out" });
    gsap.to(arrowRef.current, { x: 7, scale: 1.08, duration: 0.3, ease: "power2.out" });
  });

  const onLeave = contextSafe(() => {
    gsap.to(textRef.current, { x: 0, color: "#FFFFFF", duration: 0.25, ease: "power2.out" });
    gsap.to(arrowRef.current, { x: 0, scale: 1, duration: 0.3, ease: "power2.out" });
  });

  return (
    <a
      href="#"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="relative flex min-h-[38px] w-full items-center justify-between gap-4 rounded px-1 py-1 font-varela text-[12px] tracking-[0.14em] text-white transition-colors active:bg-white/5 sm:min-h-[20px]"
    >
      <span ref={textRef}>{label}</span>
      <span ref={arrowRef} className="absolute right-[-4px] top-1/2 inline-flex h-4 w-4 -translate-y-1/2 items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 10H16M10 4L16 10L10 16" stroke="#F19EDC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

function MobileNavAccordion({ column, index }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`footer-col w-full sm:translate-y-5 sm:w-[150px] sm:px-4 ${index !== 0 ? "sm:border-l sm:border-[#383838]" : ""}`}>
      {/* Mobile Toggleable Header / Desktop Static Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="mb-1 flex min-h-[24px] w-full items-center justify-between sm:pointer-events-none sm:mb-2.5 sm:cursor-default sm:min-h-[24px]"
      >
        <div className="flex w-full items-center gap-2.5">
          <h3 className="min-w-0 font-bebas text-[22px] sm:text-[20px] leading-none tracking-[0.08em] text-white">
            {column.heading}
          </h3>
          <div className="h-[1px] flex-1 bg-[#444444]" />
        </div>
        <span className="sm:hidden text-[#F19EDC] text-lg font-bold pl-2">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {/* Accordion Links Wrapper */}
      <ul className={`${isOpen ? "block" : "hidden"} space-y-0.5 pb-2 sm:block sm:pb-0`}>
        {column.links.map((link) => (
          <li key={link}>
            <FooterLink label={link} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { h, m, s } = useCountdown(EVENT_DATE);

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const headlineRef = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 85%",
          once: true,
        },
      });

      tl.from(headlineRef.current, { y: 35, opacity: 0, duration: 0.6, ease: "power3.out" })
        .from(panelRef.current, { y: 45, opacity: 0, duration: 0.7, ease: "power3.out" }, "-=0.3")
        .from(".footer-col", { y: 18, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, "-=0.4")
        .from(".footer-countdown", { scale: 0.85, opacity: 0, duration: 0.5, ease: "back.out(1.7)" }, "-=0.3");
    },
    { scope: rootRef }
  );

  return (
    <footer ref={rootRef} className={`${bebasNeue.variable} ${varela.variable} footer-typography relative mt-auto w-full overflow-hidden bg-transparent pb-4 pt-4 text-white lg:pb-5 lg:pt-6`}>
      <style>{`
        @font-face {
          font-family: 'Akira Expanded';
          src: url('/fonts/AkiraExpanded.woff2') format('woff2');
          font-weight: 800;
          font-style: normal;
          font-display: swap;
        }

        .font-akira { font-family: 'Akira Expanded', 'Anton', sans-serif; }
        .font-bebas { font-family: var(--font-bebas), sans-serif; }
        .font-varela { font-family: var(--font-varela), sans-serif; }
        .footer-typography, .footer-typography * {
          font-family: var(--font-bebas), sans-serif;
          font-weight: 400;
          font-style: normal;
          font-size: 15.8px;
          line-height: 100%;
          letter-spacing: 0.1em;
        }
        .footer-typography h2 {
          font-family: 'Akira Expanded', 'Anton', sans-serif;
          font-weight: 800;
          font-style: normal;
          font-size: 194.32px;
          line-height: 100%;
          letter-spacing: 0;
          color: transparent;
          -webkit-text-stroke: 1.5px #444444;
        }
        .footer-typography .footer-countdown > p {
          font-family: var(--font-bebas), sans-serif;
          font-weight: 400;
          font-style: normal;
          font-size: 27.95px;
          line-height: 100%;
          letter-spacing: 0;
        }
        .footer-typography .footer-countdown > div {
          font-family: 'Akira Expanded', 'Anton', sans-serif;
          font-weight: 800;
          font-style: normal;
          font-size: 48.6px;
          line-height: 100%;
          letter-spacing: 0.08em;
        }
        .footer-typography .footer-countdown > div span {
          font-family: 'Akira Expanded', 'Anton', sans-serif;
          font-weight: 800;
          font-style: normal;
          font-size: 48.6px;
          line-height: 100%;
          letter-spacing: 0.08em;
        }

        .footer-panel-shape-mobile {
          display: none;
        }

        @media (max-width: 1023px) {
          .footer-typography .footer-panel {
            min-height: 0;
          }

          .footer-panel-shape-desktop {
            display: none;
          }

          .footer-panel-shape-mobile {
            display: block;
          }

          .footer-typography .footer-panel-content {
            min-height: 0;
          }

          .footer-typography .footer-newsletter,
          .footer-typography .footer-navigation,
          .footer-typography .footer-countdown {
            min-width: 0;
            width: 100%;
          }

          .footer-typography .footer-countdown {
            padding-bottom: 0.5rem;
          }
        }

        @media (max-width: 639px) {
          .footer-typography h2 {
            font-size: clamp(58px, 19vw, 110px);
            -webkit-text-stroke-width: 1px;
          }

          .footer-typography .footer-panel-content {
            gap: 1rem;
            padding: 1.25rem 1.25rem 1.5rem;
          }

          .footer-typography .footer-newsletter > p:first-child {
            font-size: clamp(18px, 5.8vw, 24px);
            line-height: 1.1;
          }

          .footer-typography .footer-newsletter > p:nth-child(2) {
            max-width: 26rem;
            font-size: 13px;
            line-height: 1.3;
          }

          .footer-typography .footer-newsletter form {
            max-width: none;
            width: 100%;
          }

          .footer-typography .footer-navigation {
            gap: 0.25rem;
          }

          .footer-typography .footer-countdown > div,
          .footer-typography .footer-countdown > div span {
            font-size: clamp(34px, 12vw, 48.6px);
          }

          .footer-typography .footer-bottom-labels {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
            align-items: end;
            gap: 0.35rem;
            padding-left: 1.25rem;
            padding-right: 1.25rem;
            font-size: 8px;
            letter-spacing: 0.05em;
          }

          .footer-typography .footer-bottom-labels span {
            max-width: none;
            min-width: 0;
            white-space: nowrap;
            font-size: 8px;
            line-height: 1.2;
          }

          .footer-typography .footer-bottom-labels span:first-child {
            text-align: left;
          }

          .footer-typography .footer-bottom-labels span:nth-child(2) {
            text-align: center;
          }

          .footer-typography .footer-bottom-labels span:last-child {
            text-align: right;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .footer-typography h2 {
            font-size: clamp(72px, 12vw, 126px);
          }
        }
      `}</style>

      <div className="relative mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-12">
    
        {/* ASTERIA BACKGROUND TEXT */}
        <div className="relative z-10 -mb-[20px] sm:-mb-[32px] lg:-mb-[45px]">
  <h2
    ref={headlineRef}
    className="relative z-20 -translate-y-1 text-center font-akira text-[15vw] font-extrabold uppercase leading-[100%] tracking-[0%] sm:text-[14vw] lg:text-[150px] xl:text-[180px]"
  >
    ASTERIA
  </h2>
  <GlowLetters
  text="ASTERIA"
  textColor="transparent"
  textFit={0.905}
  textY={0.5}
  fontFamily="'Akira Expanded', 'Anton', sans-serif"
  fontWeight={800}
  fontSize={194.32}
  textYOffset={15}
  radius={170}
/>
</div>

        {/* MAIN CHAMFERED PANEL FRAME */}
        <div ref={panelRef} className="footer-panel relative z-10 min-h-[250px] w-full lg:min-h-[270px]">
          <svg
            className="footer-panel-shape-desktop pointer-events-none absolute inset-0 h-full w-full drop-shadow-xl"
            viewBox="0 0 1331 295"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 43.3222 L34.5879 0 H215.213 H226.044 H446.498 L482.483 43.3222 H824.169 L865.395 0 H1293.73 L1330.06 43.3222 V245.958 L1293.73 294.521 H48.9121 L0 255.042 Z"
              fill="#222222"
            />
          </svg>

          <svg
            className="footer-panel-shape-mobile pointer-events-none absolute inset-0 h-full w-full drop-shadow-xl"
            viewBox="0 0 1331 295"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 28 L22 0 H1309 L1331 28 V267 L1309 295 H22 L0 267 Z"
              fill="#222222"
            />
          </svg>

          <div className="footer-panel-content relative z-10 grid min-h-full grid-cols-1 items-center gap-6 px-6 py-5 sm:px-8 lg:grid-cols-[280px_1fr_240px] lg:gap-0 lg:px-[64px] lg:py-6">

            {/* NEWSLETTER SECTION */}
            <div className="footer-newsletter self-center">
              <p className="font-bebas text-[22px] sm:text-[24px] lg:text-[26px] leading-[28px] tracking-[0.02em] text-white font-normal">
                GET THE LATEST UPDATES &amp; SIGNALS
              </p>
              <p className="mt-2 w-full sm:w-[250px] font-bebas text-[14px] sm:text-[15px] lg:text-[16px] leading-[19px] text-[#A0A0A0]">
                BE THE FIRST TO KNOW ABOUT EVENTS, WORKSHOPS, PASSES AND MORE
              </p>

              <form onSubmit={(e) => e.preventDefault()} className="relative mt-4 h-[42px] w-full max-w-[300px] sm:mt-5 sm:w-[270px]">
                <svg
                  viewBox="0 0 297 44"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.838867 34.6907 V11.7501 L8.39247 0.839355 H286.197 L295.709 8.95248 V34.6907 L286.197 43.0836 H243.393 H10.9103 L0.838867 34.6907 Z"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M255.982 25.7383 L243.113 40.0063 H283.399 L292.911 31.6134 V11.1907 L284.798 4.7561 H256.262 L255.982 25.7383 Z"
                    fill="#3F7393"
                  />
                  <path
                    d="M271.836 22.5004 H283.249 M277.542 28.2068 L283.249 22.5004 L277.542 16.7939"
                    stroke="#F5F5F5"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <input
                  type="email"
                  required
                  placeholder="Enter Your Email"
                  className="absolute inset-0 w-full bg-transparent pl-[20px] sm:pl-[26px] pr-[55px] font-varela text-[13.47px]
                             font-normal leading-none tracking-[0.28em] text-white outline-none placeholder:text-[#A0A0A0]"
                />

                <button type="submit" aria-label="Subscribe" className="absolute right-0 top-0 h-full w-[54px] sm:w-[48px]" />
              </form>
            </div>

            {/* NAVIGATION COLUMNS */}
           <div className="footer-navigation flex h-auto flex-col items-start justify-center gap-1 sm:flex-row sm:gap-0 sm:pt-1 lg:h-full">
              {linkColumns.map((column, index) => (
                <MobileNavAccordion key={column.heading} column={column} index={index} />
              ))}
            </div>

            {/* COUNTDOWN */}
            <div className="footer-countdown self-center text-center pt-2 sm:pt-0">
              <p className="font-bebas text-[20px] sm:text-[22px] lg:text-[24px] leading-[24px] tracking-[0.05em] text-white">DAYS TO GO</p>
              <div className="mt-1.5 whitespace-nowrap font-akira text-[48.6px] font-extrabold leading-none tracking-[0.08em] text-white">
                <CountdownUnit value={h} />:<CountdownUnit value={m} />:<CountdownUnit value={s} />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FRAME & COPYRIGHT OVERLAY */}
       <div className="relative z-20 -mt-[14px] w-full lg:-mt-[18px]">
  <svg
    viewBox="0 0 1339 76"
    fill="none"
    preserveAspectRatio="none"
    className="h-[48px] w-full lg:h-[58px]"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.04785 9.08366V40.8765L44.7194 74.7657H498.904L536.636 54.8514H830.458L860.853 74.7657L1301.41 71.9707L1337.05 30.3954V1.0481"
      stroke="#fffdfe"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>

  <div className="footer-bottom-labels absolute inset-0 flex flex-wrap items-end justify-between px-6 pb-1 font-varela text-[9px] uppercase tracking-[0.20em] text-[#C0C0C0] sm:flex-nowrap sm:px-12 sm:pb-1.5 sm:text-[10px] sm:tracking-[0.28em] lg:px-[105px] lg:pb-2 lg:text-[11px]">
    <span className="translate-y-[2px]">NIT CALICUT</span>
    <span className="static sm:absolute sm:left-1/2 sm:-translate-x-1/2 translate-y-[0px] sm:translate-y-[-8px] lg:translate-y-[-10px]">TATHVA&apos; 26</span>
    <span className="translate-y-[2px]">ALL RIGHTS RESERVED.</span>
  </div>
</div>
  </div>
    </footer>
  );
}
