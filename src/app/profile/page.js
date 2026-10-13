'use client';

import Link from 'next/link';
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu';
import Navbar from '@/pageComponents/Navbar/Navbar';

const DUMMY = {
  name: 'Tathva Attendee',
  college: 'NIT Calicut',
  branch: 'Computer Science',
  year: '3',
  semester: '5',
  state: 'Kerala',
  registrations: [
    { id: 1, title: 'Hackathon', category: 'Competition', date: 'Oct 10–11, 2026' },
    { id: 2, title: 'Web Dev Workshop', category: 'Workshop', date: 'Oct 9, 2026' },
    { id: 3, title: 'TechTalks: AI & Beyond', category: 'Lecture', date: 'Oct 10, 2026' },
  ],
};

function Avatar() {
  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/20 bg-[#0d1f45] flex items-center justify-center shrink-0">
      <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-white/30">
        <circle cx="50" cy="36" r="22" />
        <path d="M10 98 c0-23 18-42 40-42 22 0 40 19 40 42Z" />
      </svg>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-xl px-5 py-3 gap-0.5">
      <span className="text-white font-bold text-lg leading-none">{value}</span>
      <span className="text-white/40 text-[11px] uppercase tracking-widest">{label}</span>
    </div>
  );
}

function RegistrationCard({ title, category, date }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-4 hover:bg-white/8 transition-colors">
      <div className="flex flex-col gap-0.5">
        <span className="text-white font-semibold text-sm">{title}</span>
        <span className="text-white/40 text-xs">{date}</span>
      </div>
      <span className="text-[11px] uppercase tracking-widest text-white/50 border border-white/10 rounded-full px-3 py-1 shrink-0">
        {category}
      </span>
    </div>
  );
}

export default function DummyProfilePage() {
  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #010208 0%, #020610 55%, #051230 100%)' }}
    >
      {/* Starfield */}
      <svg className="pointer-events-none absolute inset-0 w-full h-full" aria-hidden="true">
        {[...Array(160)].map((_, i) => (
          <circle
            key={i}
            cx={`${(i * 37 + 7) % 100}%`}
            cy={`${(i * 53 + 11) % 100}%`}
            r={0.3 + (i % 3) * 0.15}
            fill="white"
            opacity={0.1 + (i % 5) * 0.05}
          />
        ))}
      </svg>

      {/* Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#071840]/35 blur-[160px]" />

      <Navbar />
      <TathvaMenu />

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-20 flex flex-col gap-8">

        {/* Profile card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar />
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h1 className="text-white font-bold text-xl">{DUMMY.name}</h1>
            <p className="text-white/50 text-sm">{DUMMY.college}</p>
            <p className="text-white/40 text-xs mt-0.5">
              {DUMMY.branch} · Year {DUMMY.year} · Sem {DUMMY.semester} · {DUMMY.state}
            </p>
            {/* "Edit profile" placeholder */}
            <button
              disabled
              className="mt-3 self-center sm:self-start text-[11px] uppercase tracking-widest border border-white/10 text-white/30 rounded-full px-4 py-1.5 cursor-not-allowed"
              title="Profile editing is closed for Tathva '26"
            >
              Edit Profile (Closed)
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatPill label="Registered" value={DUMMY.registrations.length} />
          <StatPill label="Attended" value={DUMMY.registrations.length} />
          <StatPill label="Edition" value="T'26" />
        </div>

        {/* Registrations */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white/40 text-xs uppercase tracking-widest px-1">My Registrations</h2>
          {DUMMY.registrations.map(r => (
            <RegistrationCard key={r.id} {...r} />
          ))}
        </section>

        {/* Event-over banner */}
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 flex flex-col items-center text-center gap-3">
          <span className="text-2xl">🎉</span>
          <p className="text-white/70 text-sm leading-relaxed">
            <span className="text-white font-semibold">Tathva &rsquo;26 has concluded.</span>
            <br />
            Thank you for being part of it — see you at Tathva &rsquo;27!
          </p>
          <Link
            href="/"
            className="mt-1 text-[11px] uppercase tracking-widest border border-white/15 text-white/50 rounded-full px-5 py-1.5 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            ← Back to Home
          </Link>
        </div>

      </main>
    </div>
  );
}
