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
        <TechConclaveExpoTransition />
        <Footer />
      </HeroFrameController>
    </div>
  )
}
