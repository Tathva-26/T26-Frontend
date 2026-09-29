import Hero from '@/pageComponents/Hero'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import Navbar from '@/pageComponents/Navbar/Navbar'

export default function Home() {
  return (
    <div className='relative min-h-screen w-full bg-[#080808]'>
      <Navbar />

      <Hero />

      <TathvaMenu />
    </div>
  )
}
