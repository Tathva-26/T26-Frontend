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
import Accommodation from '@/pageComponents/Accomodation/Accommodation'

export default function Home() {
  return (
    <div className='main-scroll relative h-dvh [@media(pointer:coarse)]:h-[calc(100dvh-1px)] w-full overflow-x-hidden overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-black'>
      <Preloader />
      <SmoothScroll />
      <Navbar />
      <HeroFrameController>
        {/* Top/Hero fallback anchor */}
        <div data-section-name="TATHVA-26" className="w-full" />

        {/* <ProfilePage /> */}
        {/* <ProshowCarousel /> */}

        <div data-section-name="ARTISTS" className="w-full">
          <ArtistPage />
        </div>

        <div data-section-name="GPC" className="w-full">
          <GPC />
        </div>

        <div data-section-name="WHEELS" className="w-full">
          <WheelsExperience revealUnderlay />
        </div>

        <div data-section-name="ROBOWARS" className="w-full">
          <RobowarsPage />
        </div>

        {/* <Lead />
        <Frontend />
        <Backend />
        <Uiux /> */}

        <div data-section-name="ACCOMMODATION" className="w-full">
          <Accommodation />
        </div>

        <div data-section-name="PASSES" className="w-full">
          <TathvaPasses />
        </div>

        <div data-section-name="TECH CONCLAVE" className="w-full">
          <TechConclave />
        </div>

        <div data-section-name="EXPO" className="w-full">
          <Expo />
        </div>

        <div data-section-name="GALLERY" className="w-full">
          <HorizontalGallery />
        </div>

        <div data-section-name="TATHVA-26" className="w-full">
          <Footer />
        </div>
      </HeroFrameController>
    </div>
  )
}