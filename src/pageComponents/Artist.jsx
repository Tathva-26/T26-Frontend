"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const assetPathPrefix = "/images/artist";

const artists = [
  {
    name: "Arijit Singh",
    background: `${assetPathPrefix}/21bbf.png`,
    portrait: `${assetPathPrefix}/af3e8.png`,
    portraitClassName: "artist-portrait artist-portrait--arijit",
    cardPortrait: `${assetPathPrefix}/50195.png`,
    cardSecondary: `${assetPathPrefix}/8577e.png`,
    avatar: `${assetPathPrefix}/475ef.png`,
  },
  {
    name: "Shreya ghoshal",
    background: `${assetPathPrefix}/bef85.png`,
    portrait: `${assetPathPrefix}/ec2ea.png`,
    portraitClassName: "artist-portrait artist-portrait--shreya",
    cardPortrait: `${assetPathPrefix}/1fbda.png`,
    cardSecondary: `${assetPathPrefix}/3a288.png`,
    avatar: `${assetPathPrefix}/09bd3.png`,
  },
];

function FestivalMark() {
  return (
    <div className="festival-mark" aria-label="Tathva 2026">
      <span>TATHVA 2026</span>
      <small>NIT CALICUT</small>
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <img
        className="site-logo"
        src={`${assetPathPrefix}/32c3b.png`}
        alt="Tathva"
      />
      <button className="menu-button" type="button" aria-label="Open menu">
        <img src={`${assetPathPrefix}/4e2c4.svg`} alt="" />
      </button>
      <nav aria-label="Main navigation">
        <a href="#proshow">PROSHOW</a>
        <i>/</i>
        <a href="#workshops">WORKSHOPS</a>
        <i>/</i>
        <a href="#campus">CAMPUS AMBASADOR</a>
        <i>/</i>
        <a href="#gallery">GALLERY</a>
      </nav>
      <FestivalMark />
    </header>
  );
}

function ScheduleCard() {
  return (
    <div className="schedule-card">
      <div className="schedule-days">
        <button type="button">DAY 1</button>
        <button className="is-active" type="button">
          DAY 2
        </button>
        <button type="button">DAY 3</button>
      </div>
      <p>
        Brace yourselves for a magical night as the legendary Shreya Ghoshal
        takes the stage alongside an electrifying Artist 3. Get ready to sing,
        sway, and make memories!
      </p>
    </div>
  );
}

function ArtistCard({ artist, index }) {
  return (
    <article className="artist-card" aria-labelledby={`artist-${index}`}>
      <div className="artist-board">
        <img
          className="artist-board__texture"
          src={`${assetPathPrefix}/88fac.png`}
          alt=""
        />
        <img
          className="connector connector--bottom"
          src={
            index === 0
              ? `${assetPathPrefix}/cb9f3.svg`
              : `${assetPathPrefix}/061e4.svg`
          }
          alt=""
        />
        <img className="artist-board__avatar" src={artist.avatar} alt="" />
        <img
          className="artist-board__primary"
          src={artist.cardPortrait}
          alt={`${artist.name} performing`}
        />
        <img
          className="artist-board__secondary"
          src={artist.cardSecondary}
          alt={`${artist.name} on stage`}
        />
        <h2 id={`artist-${index}`}>{artist.name}</h2>
        <div className="artist-board__dot" />
        <div className="artist-board__placeholder artist-board__placeholder--one" />
        <div className="artist-board__placeholder artist-board__placeholder--two" />
      </div>
    </article>
  );
}

export default function Artist() {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const context = gsap.context(() => {
      const backgrounds = gsap.utils.toArray(".featured-bg-layer");
      const portraits = gsap.utils.toArray(".featured-portrait-layer");

      // Hide all except the first
      gsap.set(backgrounds.slice(1), { autoAlpha: 0 });
      gsap.set(portraits.slice(1), { yPercent: 100, autoAlpha: 0 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      portraits.slice(1).forEach((incoming, index) => {
        timeline
          // Cross-fade backgrounds (no sliding)
          .to(backgrounds[index], { autoAlpha: 0, ease: "none" })
          .to(backgrounds[index + 1], { autoAlpha: 1, ease: "none" }, "<")
          // Slide only the portraits
          .to(portraits[index], { yPercent: -15, autoAlpha: 0, ease: "none" }, "<")
          .to(incoming, { yPercent: 0, autoAlpha: 1, ease: "none" }, "<");
      });
    }, section);

    return () => context.revert();
  }, []);

  return (
    <main ref={sectionRef} className="proshow-section" id="proshow">
      <section className="featured-column" aria-label="Featured artist">
        <div className="featured-viewport">
          {/* Backgrounds - separate layer, no sliding */}
          {artists.map((artist) => (
            <div className="featured-bg-layer" key={`bg-${artist.name}`}>
              <img
                className="featured-background"
                src={artist.background}
                alt=""
              />
            </div>
          ))}
          {/* Portraits - separate layer, these slide */}
          {artists.map((artist) => (
            <div className="featured-portrait-layer" key={`portrait-${artist.name}`}>
              <img
                className={artist.portraitClassName}
                src={artist.portrait}
                alt={`${artist.name} featured artist`}
              />
            </div>
          ))}
          <Header />
          <ScheduleCard />
        </div>
      </section>

      <section className="artist-list" aria-label="Proshow artists">
        {artists.map((artist, artistIdx) => {
          // Each artist gets duplicated cards for seamless loop
          const dupes = [artist, artist, artist, artist, artist, artist];
          return (
            <div className="artist-page" key={artist.name}>
              <div className="marquee-track">
                {dupes.map((a, i) => (
                  <ArtistCard artist={a} index={artistIdx} key={`${a.name}-${i}`} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
