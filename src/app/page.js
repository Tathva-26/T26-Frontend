import HorizontalGallery from '@/pageComponents/HorizontalGallery/HorizontalGallery'
import ProfilePage from '@/pageComponents/ProfilePage/ProfilePage'
import WheelsExperience from '@/pageComponents/wheels/WheelsExperience'
import {
  UNDERLAY_LEAD_IN_VH,
  UNDERLAY_VH,
} from '@/pageComponents/wheels/robowarsHandoff'
import { RobowarsHero } from '@/pageComponents/Robowars'

export default function Home() {
  return (
    <div className='main-scroll relative h-dvh w-full overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] bg-black'>
      <ProfilePage />
      <HorizontalGallery />
      <WheelsExperience revealUnderlay />
      {/* Robowars is pulled up and pinned underneath Wheels, which fades its
          backdrop out as the TV shrinks so Robowars shows through */}
      <div className='relative z-0' style={{ marginTop: `-${UNDERLAY_VH}vh` }}>
        <RobowarsHero leadInVh={UNDERLAY_LEAD_IN_VH} />
      </div>
    </div>
  )
}
