import styles from "./Accomodation.module.css";

const HOSTELS = [
  { id: 1, name: "Mega Hostel Boys II", location: "West Campus, NIT Calicut", image: "/images/accomodation/sample.svg" },
  { id: 2, name: "Mega Hostel Boys II", location: "West Campus, NIT Calicut", image: "/images/accomodation/sample.svg" },
  { id: 3, name: "Mega Hostel Boys II", location: "West Campus, NIT Calicut", image: "/images/accomodation/sample.svg" },
];

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function HostelCard({ name, location, image }) {
  return (
    <article className={styles.card}>
      <img className={styles.cardImage} src={image} alt={name} />
      <button type="button" className={styles.locate}>
        <PinIcon />
        Locate
      </button>
      <div className={styles.info}>
        <div>
          <h2 className={styles.name}>{name}</h2>
          <p className={styles.location}>{location}</p>
        </div>
        <button type="button" className={styles.explore}>
          <SearchIcon />
          Explore
        </button>
      </div>
    </article>
  );
}

export default function Accomodation() {
  return (
    <main className={styles.page}>
      {/* Navbar slot: render <Navbar /> here (absolutely positioned) when it is ready */}
      <h1 className={styles.heading}>ACCOMODATION</h1>
      <section className={styles.cards}>
        {HOSTELS.map((h) => (
          <HostelCard key={h.id} {...h} />
        ))}
      </section>
    </main>
  );
}
