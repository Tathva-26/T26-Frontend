import { LOGO_SRC, NAV_LINKS } from "./navConfig";

/** Fixed header. `data-nav` lets the hero timeline slide it in on scroll. */
export default function Navbar() {
  return (
    <header
      data-nav
      className="fixed inset-x-0 top-0 z-50 flex items-center px-6 pt-6 text-white md:px-12"
    >
      <img src={LOGO_SRC} alt="Tathva" className="h-[46px] w-[55px] object-cover" />

      <nav aria-label="Main" className="ml-16 hidden gap-9 font-hammersmith text-xs md:flex">
        {NAV_LINKS.map(({ label, href }) => (
          <a key={label} href={href} className="hover:text-[#4fb4e3] focus-visible:underline">
            {label}
          </a>
        ))}
      </nav>

      <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-lg border border-white/30 bg-black/60 px-4 py-1 font-bebas text-xs tracking-wide">
        TATHVA 2026
      </span>
    </header>
  );
}
