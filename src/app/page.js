import Image from 'next/image';
import HorizontalGallery from '@/pageComponents/HorizontalGallery';

export default function Home() {
  return (
    <main className="bg-[#080808]">
      {/* Landing / hero section — scrolling down from here triggers
          the pinned horizontal gallery below. */}
      <section className="relative h-screen w-full overflow-hidden">
        <Image
          src="/images/HorizontalGallery/landing.png"
          alt="TATHVA '26 landing"
          fill
          priority
          className="object-cover"
        />
        {/* Soft bottom gradient transition into horizontal gallery */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-48 bg-gradient-to-b from-transparent via-[#080808]/50 to-[#080808]" />
      </section>

      <HorizontalGallery />

      <section className="flex h-screen items-center justify-center bg-neutral-900 text-white">
        <p>Outro section — resumes vertical scroll</p>
      </section>
    </main>
  );
}