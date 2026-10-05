import { Suspense } from 'react'
import Accommodation from '@/pageComponents/Accomodation/Accommodation'

export default function Acc() {
  return (
    <Suspense>
      <Accommodation />
    </Suspense>
  )
}
