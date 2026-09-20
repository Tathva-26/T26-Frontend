import { RobowarsHero } from "@/pageComponents/Robowars";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      {/* Intro spacer to allow scroll triggering */}
      <section className="h-[40vh] flex items-center justify-center text-zinc-500 text-sm tracking-widest uppercase">
        Scroll down to experience Robowars
      </section>

      {/* Robowars Section */}
      <RobowarsHero />

      {/* Outro section */}
      <section className="h-[40vh] flex items-center justify-center text-zinc-600 text-sm">
        Tathva &apos;26 &bull; Robowars Arena
      </section>
    </main>
  );
}
