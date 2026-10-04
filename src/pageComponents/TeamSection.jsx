"use client";

import React from "react";
import { TeamCard, defaultMembers } from "./TeamCards";

export function TeamSection({
  title = "TEAM",
  members = defaultMembers,
  titleSize = "text-[18vw]",
  sectionId,
}) {
  const id = sectionId || title.toLowerCase().replace(/\s+/g, "-");

  return (
    <div id={id} className="relative min-h-screen w-full bg-[#010208] overflow-hidden flex flex-col font-sans select-none">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#010308] via-[#020610] to-[#051230]" />
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#071840]/25 blur-[180px]" />
        <div className="absolute top-[10%] left-[18%] w-[220px] h-[1.5px] bg-gradient-to-r from-transparent via-[#5eaee8]/80 to-transparent rotate-[135deg] opacity-70 blur-[0.5px]" />
        <div className="absolute top-[9.2%] left-[16.5%] w-[4px] h-[4px] rounded-full bg-white/80 blur-[1px]" />
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {[...Array(200)].map((_, i) => {
            const x = ((i * 31 + 7) % 100) + "%";
            const y = ((i * 47 + 11) % 100) + "%";
            const r = 0.3 + (i % 3) * 0.15;
            const opacity = 0.12 + ((i % 5) * 0.06);
            return <circle key={`dim-${i}`} cx={x} cy={y} r={r} fill="white" opacity={opacity} />;
          })}
          {[...Array(80)].map((_, i) => {
            const x = ((i * 43 + 19) % 100) + "%";
            const y = ((i * 61 + 23) % 100) + "%";
            const r = 0.5 + (i % 4) * 0.25;
            const opacity = 0.3 + ((i % 6) * 0.08);
            return <circle key={`mid-${i}`} cx={x} cy={y} r={r} fill="white" opacity={opacity} />;
          })}
          {[...Array(20)].map((_, i) => {
            const x = ((i * 67 + 31) % 100) + "%";
            const y = ((i * 83 + 13) % 100) + "%";
            const r = 1.2 + (i % 3) * 0.5;
            return <circle key={`bright-${i}`} cx={x} cy={y} r={r} fill="white" opacity={0.85} />;
          })}
        </svg>
        <div className="absolute bottom-0 inset-x-0 h-[38%] bg-gradient-to-t from-[#081e4a]/80 via-[#061640]/40 to-transparent" />
        <div className="absolute bottom-[1%] left-[-6%] w-[50%] h-[240px] rounded-full bg-[#0e2350]/40 blur-[90px]" />
        <div className="absolute bottom-[-1%] right-[-6%] w-[50%] h-[260px] rounded-full bg-[#122a58]/45 blur-[100px]" />
        <div className="absolute bottom-[-4%] left-[22%] w-[56%] h-[180px] rounded-full bg-[#152e60]/35 blur-[80px]" />
      </div>

      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start sm:justify-center px-3 sm:px-5 md:px-8 lg:px-10 pt-20 pb-10 sm:py-6 max-w-[1920px] mx-auto">
        <div className="w-full flex justify-center pb-0 pointer-events-none select-none">
          <h1
            className={`${titleSize} sm:text-[14vw] md:text-[12vw] lg:text-[10vw] xl:text-[9vw] font-black uppercase text-white leading-[1.1] sm:leading-[0.85] tracking-[0.04em] [-webkit-text-stroke:5px_white] drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]`}
            style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}
          >
            {title}
          </h1>
        </div>

        <div className="relative z-10 w-full flex flex-wrap items-start justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-5 -mt-2 sm:-mt-3 md:-mt-6 lg:-mt-10 py-2 scrollbar-none">
          {members.map((member, index) => (
            <div key={index} className="w-[42%] sm:w-[30%] md:w-[22%] lg:w-[18%] min-w-[140px] max-w-[300px]">
              <TeamCard
                name={member.name}
                image={member.image}
                linkedin={member.linkedin}
                github={member.github}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}