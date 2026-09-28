"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import Crystal3D from "./Crystal3D";
import styles from "./Expo.module.css";

export default function Expo() {
  const [menuOpen, setMenuOpen] = useState(false);
  const details = useRef(null);

  return (
    <main className={styles.page}>
      <section className={styles.stage} aria-labelledby="expo-title">
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Tathva home">
            <Image src="/images/expo/tathva-mark.svg" width={55} height={46} alt="" unoptimized />
          </Link>
          <Image className={styles.badge} src="/images/menu/tathva.png" width={100} height={28} alt="Tathva 2026" />
          <button className={styles.menuButton} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="expo-navigation" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
          <nav id="expo-navigation" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`} aria-label="Tathva navigation">
            <a href="/proshow">Proshow</a><i>/</i><a href="/workshops">Workshops</a><i>/</i><a href="/campus-ambassador">Campus ambassador</a><i>/</i><a href="/gallery">Gallery</a>
          </nav>
        </header>

        <h1 id="expo-title" className={styles.title}>
          <span className={styles.desktopTitle}>EXPO</span>
          <svg className={styles.mobileTitle} viewBox="0 0 360 76" role="img" aria-label="EXPO">
            <g fill="currentColor" transform="translate(18 4) skewX(-12)">
              <path d="M43 9H105L93 22H55L48 30H84L72 43H36L29 51H69L57 65H0Z" />
              <path d="M114 9H134L144 27L174 9H196L158 36L174 65H153L140 44L108 65H85L127 35Z" />
              <path fillRule="evenodd" d="M204 9H259L275 24L248 45H213L193 65H174ZM215 22L203 34H235L250 22Z" />
              <path fillRule="evenodd" d="M286 9H330L349 27L310 65H265L247 48ZM289 23L268 46L275 51H305L326 29L319 23Z" />
            </g>
          </svg>
        </h1>

        <p className={styles.intro}>Tathva’26 Expo is all about technology,<br />the trending, the innovations, the age-old,<br />and many more.</p>
        <svg className={styles.desktopLines} viewBox="0 0 1440 710" preserveAspectRatio="none" aria-hidden="true">
          <path d="M408 204H523L666 338 M935 335L1044 397L951 453 M715 542L666 622H574" />
        </svg>
        <svg className={styles.mobileLines} viewBox="0 0 390 870" preserveAspectRatio="none" aria-hidden="true">
          <path d="M131 337L154 275L208 306 M157 565L79 650 M205 564L247 627H271" />
        </svg>
        <div className={styles.crystalSlot}><Crystal3D /></div>
        <p className={styles.description}>National Institute of<br />Technology, Calicut.<br />presents Tathva Expo-<br />Asia’s largest student-<br />run Tech Startup Expo.</p>
        <button className={styles.explore} onClick={() => details.current?.showModal()} aria-haspopup="dialog"><span>EXPLORE</span></button>

        <dialog ref={details} className={styles.details} onClick={(event) => { if (event.target === event.currentTarget) details.current.close(); }}>
          <form method="dialog"><button aria-label="Close Expo details" className={styles.close}>×</button></form>
          <p className={styles.eyebrow}>TATHVA ’26 / NIT CALICUT</p>
          <h2>Ideas take shape.</h2>
          <p>Explore technology, meet the innovators, and discover what comes next at Tathva Expo.</p>
          <p className={styles.detailsNote}>Exhibitor and programme details will be announced here.</p>
        </dialog>
      </section>
    </main>
  );
}
