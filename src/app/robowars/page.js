import { RobowarsHero } from '@/pageComponents/Robowars'
import {
  UNDERLAY_LEAD_IN_VH,
  UNDERLAY_VH,
} from '@/pageComponents/wheels/robowarsHandoff'

export default function RobowarsPage() {
  return (
    <div className='relative z-0' style={{ marginTop: `-${UNDERLAY_VH}vh` }}>
      <RobowarsHero leadInVh={UNDERLAY_LEAD_IN_VH} />{' '}
      {/* Robowars is pulled up and pinned underneath Wheels, which fades its
                backdrop out as the TV shrinks so Robowars shows through */}
    </div>
  )
}
