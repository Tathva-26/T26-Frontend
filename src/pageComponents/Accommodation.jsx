const HOSTELS = [
  { id: 1, name: "Mega Hostel Boys II", location: "West Campus, NIT Calicut", image: "/images/accommodation/sample.svg" },
  { id: 2, name: "Mega Hostel Boys II", location: "West Campus, NIT Calicut", image: "/images/accommodation/sample.svg" },
  { id: 3, name: "Mega Hostel Boys II", location: "West Campus, NIT Calicut", image: "/images/accommodation/sample.svg" },
];

function PinIcon() {
  return (
    <svg className="size-[1.1vw] max-[900px]:size-[13px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="size-[0.85vw] max-[900px]:size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function HostelCard({ name, location, image }) {
  return (
    <article className="relative aspect-[215/306] overflow-hidden rounded-[2.6vw] border-[0.28vw] border-white bg-[#222] max-[900px]:rounded-[20px] max-[900px]:border-2 max-[900px]:last:odd:col-span-full max-[900px]:last:odd:w-[calc(50%-8px)] max-[900px]:last:odd:justify-self-center">
      <img className="absolute inset-0 size-full object-cover" src={image} alt={name} />
      <button type="button" className="absolute top-[1.2vw] right-[1.2vw] flex items-center gap-[0.5vw] rounded-full bg-[#3d2440] px-[1vw] py-[0.6vw] font-[family-name:var(--font-space)] text-[0.75vw] font-semibold text-white max-[900px]:top-2 max-[900px]:right-2 max-[900px]:gap-1 max-[900px]:px-[9px] max-[900px]:py-[5px] max-[900px]:text-[11px]">
        <PinIcon />
        Locate
      </button>
      <div className="absolute right-[1.3vw] bottom-[1.3vw] left-[1.3vw] flex items-end justify-between rounded-[1.6vw] bg-[rgba(225,225,232,0.55)] px-[0.9vw] py-[1vw] backdrop-blur-[10px] max-[900px]:right-2 max-[900px]:bottom-2 max-[900px]:left-2 max-[900px]:flex-col max-[900px]:items-start max-[900px]:gap-2 max-[900px]:rounded-[14px] max-[900px]:px-2.5 max-[900px]:py-2">
        <div>
          <h2 className="font-[family-name:var(--font-jockey)] text-[1.55vw] leading-none tracking-[0.02em] text-[#14142b] [-webkit-text-stroke:0.03vw_#14142b] max-[900px]:text-[16px]">{name}</h2>
          <p className="mt-[0.4vw] font-[family-name:var(--font-space)] text-[0.7vw] text-[#444] max-[900px]:mt-[3px] max-[900px]:text-[10px]">{location}</p>
        </div>
        <button type="button" className="flex items-center gap-[0.4vw] rounded-full bg-[#8a8cf5] px-[1.1vw] py-[0.75vw] font-[family-name:var(--font-space)] text-[0.7vw] font-semibold text-white max-[900px]:gap-1 max-[900px]:px-3 max-[900px]:py-1.5 max-[900px]:text-[11px]">
          <SearchIcon />
          Explore
        </button>
      </div>
    </article>
  );
}

export default function Accommodation() {
  return (
    <main className="relative grid h-screen w-full grid-cols-[17.1%_1fr] overflow-hidden text-white [background:radial-gradient(1px_1px_at_12%_20%,#fff8,transparent),radial-gradient(1px_1px_at_35%_8%,#fff6,transparent),radial-gradient(1px_1px_at_62%_14%,#fff8,transparent),radial-gradient(1px_1px_at_88%_30%,#fff6,transparent),radial-gradient(1px_1px_at_20%_78%,#fff5,transparent),radial-gradient(1px_1px_at_75%_85%,#fff6,transparent),radial-gradient(ellipse_at_100%_100%,#14285a_0%,transparent_35%),radial-gradient(ellipse_at_0%_100%,#101f48_0%,transparent_30%),#000] max-[900px]:h-full max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:grid-rows-[auto_1fr] max-[900px]:overflow-y-auto max-[900px]:px-5 max-[900px]:pt-6 max-[900px]:pb-10">
      {/* Navbar slot: render <Navbar /> here (absolutely positioned) when it is ready */}
      <h1 className="mt-[6vh] justify-self-center rotate-180 [writing-mode:vertical-rl] font-[family-name:var(--font-bebas)] text-[7.7vw] leading-none tracking-[0.02em] [-webkit-text-stroke:0.04em_#fff] self-center max-[900px]:mt-14 max-[900px]:rotate-0 max-[900px]:[writing-mode:horizontal-tb] max-[900px]:text-center max-[900px]:text-[clamp(2rem,10.5vw,5rem)]">ACCOMMODATION</h1>
      <section className="grid grid-cols-[repeat(3,23.4vw)] justify-start gap-x-[4.2vw] self-center pr-[2vw] max-[900px]:mt-6 max-[900px]:w-full max-[900px]:max-w-[640px] max-[900px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[900px]:justify-stretch max-[900px]:gap-4 max-[900px]:self-start max-[900px]:justify-self-center max-[900px]:pr-0">
        {HOSTELS.map((h) => (
          <HostelCard key={h.id} {...h} />
        ))}
      </section>
    </main>
  );
}
