import HeroFrameController from '@/pageComponents/Hero/HeroFrameController'
import SmoothScroll from '@/components/SmoothScroll'

export default function HeroPage() {
  return (
    <div className='main-scroll relative h-dvh w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-black'>
      <SmoothScroll />
      <HeroFrameController />
    </div>
  )
}
