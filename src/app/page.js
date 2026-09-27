import HorizontalGallery from '@/pageComponents/HorizontalGallery/HorizontalGallery'
import ProfilePage from '@/pageComponents/ProfilePage/ProfilePage'
import WheelsPage from './wheels/page'
import { RobowarsHero } from '@/pageComponents/Robowars'

export default function Home() {
  return (
    <div className='main-scroll relative h-dvh w-full overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] bg-black'>
      <ProfilePage />
      <HorizontalGallery />
      <WheelsPage />
      <RobowarsHero />
    </div>
  )
}
