"use client";

import React from "react";

/**
 * PersonImage Component
 * ---------------------
 * Renders the person's photo inside the square white frame.
 * If a custom `src` image is provided, it seamlessly displays the photo.
 * If no `src` is provided, displays the clean avatar silhouette.
 */
export function PersonImage({ src, alt = "Lead Member", className = "" }) {
  return (
    <div
      className={`relative aspect-square w-full h-full bg-white flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#d0d0d0] rounded-full overflow-hidden flex items-center justify-center">
          <svg
            className="w-full h-full text-[#9c9c9c]"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <circle cx="50" cy="36" r="21" />
            <path d="M10 96 c0 -22 18 -40 40 -40 c22 0 40 18 40 40 Z" />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Social Icons (LinkedIn & GitHub)
 */
function LinkedInIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function GitHubIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

/**
 * LeadCard Component
 * ------------------
 * Uses the ripped paper sunburst card element.
 * Supports custom photo (via PersonImage), custom name text,
 * and clickable LinkedIn / GitHub profile links.
 */
export function LeadCard({
  name = "NAME SURNAME",
  image = null,
  linkedin = "https://linkedin.com",
  github = "https://github.com",
  className = "",
  style = {},
}) {
  return (
    <div
      style={style}
      className={`relative group w-full aspect-[276/499] max-h-[76vh] flex items-center justify-center transition-transform duration-300 hover:-translate-y-2 select-none ${className}`}
    >
      {/* Base Torn Sunburst Card Element */}
      <img
        src="/images/lead-card.png"
        alt={name}
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Person Image Overlay (renders inside the square frame) */}
      {image && (
        <div className="absolute top-[22.8%] left-[15.6%] w-[68.8%] h-[38.2%] z-10 overflow-hidden bg-white flex items-center justify-center">
          <PersonImage src={image} alt={name} />
        </div>
      )}

      {/* Name Text (if customized, overrides default text cleanly) */}
      {name && name !== "NAME SURNAME" && (
        <div className="absolute top-[66.1%] inset-x-0 z-20 flex justify-center px-4">
          <span className="text-white font-extrabold text-[12px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] tracking-[1.5px] uppercase text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
            {name}
          </span>
        </div>
      )}

      {/* Interactive Clickable Social Profile Links */}
      <div className="absolute top-[73.1%] inset-x-0 z-30 flex items-center justify-center gap-3 sm:gap-4 pointer-events-auto">
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name}'s LinkedIn Profile`}
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center rounded text-white hover:text-[#0077b5] transition-all duration-200 transform hover:scale-125 focus:outline-none"
        >
          <span className="sr-only">LinkedIn</span>
        </a>
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name}'s GitHub Profile`}
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full text-white hover:text-[#e6edf3] transition-all duration-200 transform hover:scale-125 focus:outline-none"
        >
          <span className="sr-only">GitHub</span>
        </a>
      </div>
    </div>
  );
}

/**
 * Default Leads Data (5 Members)
 */
const defaultLeads = [
  {
    name: "NAME SURNAME",
    image: null,
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  {
    name: "NAME SURNAME",
    image: null,
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  {
    name: "NAME SURNAME",
    image: null,
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  {
    name: "NAME SURNAME",
    image: null,
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  {
    name: "NAME SURNAME",
    image: null,
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
];

/**
 * Main Lead Page Component
 */
export default function Lead({ leads = defaultLeads }) {
  return (
    <div className="relative h-screen h-[100dvh] w-full bg-[#010208] overflow-x-hidden overflow-y-auto overscroll-contain flex flex-col font-sans select-none [-webkit-overflow-scrolling:touch]">
      {/* =====================================================
          SPACE BACKGROUND: very dark sky, stars, shooting star, subtle blue clouds
      ===================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base: near-black gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#010308] via-[#020610] to-[#051230]" />

        {/* Very subtle radial glow for depth (darker) */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#071840]/25 blur-[180px]" />

        {/* Shooting Star Glow Streak */}
        <div className="absolute top-[10%] left-[18%] w-[220px] h-[1.5px] bg-gradient-to-r from-transparent via-[#5eaee8]/80 to-transparent rotate-[135deg] opacity-70 blur-[0.5px]" />
        {/* Shooting star head glow */}
        <div className="absolute top-[9.2%] left-[16.5%] w-[4px] h-[4px] rounded-full bg-white/80 blur-[1px]" />

        {/* High-quality Starfield — multiple layers for depth */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Distant dim stars */}
          {[...Array(200)].map((_, i) => {
            const x = ((i * 31 + 7) % 100) + "%";
            const y = ((i * 47 + 11) % 100) + "%";
            const r = 0.3 + (i % 3) * 0.15;
            const opacity = 0.12 + ((i % 5) * 0.06);
            return (
              <circle key={`dim-${i}`} cx={x} cy={y} r={r} fill="white" opacity={opacity} />
            );
          })}
          {/* Mid-brightness stars */}
          {[...Array(80)].map((_, i) => {
            const x = ((i * 43 + 19) % 100) + "%";
            const y = ((i * 61 + 23) % 100) + "%";
            const r = 0.5 + (i % 4) * 0.25;
            const opacity = 0.3 + ((i % 6) * 0.08);
            return (
              <circle key={`mid-${i}`} cx={x} cy={y} r={r} fill="white" opacity={opacity} />
            );
          })}
          {/* Bright accent stars */}
          {[...Array(20)].map((_, i) => {
            const x = ((i * 67 + 31) % 100) + "%";
            const y = ((i * 83 + 13) % 100) + "%";
            const r = 1.2 + (i % 3) * 0.5;
            return (
              <circle key={`bright-${i}`} cx={x} cy={y} r={r} fill="white" opacity={0.85} />
            );
          })}
        </svg>

        {/* Blue nebula clouds at bottom — darker and subtler */}
        <div className="absolute bottom-0 inset-x-0 h-[38%] bg-gradient-to-t from-[#081e4a]/80 via-[#061640]/40 to-transparent" />
        {/* Mist cloud left */}
        <div className="absolute bottom-[1%] left-[-6%] w-[50%] h-[240px] rounded-full bg-[#0e2350]/40 blur-[90px]" />
        {/* Mist cloud right */}
        <div className="absolute bottom-[-1%] right-[-6%] w-[50%] h-[260px] rounded-full bg-[#122a58]/45 blur-[100px]" />
        {/* Center bottom cloud */}
        <div className="absolute bottom-[-4%] left-[22%] w-[56%] h-[180px] rounded-full bg-[#152e60]/35 blur-[80px]" />
      </div>

      {/* =====================================================
          MAIN SECTION: LEAD TITLE (always visible) + CARDS
      ===================================================== */}
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start sm:justify-center px-3 sm:px-5 md:px-8 lg:px-10 pt-20 pb-10 sm:py-6 max-w-[1920px] mx-auto">
        
        {/* "LEAD" title — crisp rendered text, always sharp at any size */}
        <div className="w-full flex justify-center pb-0 pointer-events-none select-none">
          <h1
            className="text-[18vw] sm:text-[14vw] md:text-[12vw] lg:text-[10vw] xl:text-[9vw] font-black uppercase text-white leading-[1.1] sm:leading-[0.85] tracking-[0.04em] [-webkit-text-stroke:5px_white] drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}
          >
            LEAD
          </h1>
        </div>

        {/* 5 Lead Cards — negative top margin on larger screens so they overlap LEAD */}
        <div className="relative z-10 w-full flex flex-wrap items-start justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-5 -mt-2 sm:-mt-3 md:-mt-6 lg:-mt-10 py-2 scrollbar-none">
          {leads.map((lead, index) => (
            <div
              key={index}
              className="w-[42%] sm:w-[30%] md:w-[22%] lg:w-[18%] min-w-[140px] max-w-[300px]"
            >
              <LeadCard
                name={lead.name}
                image={lead.image}
                linkedin={lead.linkedin}
                github={lead.github}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}