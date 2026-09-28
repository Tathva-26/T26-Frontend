import ProfilePage from '@/pageComponents/ProfilePage/ProfilePage'
import HorizontalGallery from '@/pageComponents/HorizontalGallery/HorizontalGallery'
import ProshowCarousel from '@/pageComponents/ProshowCarousel/ProshowCarousel'
import ArtistShowcase from '@/pageComponents/Artist'
import WheelsExperience from '@/pageComponents/wheels/WheelsExperience'
import Lead from '@/pageComponents/Team/Lead'
import Frontend from '@/pageComponents/Team/Frontend'
import Backend from '@/pageComponents/Team/Backend'
import Uiux from '@/pageComponents/Team/UIUX'
import Accommodation from '@/pageComponents/Accomodation/Accommodation'
import Expo from '@/pageComponents/Expo/Expo'
import Footer from '@/pageComponents/Footer/Footer'
import RobowarsPage from './robowars/page'
import SmoothScroll from '@/components/SmoothScroll'
import TathvaPasses from '@/pageComponents/TathvaPasses/TathvaPasses'

export default function Home() {
  return (
    <div className='main-scroll relative h-dvh w-full overflow-x-hidden overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-black'>
      <SmoothScroll />
      <ProfilePage />
      <HorizontalGallery />
      <ProshowCarousel />
      <ArtistShowcase />
      <WheelsExperience revealUnderlay />
      <RobowarsPage />
      <Lead />
      <Frontend />
      <Backend />
      <Uiux />
      <Accommodation />
      <Expo />
      {/* <TathvaPasses /> */}
      <Footer />
    </div>
  )
}
