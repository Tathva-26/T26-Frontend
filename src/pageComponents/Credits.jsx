"use client";

import React, { useEffect, useRef, useState } from "react";
import { teams as defaultTeams, PLACEHOLDER } from "@/lib/creditsData";

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL LAYOUT CONFIGURATION
   Easily tweak height, width, gaps, and padding here in one place!
───────────────────────────────────────────────────────────────────────────── */
export const CREDITS_CONFIG = {
  // 1. Maximum width of each card
  cardMaxWidth: "230px",

  // 2. Aspect ratio or fixed height for cards (e.g. "aspect-[9/16]", "aspect-[3/4]", "h-[360px]")
  cardAspectRatio: "aspect-[9/16]",

  // 3. Gap between cards in the grid (e.g. "gap-8 sm:gap-10 md:gap-12" or "gap-x-6 gap-y-12")
  cardGridGap: "gap-8 sm:gap-10 md:gap-12",

  // 4. Vertical spacing between team sections (padding top/bottom):
  sectionVerticalPadding: "py-12 sm:py-16",

  // 5. Maximum width of page content container:
  containerMaxWidth: "max-w-7xl",
};

/* ─── Social Icons ─── */
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

/* ─── Scroll Observer ─── */
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

/* ─── Interactive Stardust & Cosmic Background (Clean Neutral + Violet) ─── */
function FuturisticCyberBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const particleCount = Math.min(80, Math.floor((width * height) / 20000));
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.5 + 0.8,
        color: Math.random() > 0.35 ? "#ffffff" : "#a78bfa", // clean stardust white & subtle violet
        baseAlpha: Math.random() * 0.4 + 0.15,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.baseAlpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 120) * 0.15;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        if (mouseRef.current.active) {
          const mdx = p.x - mouseRef.current.x;
          const mdy = p.y - mouseRef.current.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mDist < 160) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.globalAlpha = (1 - mDist / 160) * 0.35;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Deep Space Background */}
      <div className="absolute inset-0 bg-[#05060b]" />

      {/* Interactive Stardust Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Subtle Perspective Floor (Clean Slate/Violet, No Electric Blue) */}
      <div className="absolute inset-x-0 bottom-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div
          className="absolute inset-x-0 -bottom-[120px] h-[550px] w-full origin-bottom"
          style={{
            transform: "perspective(400px) rotateX(74deg)",
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(139, 92, 246, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage: "linear-gradient(to top, rgba(0,0,0,1) 25%, transparent 95%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 25%, transparent 95%)",
          }}
        />
        {/* Soft Horizon Line */}
        <div className="absolute bottom-[280px] inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Ambient Deep Nebula Lights (Violet & Deep Indigo) */}
      <div className="absolute top-[5%] left-[20%] w-[650px] h-[650px] rounded-full bg-violet-600/[0.06] blur-[180px]" />
      <div className="absolute top-[45%] right-[15%] w-[600px] h-[600px] rounded-full bg-purple-600/[0.05] blur-[180px]" />
      <div className="absolute bottom-[10%] left-[30%] w-[550px] h-[550px] rounded-full bg-indigo-600/[0.04] blur-[170px]" />

      {/* Subtle Shooting Star Streaks */}
      <div className="laser-streak laser-1" />
      <div className="laser-streak laser-2" />
    </div>
  );
}

