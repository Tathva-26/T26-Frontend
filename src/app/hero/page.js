import HeroFrameController from "@/pageComponents/Hero/HeroFrameController";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/pageComponents/Navbar/Navbar";

export default function HeroPage() {
  return (
    <div className="main-scroll relative h-dvh w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-black">
      <SmoothScroll />
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <HeroFrameController />
    </div>
  );
}