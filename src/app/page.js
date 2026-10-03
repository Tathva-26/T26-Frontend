import Preloader from '@/pageComponents/Loading/Loading'
import HeroFrameController from '@/pageComponents/Hero/HeroFrameController'
import HorizontalGallery from '@/pageComponents/HorizontalGallery/HorizontalGallery'
import WheelsExperience from '@/pageComponents/wheels/WheelsExperience'
import Expo from '@/pageComponents/Expo/Expo'
import Footer from '@/pageComponents/Footer/Footer'
import RobowarsPage from './robowars/page'
import SmoothScroll from '@/components/SmoothScroll'
import TathvaPasses from '@/pageComponents/TathvaPasses/TathvaPasses'
import ArtistPage from './artist/page'
import TechConclave from '@/pageComponents/TechConclave/TechConclave'
import Navbar from '@/pageComponents/Navbar/Navbar'
import GPC from './gpc/page'

export default function Home() {
  // Touch screens: the scroller is 1px short of the screen on purpose. Chrome on Android treats a
  // scroller that exactly fills the screen as the page itself and slides its address bar away as
  // it scrolls; every time the bar moves the screen changes height, everything sized in dvh
  // re-lays-out, and the sections below jump by a few hundred px mid-scroll. One px short, the
  // bar stays put and the layout stays still.
  return (
    <div className='main-scroll relative h-dvh [@media(pointer:coarse)]:h-[calc(100dvh-1px)] w-full overflow-x-hidden overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-black'>
      <Preloader />
      <SmoothScroll />
      <Navbar />
      <HeroFrameController>
        <ArtistPage />
        <GPC />
        <WheelsExperience revealUnderlay />
        <RobowarsPage />
        <TechConclave />
        <Expo />
        <HorizontalGallery />
        <Footer />
      </HeroFrameController>
    </div>
  )
}
