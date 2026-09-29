import { Hero } from '@/pageComponents/Hero'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import Navbar from '@/pageComponents/Navbar/Navbar'

export default function Page() {
  return (
    <div>
      <Navbar />
      <Hero />
      <TathvaMenu />
    </div>
  )
}
