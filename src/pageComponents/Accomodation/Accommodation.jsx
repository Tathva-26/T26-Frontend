'use client'

const accommodationStyles = `
.accommodation-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
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
  display: grid;
  grid-template-columns: 17.1% 1fr;
  color: #fff;
}

.accommodation-page .heading {
  align-self: center;
  justify-self: center;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: var(--font-bebas);
  font-size: 7.7vw;
  line-height: 1;
  margin-top: 6vh;
  letter-spacing: 0.02em;
  -webkit-text-stroke: 0.04em #fff;
}

.accommodation-page .comingSoon {
  align-self: center;
  justify-self: center;
  text-align: center;
  font-family: var(--font-bebas);
  font-size: clamp(2.5rem, 6vw, 5.5rem);
  line-height: 1;
  letter-spacing: 0.04em;
  color: #fff;
  opacity: 0.85;
  padding: 0 4vw;
}

@media (max-width: 900px) {
  .accommodation-page {
    height: 100%;
    overflow-y: auto;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    padding: 24px 20px 40px;
  }

  .accommodation-page .heading {
    writing-mode: horizontal-tb;
    transform: none;
    margin-top: 56px;
    font-size: clamp(2rem, 10.5vw, 5rem);
    text-align: center;
  }

  .accommodation-page .comingSoon {
    align-self: start;
    justify-self: center;
    margin-top: 24px;
    font-size: clamp(2.5rem, 12vw, 4rem);
    text-align: center;
  }
}
`

import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import Navbar from '@/pageComponents/Navbar/Navbar'
import { useNavbarScope } from '@/pageComponents/Navbar/NavbarContext'

export default function Accommodation() {
  const inNavbarScope = useNavbarScope()

  return (
    <main className='accommodation-page'>
      {!inNavbarScope && <Navbar />}
      <TathvaMenu />
      <style>{accommodationStyles}</style>
      <h1 className='heading'>ACCOMMODATION</h1>
      <p className='comingSoon'>COMING SOON</p>
    </main>
  )
}
