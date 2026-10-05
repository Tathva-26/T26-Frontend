import Preloader from '@/pageComponents/Loading/Loading'
import HeroFrameController from '@/pageComponents/Hero/HeroFrameController'
import ProfilePage from '@/pageComponents/ProfilePage/ProfilePage'
import ProshowCarousel from '@/pageComponents/ProshowCarousel/ProshowCarousel'
import WheelsExperience from '@/pageComponents/wheels/WheelsExperience'
import Lead from '@/pageComponents/Team/Lead'
import Frontend from '@/pageComponents/Team/Frontend'
import Backend from '@/pageComponents/Team/Backend'
import Uiux from '@/pageComponents/Team/UIUX'
import TechConclaveExpoTransition from '@/pageComponents/Expo/TechConclaveExpoTransition'
import TechConclave, { TechConclaveSection } from '@/pageComponents/TechConclave/TechConclave'
import HorizontalGallery from '@/pageComponents/HorizontalGallery/HorizontalGallery'
import Expo from '@/pageComponents/Expo/Expo'
import Footer from '@/pageComponents/Footer/Footer'
import RobowarsPage from './robowars/page'
import SmoothScroll from '@/components/SmoothScroll'
import ArtistPage from './artist/page'
import Navbar from '@/pageComponents/Navbar/Navbar'
import GPC from './gpc/page'

export default function Home() {
  return (
    <div className='main-scroll relative h-dvh [@media(pointer:coarse)]:h-[calc(100dvh-1px)] w-full overflow-x-hidden overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-black'>
      <Preloader />
      <SmoothScroll />
      <Navbar />
      <HeroFrameController>
        {/* Top/Hero fallback anchor */}
        <div data-section-name='TATHVA-26' className='w-full' />

        {/* <ProfilePage /> */}
        {/* <ProshowCarousel /> */}

        <div data-section-name='ARTISTS' className='w-full'>
          <ArtistPage />
        </div>

        <div data-section-name='GPC' className='w-full'>
          <GPC />
        </div>

        <div data-section-name='WHEELS' className='w-full'>
          <WheelsExperience revealUnderlay />
        </div>

        <div data-section-name='ROBOWARS' className='w-full'>
          <RobowarsPage />
        </div>
        {/* Expo + its scroll-pinned transition are hidden for now; TechConclave stays. */}
        <TechConclaveSection>
          <TechConclave />
          <div className='pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black to-transparent sm:h-36' />
          <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black to-transparent sm:h-36' />
        </TechConclaveSection>
        {/* <TechConclaveExpoTransition /> */}
        <HorizontalGallery />
        <Footer />
      </HeroFrameController>
    </div>
  )
}
