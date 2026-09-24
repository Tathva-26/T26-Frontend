import Navbar from "@/components/Navbar/Navbar";
import GpcHero from "@/pageComponents/GPC/GpcHero";

export const metadata = {
  title: "GPC - Tathva '26",
  description: "Show off your skills and conquer the arena.",
};

export default function GpcPage() {
  return (
    <main className="bg-[#101010]">
      <Navbar />
      <GpcHero />
    </main>
  );
}