/* ─── Clean, Modern 3D Parallax Card ─── */
function MemberCard({ name, role, message, image, linkedin, github, index }) {
  const cardRef = useRef(null);
  const containerRef = useFadeIn();
  const [failed, setFailed] = useState(false);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");

  const displaySrc = failed ? PLACEHOLDER : (image || PLACEHOLDER);

  const handlePointerMove = (e) => {
    if (e.pointerType === "touch" || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty("--light-x", `${x}px`);
    cardRef.current.style.setProperty("--light-y", `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -9;
    const rotateY = ((x - centerX) / centerX) * 9;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale3d(1.025, 1.025, 1.025)`);
  };

  const handlePointerLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)");
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
        transitionDelay: `${index * 60}ms`,
      }}
    >
      {/* 3D Card Box (Clean, No Blue Borders or Reticles) */}
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ transform, transition: "transform 0.28s cubic-bezier(0.23, 1, 0.32, 1)" }}
        className={`tc-custom-card relative w-full ${CREDITS_CONFIG.cardAspectRatio} rounded-2xl overflow-hidden cursor-pointer select-none bg-[#0c0d16] border border-white/10 group-hover:border-white/30 transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.8)] group-hover:shadow-[0_20px_40px_-6px_rgba(139,92,246,0.35),0_0_25px_rgba(255,255,255,0.08)]`}
      >
        {/* Photo with smooth zoom on hover */}
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={name}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-950/30 to-[#0c0d16] flex items-center justify-center">
            <svg className="w-16 h-16 text-white/20" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="36" r="21" />
              <path d="M10 96 c0 -22 18 -40 40 -40 c22 0 40 18 40 40 Z" />
            </svg>
          </div>
        )}

        {/* Clean Neutral Cursor Spotlight */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{
            background:
              "radial-gradient(200px circle at var(--light-x, 50%) var(--light-y, 50%), rgba(255, 255, 255, 0.18), transparent 70%)",
          }}
        />

        {/* Subtle Accent Glow Ring on Hover */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 shadow-[inset_0_0_20px_rgba(139,92,246,0.3)]" />

        {/* Gradient backdrop at bottom for text contrast */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-20" />

        {/* ── Clean Personal Note on Hover (No "Transmission" or Blue Headers) ── */}
        <div className="absolute inset-x-3 bottom-3 z-30 p-3 rounded-xl bg-black/75 backdrop-blur-xl border border-white/15 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out shadow-2xl pointer-events-none">
          <p className="text-xs text-white/95 leading-snug font-medium italic drop-shadow-sm">
            &ldquo;{message}&rdquo;
          </p>
        </div>
      </div>

      {/* Name, Role & Socials below card */}
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

/* ─── Team Section (Clean Headers) ─── */
function TeamSection({ title, members }) {
  const titleRef = useFadeIn();

  return (
    <section className={`w-full ${CREDITS_CONFIG.containerMaxWidth} mx-auto px-4 sm:px-8 ${CREDITS_CONFIG.sectionVerticalPadding}`}>
      {/* Clean Section Title */}
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

/* ─── Hero Section (Clean White / Violet) ─── */
function Hero() {
  const ref = useFadeIn();
  return (
    <section
      ref={ref}
      className={`credits-fade-in relative w-full ${CREDITS_CONFIG.containerMaxWidth} mx-auto px-4 sm:px-8 pt-20 sm:pt-24 pb-8 sm:pb-10`}
    >
      <p className="text-violet-400 font-mono text-xs sm:text-sm tracking-widest uppercase mb-2">
        The people behind
      </p>
      <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-tight flex items-baseline gap-3 flex-wrap">
        <span>Tathva&apos;26</span>
        <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-white bg-clip-text text-transparent">
          Tech Team
        </span>
      </h1>
    </section>
  );
}

/* ─── Main Credits Page Component ─── */
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

        /* Subtle Stardust Shooting Streaks */
        .laser-streak {
          position: absolute;
          width: 200px;
          height: 1.5px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(167, 139, 250, 0.5), transparent);
          filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.6));
          opacity: 0;
          transform: rotate(-35deg);
          pointer-events: none;
        }
        .laser-1 {
          top: 18%;
          left: 15%;
          animation: laserMove1 10s ease-in-out infinite 1s;
        }
        .laser-2 {
          top: 60%;
          right: 10%;
          animation: laserMove2 13s ease-in-out infinite 5s;
        }

        @keyframes laserMove1 {
          0% {
            transform: translate3d(-100px, -100px, 0) rotate(-35deg);
            opacity: 0;
          }
          8% {
            opacity: 0.9;
          }
          20% {
            transform: translate3d(400px, 280px, 0) rotate(-35deg);
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes laserMove2 {
          0% {
            transform: translate3d(150px, -80px, 0) rotate(-40deg);
            opacity: 0;
          }
          8% {
            opacity: 0.8;
          }
          22% {
            transform: translate3d(-350px, 300px, 0) rotate(-40deg);
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>

      <div className="relative min-h-screen w-full bg-[#05060b] overflow-x-hidden text-slate-100">
        {/* Futuristic Background */}
        <FuturisticCyberBackground />

        {/* Content */}
        <div className="relative z-10">
          <Hero />

          {/* Divider */}
          <div className={`w-full ${CREDITS_CONFIG.containerMaxWidth} mx-auto px-4 sm:px-8`}>
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Team Sections */}
          {displayTeams.map((team) => (
            <TeamSection
              key={team.title}
              title={team.title}
              members={team.members}
            />
          ))}

          {/* Clean Minimal Footer */}
          <footer className={`w-full ${CREDITS_CONFIG.containerMaxWidth} mx-auto px-4 sm:px-8 py-12 text-center`}>
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
