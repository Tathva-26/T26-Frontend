"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * RobowarsHero — Figma Frame #62:193 (1413×697)
 *
 * Layout mirrors the Figma structure precisely:
 *   - Split two-column headline: "ROBO/FIGHT" (right-aligned, left side)
 *     and "WARS/ON" (left-aligned, right side)
 *   - Vertical white divider line between the two columns
 *   - Date lockup centered with flanking horizontal lines
 *   - Prize + Arena info in a two-column grid
 *   - Robots positioned absolutely, overlapping from edges
 *
 * Font Substitution Notes (see DESIGN_SPECS.md):
 *   - "Calm Serif"         → Cinzel (closest Google Font serif)
 *   - "Akira Expanded"     → Archivo Black (closest Google Font bold display)
 *   - "Instrument Serif"   → Instrument Serif (exact match ✓)
 *   - "Alata"              → Alata (exact match ✓)
 *   - "Lancaste Serif Demo"→ Cinzel Light (closest substitute)
 */

export default function RobowarsHero() {
  const containerRef = useRef(null);
  const leftRobotRef = useRef(null);
  const rightRobotRef = useRef(null);
  const centerContentRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Left robot: slide in from left — DESIGN_SPECS §6
      gsap.fromTo(
        leftRobotRef.current,
        { xPercent: -80, opacity: 0.1, scale: 0.9 },
        {
          xPercent: 0,
          opacity: 1,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            end: "center 50%",
            scrub: 1.2,
          },
        }
      );

      // Right robot: slide in from right — DESIGN_SPECS §6
      gsap.fromTo(
        rightRobotRef.current,
        { xPercent: 80, opacity: 0.1, scale: 0.9 },
        {
          xPercent: 0,
          opacity: 1,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            end: "center 50%",
            scrub: 1.2,
          },
        }
      );

      // Center content: subtle zoom & reveal — DESIGN_SPECS §6
      gsap.fromTo(
        centerContentRef.current,
        { scale: 0.92, opacity: 0.3 },
        {
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            end: "center 50%",
            scrub: 1,
          },
        }
      );
    }, containerRef);

    // Mandatory unmount cleanup — DESIGN_SPECS §6
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen overflow-hidden bg-[#050507] text-white flex items-center justify-center select-none"
    >
      {/* ─── Background Ambiance ─── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Spotlight glow from top (amber + purple tint) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-72 bg-gradient-to-b from-amber-500/10 via-purple-600/5 to-transparent blur-3xl" />
        {/* Bottom vignette */}
        <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-black via-[#07070b]/80 to-transparent" />
        {/* Subtle grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* ─── Left Robot (Figma: "right 1" #62:197) ─── */}
      {/* Figma: x=-28, y=-82, 805×949. Bleeds past left & top edges */}
      <div
        ref={leftRobotRef}
        className="absolute left-[-2%] bottom-0 z-20 w-[50vw] sm:w-[42vw] md:w-[38vw] max-w-[570px] pointer-events-none will-change-transform"
      >
        <Image
          src="/images/Robowars/robot-left.svg"
          alt="Left Mecha Fighter"
          width={805}
          height={950}
          priority
          className="w-full h-auto object-contain drop-shadow-[0_15px_35px_rgba(255,150,0,0.15)]"
        />
      </div>

      {/* ─── Right Robot (Figma: "Left 1" #62:198) ─── */}
      {/* Figma: x=535, y=0, 888×796. Extends past right edge */}
      <div
        ref={rightRobotRef}
        className="absolute right-[-2%] bottom-0 z-20 w-[50vw] sm:w-[42vw] md:w-[38vw] max-w-[570px] pointer-events-none will-change-transform"
      >
        <Image
          src="/images/Robowars/robot-right.svg"
          alt="Right Mecha Fighter"
          width={888}
          height={797}
          priority
          className="w-full h-auto object-contain drop-shadow-[0_15px_35px_rgba(120,50,255,0.2)]"
        />
      </div>

      {/* ─── Center Stage Content ─── */}
      <div
        ref={centerContentRef}
        className="relative z-30 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto"
      >
        {/* ── Top Badge (Figma: #62:208 pill + #62:209 text) ── */}
        {/* Figma: Instrument Serif, 18.06px, 400, color #FFDFC4 */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="px-6 py-1.5 bg-black/90 border border-white/10 shadow-lg backdrop-blur-sm"
            style={{ clipPath: "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)" }}
          >
            <span className="font-instrument-serif text-[14px] sm:text-[18px] font-normal text-[#FFDFC4] tracking-wide">
              Robowars
            </span>
          </div>
        </div>

        {/* ── Main Headline: Two-Column Split ── */}
        {/* Figma layout: LEFT column (right-aligned) | gap | RIGHT column (left-aligned) */}
        <div className="flex items-start justify-center gap-2 sm:gap-4 md:gap-6">

          {/* Left Column: "ROBO" + "FIGHT" (Figma: #62:199, right-aligned) */}
          <div className="text-right">
            {/* "ROBO" — Figma: Calm Serif → Cinzel, 99.81px, 400, leading 0.95em */}
            <h1 className="font-cinzel font-normal text-white uppercase leading-[0.95em]
              text-[40px] sm:text-[60px] md:text-[80px] lg:text-[100px]">
              ROBO
            </h1>
            {/* "FIGHT" — Figma: Akira Expanded → Archivo Black, 70px, 800, leading 1.15em */}
            <p className="font-archivo-black font-normal text-white uppercase leading-[1.15em] tracking-[0.04em]
              text-[32px] sm:text-[46px] md:text-[58px] lg:text-[70px]">
              FIGHT
            </p>
          </div>

          {/* Right Column: "WARS" + "ON" (Figma: #62:201, left-aligned) */}
          <div className="text-left">
            {/* "WARS" — Figma: Calm Serif → Cinzel, 99.81px, 400, leading 1.15em */}
            <p className="font-cinzel font-normal text-white uppercase leading-[1.15em]
              text-[40px] sm:text-[60px] md:text-[80px] lg:text-[100px]">
              WARS
            </p>
            {/* "ON" — Figma: Akira Expanded → Archivo Black, 70px, 800, leading 1.15em */}
            <p className="font-archivo-black font-normal text-white uppercase leading-[1.15em] tracking-[0.04em]
              text-[32px] sm:text-[46px] md:text-[58px] lg:text-[70px]">
              ON
            </p>
          </div>
        </div>

        {/* ── Date Divider Lockup (Figma: #62:204, 422×29.5) ── */}
        {/* Figma: line—"OCT 9,10"—line. Alata 26.11px, 400, #FFFFFF */}
        <div className="flex items-center justify-center gap-4 sm:gap-5 my-6 sm:my-8 w-full max-w-[420px] px-2">
          {/* Left line (Figma: #62:206, 159.5px wide, stroke 2px white) */}
          <div className="h-[2px] flex-1 bg-white" />
          <span className="font-alata text-[16px] sm:text-[20px] md:text-[26px] font-normal text-white tracking-[0.12em] whitespace-nowrap uppercase">
            OCT 9,10
          </span>
          {/* Right line (Figma: #62:207, 159.5px wide, stroke 2px white) */}
          <div className="h-[2px] flex-1 bg-white" />
        </div>

        {/* ── Event Highlights: Prizes & Arena (Figma: side-by-side at y=480) ── */}
        <div className="flex items-start justify-center gap-8 sm:gap-14 md:gap-20 w-full max-w-2xl mt-1 sm:mt-2">

          {/* Prizes Column (Figma: #62:203, x=464, right-aligned, 207×66) */}
          <div className="text-right">
            {/* "PRIZES WORTH INR" — Figma: Lancaste Serif Demo → Cinzel, 24.01px, 250 */}
            <p className="font-cinzel font-normal text-white/90 uppercase tracking-wider
              text-[11px] sm:text-[16px] md:text-[20px] lg:text-[24px] leading-[1.0em]">
              PRIZES WORTH INR
            </p>
            {/* "8 LAKH" — Figma: Alata, 24.01px, bold, color #EB9A58 */}
            <p className="font-alata font-normal text-[#EB9A58] uppercase tracking-wider
              text-[16px] sm:text-[20px] md:text-[24px] leading-[1.38em] mt-0.5">
              8 LAKH
            </p>
          </div>

          {/* Arena Column (Figma: #62:202, x=721, left-aligned, 373.36×66) */}
          <div className="text-left">
            {/* "16 x 16 FT. ARENA" — Figma: Alata, 24.01px, 400 */}
            <p className="font-alata font-normal text-white/90 uppercase tracking-wider
              text-[11px] sm:text-[16px] md:text-[20px] lg:text-[24px] leading-[1.38em]">
              16 x 16 FT. ARENA
            </p>
            {/* "8KG \ 15KG" — Figma: Alata, 24.01px, 400 */}
            <p className="font-alata font-normal text-white uppercase tracking-widest
              text-[14px] sm:text-[18px] md:text-[24px] leading-[1.38em] mt-0.5">
              8KG \ 15KG
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
