"use client";

import React from "react";
import { creditsData } from "@/data/creditsData";
import Lanyard from "./Lanyard"; // Make sure this path is correct

/**
- PersonImage Component
 */
function PersonImage({ src, alt = "Team Member" }) {
  return (
    <div className="relative aspect-square w-full h-full bg-white flex items-center justify-center overflow-hidden select-none">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-[#d0d0d0] rounded-full overflow-hidden flex items-center justify-center">
          <svg className="w-full h-full text-[#9c9c9c]" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="36" r="21" />
            <path d="M10 96 c0 -22 18 -40 40 -40 c22 0 40 18 40 40 Z" />
          </svg>
        </div>
      )}
    </div>
  );
}

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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

/**
- Sunburst Torn Member Card (Updated with 3D Support)
 */
function MemberCard({ 
  name = "NAME SURNAME", 
  image = null, 
  backImage = null,
  message = "", 
  linkedin = "https://linkedin.com", 
  github = "https://github.com", 
  use3D = false 
}) {
  return (
    <div className="relative group w-full aspect-[276/499] max-h-[76vh] flex items-center justify-center transition-transform duration-300 hover:-translate-y-2 select-none">
      
      {use3D ? (
        <div className="absolute inset-[-40%] z-10 pointer-events-auto cursor-grab active:cursor-grabbing">
          <Lanyard 
            frameImage="/images/lead-card.png"  
            backFrameImage={backImage}
            avatarImage={image}                 
            name={name}                         
            message={message}                   
            orientation="portrait"
            finish="glossy"
          />
        </div>
      ) : (
        /* --- 2D STATIC CARD --- */
        <>
          <img src="/images/lead-card.png" alt={name} className="w-full h-full object-contain pointer-events-none" />
          <div className="absolute top-[23%] left-[15%] w-[70%] h-[38%] z-10 overflow-hidden bg-white flex items-center justify-center">
            <PersonImage src={image} alt={name} />
          </div>
          {/* Static Name */}
          <div className="absolute top-[66.1%] inset-x-0 z-20 flex justify-center px-4 pointer-events-none">
            <span className="text-white font-extrabold text-[12px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] tracking-[1.5px] uppercase text-center leading-tight drop-shadow-[0_4px_6px_rgba(0,0,0,0.95)]">
              {name}
            </span>
          </div>
        </>
      )}

      {/* Social Links (Always hoverable on top) */}
      <div className={`absolute ${use3D ? 'bottom-[2%]' : 'top-[73.1%]'} inset-x-0 z-30 flex items-center justify-center gap-3 sm:gap-4 pointer-events-auto`}>
        <a href={linkedin} target="_blank" rel="noopener noreferrer" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center rounded text-white hover:text-[#0077b5] transition-all duration-200 transform hover:scale-125">
          <LinkedInIcon className="w-full h-full" />
        </a>
        <a href={github} target="_blank" rel="noopener noreferrer" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full text-white hover:text-[#e6edf3] transition-all duration-200 transform hover:scale-125">
          <GitHubIcon className="w-full h-full" />
        </a>
      </div>
    </div>
  );
}

/**
- Single Team Section
 */
function Section({ title, members, titleClass = "", use3D = false }) {
  return (
    <div className="relative min-h-screen w-full bg-[#010208] overflow-hidden flex flex-col font-sans select-none">
      {/* Space Background Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-[#010308] via-[#020610] to-[#051230]" />
         {/* Stars SVG */}
         <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {[...Array(100)].map((_, i) => (
            <circle key={`dim-${i}`} cx={`${((i * 31 + 7) % 100)}%`} cy={`${((i * 47 + 11) % 100)}%`} r={0.3} fill="white" opacity={0.3} />
          ))}
        </svg>
      </div>

      {/* Main Section Header + Cards */}
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start sm:justify-center px-3 sm:px-5 md:px-8 lg:px-10 pt-20 pb-10 sm:py-6 max-w-[1920px] mx-auto">
        <div className="w-full flex justify-center pb-0 pointer-events-none select-none">
          <h1
            className={`font-black uppercase text-white leading-[1.1] sm:leading-[0.85] tracking-[0.04em] drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] ${
              titleClass || "text-[18vw] sm:text-[14vw] md:text-[12vw] lg:text-[10vw] xl:text-[9vw] [-webkit-text-stroke:5px_white]"
            }`}
            style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}
          >
            {title}
          </h1>
        </div>

        <div className="relative z-10 w-full flex flex-wrap items-start justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-5 -mt-2 sm:-mt-3 md:-mt-6 lg:-mt-10 py-2 scrollbar-none">
          {members.map((member, index) => (
            <div key={index} className="w-[42%] sm:w-[30%] md:w-[22%] lg:w-[18%] min-w-[140px] max-w-[300px]">
              <MemberCard
                name={member.name}
                image={member.image}
                backImage={member.backImage}
                message={member.message} 
                linkedin={member.linkedin}
                github={member.github}
                use3D={use3D} 
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/**
- Main Page Component
 */
export default function Ilovemygf() {
  return (
    <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden">
      {/* All sections now use the 3D Lanyard */}
      <Section title="LEAD" members={creditsData.leads} use3D={true} />
      
      <Section
        title="FRONTEND"
        members={creditsData.frontend}
        use3D={true} 
        titleClass="text-[13vw] sm:text-[14vw] md:text-[12vw] lg:text-[10vw] xl:text-[9vw] [-webkit-text-stroke:3px_white] sm:[-webkit-text-stroke:5px_white] tracking-[0.02em] sm:tracking-[0.04em]"
      />
      
      <Section
        title="BACKEND"
        members={creditsData.backend}
        use3D={true}
        titleClass="text-[13vw] sm:text-[14vw] md:text-[12vw] lg:text-[10vw] xl:text-[9vw] [-webkit-text-stroke:3px_white] sm:[-webkit-text-stroke:5px_white] tracking-[0.02em] sm:tracking-[0.04em]"
      />
      
      <Section title="UI/UX" members={creditsData.uiux} use3D={true} />
    </div>
  );
}