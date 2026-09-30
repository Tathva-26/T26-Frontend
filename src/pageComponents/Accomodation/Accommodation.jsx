const accommodationStyles = `
.accommodation-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(1px 1px at 12% 20%, #fff8, transparent),
    radial-gradient(1px 1px at 35% 8%, #fff6, transparent),
    radial-gradient(1px 1px at 62% 14%, #fff8, transparent),
    radial-gradient(1px 1px at 88% 30%, #fff6, transparent),
    radial-gradient(1px 1px at 20% 78%, #fff5, transparent),
    radial-gradient(1px 1px at 75% 85%, #fff6, transparent),
    radial-gradient(ellipse at 100% 100%, #14285a 0%, transparent 35%),
    radial-gradient(ellipse at 0% 100%, #101f48 0%, transparent 30%),
    #000;
  display: grid;
  grid-template-columns: 17.1% 1fr;
  color: #fff;
}

.accommodation-page .heading {
  align-self: center;
  justify-self: center;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: var(--font-bebas);
  font-size: 7.7vw;
  line-height: 1;
  margin-top: 6vh;
  letter-spacing: 0.02em;
  -webkit-text-stroke: 0.04em #fff;
}

.accommodation-page .cards {
  align-self: center;
  display: grid;
  grid-template-columns: repeat(3, 23.4vw);
  column-gap: 4.2vw;
  padding-right: 2vw;
  justify-content: start;
}

.accommodation-page .card {
  position: relative;
  aspect-ratio: 215 / 306;
  border: 0.28vw solid #fff;
  border-radius: 2.6vw;
  overflow: hidden;
  background: #222;
}

.accommodation-page .cardImage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.accommodation-page .locate {
  position: absolute;
  top: 1.2vw;
  right: 1.2vw;
  display: flex;
  align-items: center;
  gap: 0.5vw;
  padding: 0.6vw 1vw;
  border-radius: 999px;
  background: #3d2440;
  color: #fff;
  font-family: var(--font-space);
  font-size: 0.75vw;
  font-weight: 600;
}

.accommodation-page .locate svg {
  width: 1.1vw;
  height: 1.1vw;
}

.accommodation-page .info {
  position: absolute;
  left: 1.3vw;
  right: 1.3vw;
  bottom: 1.3vw;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1vw 0.9vw;
  border-radius: 1.6vw;
  background: rgba(225, 225, 232, 0.55);
  backdrop-filter: blur(10px);
}

.accommodation-page .name {
  font-family: var(--font-jockey);
  font-size: 1.55vw;
  line-height: 1;
  color: #14142b;
  letter-spacing: 0.02em;
  -webkit-text-stroke: 0.03vw #14142b;
}

.accommodation-page .location {
  margin-top: 0.4vw;
  font-family: var(--font-space);
  font-size: 0.7vw;
  color: #444;
}

.accommodation-page .explore {
  display: flex;
  align-items: center;
  gap: 0.4vw;
  padding: 0.75vw 1.1vw;
  border-radius: 999px;
  background: #8a8cf5;
  color: #fff;
  font-family: var(--font-space);
  font-size: 0.7vw;
  font-weight: 600;
}

.accommodation-page .explore svg {
  width: 0.85vw;
  height: 0.85vw;
}

@media (max-width: 900px) {
  .accommodation-page {
    height: 100%;
    overflow-y: auto;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    padding: 24px 20px 40px;
  }

  .accommodation-page .heading {
    writing-mode: horizontal-tb;
    transform: none;
    margin-top: 56px;
    font-size: clamp(2rem, 10.5vw, 5rem);
    text-align: center;
  }

  .accommodation-page .cards {
    align-self: start;
    margin-top: 24px;
    padding-right: 0;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    justify-content: stretch;
    max-width: 640px;
    justify-self: center;
    width: 100%;
  }

  .accommodation-page .cards > .card:nth-child(3):last-child {
    grid-column: 1 / -1;
    justify-self: center;
    width: calc(50% - 8px);
  }

  .accommodation-page .card {
    border-width: 2px;
    border-radius: 20px;
  }

  .accommodation-page .locate {
    top: 8px;
    right: 8px;
    gap: 4px;
    padding: 5px 9px;
    font-size: 11px;
  }

  .accommodation-page .locate svg {
    width: 13px;
    height: 13px;
  }

  .accommodation-page .info {
    left: 8px;
    right: 8px;
    bottom: 8px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 14px;
  }

  .accommodation-page .name {
    font-size: 16px;
  }

  .accommodation-page .location {
    margin-top: 3px;
    font-size: 10px;
  }

  .accommodation-page .explore {
    gap: 4px;
    padding: 6px 12px;
    font-size: 11px;
  }

  .accommodation-page .explore svg {
    width: 12px;
    height: 12px;
  }
}
`;

const HOSTELS = [
  { id: 1, name: "Mega Hostel Boys II", location: "West Campus, NIT Calicut", image: "/images/accommodation/sample.svg" },
  { id: 2, name: "Mega Hostel Boys II", location: "West Campus, NIT Calicut", image: "/images/accommodation/sample.svg" },
  { id: 3, name: "Mega Hostel Boys II", location: "West Campus, NIT Calicut", image: "/images/accommodation/sample.svg" },
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
    <article className="card">
      <img className="cardImage" src={image} alt={name} />
      <button type="button" className="locate">
        <PinIcon />
        Locate
      </button>
      <div className="info">
        <div>
          <h2 className="name">{name}</h2>
          <p className="location">{location}</p>
        </div>
        <button type="button" className="explore">
          <SearchIcon />
          Explore
        </button>
      </div>
    </article>
  );
}

export default function Accommodation() {
  return (
    <main className="accommodation-page">
      <style>{accommodationStyles}</style>
      {/* Navbar slot: render <Navbar /> here (absolutely positioned) when it is ready */}
      <h1 className="heading">ACCOMMODATION</h1>
      <section className="cards">
        {HOSTELS.map((h) => (
          <HostelCard key={h.id} {...h} />
        ))}
      </section>
    </main>
  );
}
