"use client";

import React, { useEffect, useRef, useState } from "react";

import { teams as defaultTeams, PLACEHOLDER } from "@/lib/creditsData";


export const CREDITS_CONFIG = {
  cardMaxWidth: "230px",

  cardAspectRatio: "aspect-[3/4]",

  cardGridGap: "gap-8 sm:gap-10 md:gap-12",

  sectionVerticalPadding: "py-10 sm:py-14",

  containerMaxWidth: "max-w-7xl",
};


function LinkedInIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("credits-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ─── Member Card with tc-card Hover Effects & Hover Message ─── */
function MemberCard({ name, role, message, image, linkedin, github, index }) {
  const cardRef = useRef(null);
  const containerRef = useFadeIn();
  const [failed, setFailed] = useState(false);

  const displaySrc = failed ? PLACEHOLDER : (image || PLACEHOLDER);

  const handlePointerMove = (e) => {
    if (e.pointerType === "touch" || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--light-x", `${x}px`);
    cardRef.current.style.setProperty("--light-y", `${y}px`);
  };

  const handleImageError = () => {
    setFailed(true);
  };

  return (
    <div
      ref={containerRef}
      className="credits-fade-in flex flex-col items-center w-full mx-auto group"
      style={{
        maxWidth: CREDITS_CONFIG.cardMaxWidth,
        transitionDelay: `${index * 70}ms`,
      }}
    >
      {/* Outer Card with tc-card hover spotlight & lift */}
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        className={`tc-custom-card relative w-full ${CREDITS_CONFIG.cardAspectRatio} rounded-2xl overflow-hidden cursor-pointer select-none bg-[#0c0d18] border border-white/10 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_16px_36px_-6px_rgba(124,58,237,0.45),0_0_24px_rgba(124,58,237,0.3)] hover:border-violet-500/50`}
      >
        {/* Photo with zoom effect on hover */}
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={name}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 group-hover:saturate-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-900/30 to-blue-900/20 flex items-center justify-center">
            <svg className="w-16 h-16 text-white/20" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="36" r="21" />
              <path d="M10 96 c0 -22 18 -40 40 -40 c22 0 40 18 40 40 Z" />
            </svg>
          </div>
        )}

        {/* Dynamic Cursor Spotlight (follows pointer) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{
            background:
              "radial-gradient(190px circle at var(--light-x, 50%) var(--light-y, 50%), rgba(255, 255, 255, 0.2), transparent 70%)",
          }}
        />

        {/* Accent Inset Glow Ring */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 shadow-[inset_0_0_18px_rgba(139,92,246,0.4)]" />

        {/* Gradient backdrop at bottom for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-20" />

        {/* ── Hover Message (Written by the person) ── */}
        <div className="absolute inset-x-3 bottom-3 z-30 flex flex-col gap-1.5 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out shadow-lg pointer-events-none">
          <div className="flex items-center gap-1.5 text-violet-400">
            <svg className="w-3.5 h-3.5 shrink-0 opacity-80" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <span className="text-[10px] font-mono tracking-wider uppercase text-violet-300/80 font-semibold">
              Note
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-white/95 leading-snug font-medium italic drop-shadow-sm">
            &ldquo;{message}&rdquo;
          </p>
        </div>
      </div>

      {/* Name, Role & Socials below the photo */}
      <div className="mt-3 flex flex-col items-center text-center gap-1 w-full px-1">
        <h3 className="text-white font-bold text-sm sm:text-base tracking-wide group-hover:text-violet-300 transition-colors duration-200">
          {name}
        </h3>
        {role && (
          <span className="text-[11px] font-mono tracking-wider text-white/40 uppercase">
            {role}
          </span>
        )}

        {/* Social Links */}
        <div className="flex items-center gap-3 mt-1 text-white/40">
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0077b5] hover:scale-115 transition-all duration-200"
            aria-label={`${name}'s LinkedIn`}
          >
            <LinkedInIcon />
          </a>
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white hover:scale-115 transition-all duration-200"
            aria-label={`${name}'s GitHub`}
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Team Section ─── */
function TeamSection({ title, members }) {
  const titleRef = useFadeIn();
  return (
    <section className={`w-full ${CREDITS_CONFIG.containerMaxWidth} mx-auto px-4 sm:px-8 ${CREDITS_CONFIG.sectionVerticalPadding}`}>
      {/* Section Title */}
      <div ref={titleRef} className="credits-fade-in mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>{title}</span>
          <span className="text-violet-400">.</span>
        </h2>
        <div className="mt-2 h-[2px] w-12 bg-gradient-to-r from-violet-500 to-transparent" />
      </div>

      {/* Members Grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${CREDITS_CONFIG.cardGridGap}`}>
        {members.map((member, i) => (
          <MemberCard key={member.name} {...member} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ─── Hero ─── */
function Hero() {
  const ref = useFadeIn();
  return (
    <section
      ref={ref}
      className={`credits-fade-in relative w-full ${CREDITS_CONFIG.containerMaxWidth} mx-auto px-4 sm:px-8 pt-16 sm:pt-20 pb-8 sm:pb-10`}
    >
      <p className="text-violet-400 font-mono text-xs sm:text-sm tracking-widest uppercase mb-2">
        The people behind
      </p>
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-tight flex items-baseline gap-3 flex-wrap">
        <span>Tathva&apos;26</span>
        <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Tech Team
        </span>
      </h1>
    </section>
  );
}

/* ─── Main Credits Page ─── */
export default function Credits({ teams: propTeams }) {
  const displayTeams = propTeams || defaultTeams;

  return (
    <>
      <style jsx global>{`
        .credits-fade-in {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .credits-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes float-subtle {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>

      <div className="relative min-h-screen w-full bg-[#050508] overflow-x-hidden text-slate-100">
        {/* Subtle Ambient Glows */}
        <div className="pointer-events-none fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/[0.05] blur-[140px]" />
        <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-blue-600/[0.04] blur-[140px]" />

        {/* Content */}
        <div className="relative z-10">
          <Hero />

          {/* Divider */}
          <div className={`w-full ${CREDITS_CONFIG.containerMaxWidth} mx-auto px-4 sm:px-8`}>
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {displayTeams.map((team) => (
            <TeamSection key={team.title} title={team.title} members={team.members} />
          ))}

          {/* Footer */}
          <footer className={`w-full ${CREDITS_CONFIG.containerMaxWidth} mx-auto px-4 sm:px-8 py-10 text-center`}>
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
            <p className="text-white/25 text-xs font-mono tracking-widest uppercase">
              TATHVA &apos;26 • NIT CALICUT
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
