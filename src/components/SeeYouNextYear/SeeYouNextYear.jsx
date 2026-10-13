'use client';

import Link from 'next/link';
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu';
import Navbar from '@/pageComponents/Navbar/Navbar';

/**
 * Full-page "event is over" screen.
 * Drop-in replacement for any page that's been decommissioned for this year.
 */
export default function SeeYouNextYear({ pageName = '' }) {
  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #010208 0%, #020610 50%, #051230 100%)' }}
    >
      <Navbar />
      <TathvaMenu />
      {/* ── Starfield ── */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {[...Array(180)].map((_, i) => (
          <circle
            key={`d-${i}`}
            cx={`${(i * 31 + 7) % 100}%`}
            cy={`${(i * 47 + 11) % 100}%`}
            r={0.3 + (i % 3) * 0.15}
            fill="white"
            opacity={0.12 + (i % 5) * 0.06}
          />
        ))}
        {[...Array(60)].map((_, i) => (
          <circle
            key={`b-${i}`}
            cx={`${(i * 67 + 31) % 100}%`}
            cy={`${(i * 83 + 13) % 100}%`}
            r={1.2 + (i % 3) * 0.4}
            fill="white"
            opacity={0.75}
          />
        ))}
      </svg>

      {/* ── Glow blobs ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-[#071840]/40 blur-[180px]" />
        <div className="absolute bottom-0 left-[-5%] w-[50%] h-[260px] rounded-full bg-[#0e2350]/40 blur-[100px]" />
        <div className="absolute bottom-[-4%] right-[-5%] w-[50%] h-[280px] rounded-full bg-[#122a58]/45 blur-[110px]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        {/* Tathva wordmark */}
        <p
          className="text-[11px] tracking-[6px] uppercase text-white/40 mb-6"
          style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}
        >
          Tathva &rsquo;26 &nbsp;·&nbsp; NIT Calicut
        </p>

        {/* Main headline */}
        <h1
          className="font-black uppercase text-white leading-none tracking-tight mb-4"
          style={{
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(3rem, 12vw, 6rem)',
            WebkitTextStroke: '2px white',
          }}
        >
          See You<br />Next Year!
        </h1>

        {/* Sub-line */}
        <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-10">
          {pageName
            ? `The ${pageName} portal has closed for Tathva '26.`
            : "This section has closed for Tathva '26."}
          <br />
          Stay tuned — Tathva &rsquo;27 is going to be even bigger. 🚀
        </p>

        {/* Divider */}
        <div className="w-24 h-[1px] bg-white/20 mb-10" />

        {/* CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/20 text-white/80 text-sm tracking-widest uppercase hover:bg-white/10 hover:text-white transition-all duration-300"
        >
          ← Back to Home
        </Link>
      </div>

      {/* ── Bottom shooting star decoration ── */}
      <div className="pointer-events-none absolute top-[12%] left-[18%] w-[180px] h-[1.5px] bg-gradient-to-r from-transparent via-[#5eaee8]/80 to-transparent rotate-[135deg] opacity-70 blur-[0.5px]" />
      <div className="pointer-events-none absolute top-[11.4%] left-[16.8%] w-[4px] h-[4px] rounded-full bg-white/90 blur-[1px]" />
    </div>
  );
}
