import { Hero } from "@/pageComponents/Hero";
// Removed curly braces because TathvaMenu is an export default
import TathvaMenu from "@/components/TathvaMenu/TathvaMenu";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full">
      <TathvaMenu />
      <Hero />
    </main>
  );
}