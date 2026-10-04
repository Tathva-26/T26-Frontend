"use client";

import React from "react";

export function PersonImage({ src, alt = "Team Member", className = "" }) {
  return (
    <div
      className={`relative aspect-square w-full h-full bg-white flex items-center justify-center overflow-hidden select-none ${className}`}
    >
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function TeamCard({
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
      <img
        src="/images/lead-card.png"
        alt={name}
        className="w-full h-full object-contain pointer-events-none"
      />

      {image && (
        <div className="absolute top-[22.8%] left-[15.6%] w-[68.8%] h-[38.2%] z-10 overflow-hidden bg-white flex items-center justify-center">
          <PersonImage src={image} alt={name} />
        </div>
      )}

      {name && name !== "NAME SURNAME" && (
        <div className="absolute top-[66.1%] inset-x-0 z-20 flex justify-center px-4">
          <span className="text-white font-extrabold text-[12px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] tracking-[1.5px] uppercase text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
            {name}
          </span>
        </div>
      )}

      <div className="absolute top-[73.1%] inset-x-0 z-30 flex items-center justify-center gap-3 sm:gap-4 pointer-events-auto">
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name}'s LinkedIn Profile`}
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center rounded text-white hover:text-[#0077b5] transition-all duration-200 transform hover:scale-125 focus:outline-none"
        >
          <LinkedInIcon />
          <span className="sr-only">LinkedIn</span>
        </a>
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name}'s GitHub Profile`}
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full text-white hover:text-[#e6edf3] transition-all duration-200 transform hover:scale-125 focus:outline-none"
        >
          <GitHubIcon />
          <span className="sr-only">GitHub</span>
        </a>
      </div>
    </div>
  );
}

const defaultMembers = [
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
];

export { defaultMembers };