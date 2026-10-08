'use client'

import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import Navbar from '@/pageComponents/Navbar/Navbar'
import { useNavbarScope } from '@/pageComponents/Navbar/NavbarContext'

const accommodationStyles = `
.accommodation-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(1px 1px at 12% 20%, #fff8, transparent),
    radial-gradient(1px 1px at 35% 8%, #fff6, transparent),
    radial-gradient(1px 1px at 62% 14%, #fff8, transparent),
    radial-gradient(1px 1px at 88% 30%, #fff6, transparent),
    radial-gradient(1px 1px at 20% 78%, #fff5, transparent),
    radial-gradient(1px 1px at 75% 85%, #fff6, transparent),
    radial-gradient(ellipse at 100% 100%, #14285a 0%, transparent 35%),
    radial-gradient(ellipse at 0% 100%, #101f48 0%, transparent 30%),
    #000;
  background-attachment: fixed;
  color: #fff;
}
`

export default function Accommodation() {
  const inNavbarScope = useNavbarScope()

  return (
    <main className='accommodation-page'>
      {!inNavbarScope && <Navbar />}
      <TathvaMenu />
      <style>{accommodationStyles}</style>

      <div className='mx-auto w-full max-w-5xl px-5 pb-24 pt-28 sm:px-8'>
        <h1 className='font-[var(--font-bebas)] text-5xl tracking-wide sm:text-7xl'>
          ACCOMMODATION
        </h1>

        <div className='mt-10'>
          <p className='font-[var(--font-bebas)] text-4xl tracking-wide text-white/85 sm:text-5xl'>
            SPOT REGISTRATIONS AVAILABLE
          </p>
        </div>
      </div>
    </main>
  )
}
