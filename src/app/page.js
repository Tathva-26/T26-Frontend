'use client'

import { useState, useCallback, useRef } from 'react'
import { Hero } from '@/pageComponents/Hero'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import Navbar from '@/pageComponents/Navbar/Navbar'
import { Frame as W1Frame } from '@/pageComponents/W1/Frame'

export default function Page() {
  const [showW1, setShowW1] = useState(false)
  const transitioning = useRef(false)

  const goToW1 = useCallback(() => {
    if (transitioning.current) return
    transitioning.current = true
    setShowW1(true)
    setTimeout(() => { transitioning.current = false }, 1500)
  }, [])

  const goToHero = useCallback(() => {
    if (transitioning.current) return
    transitioning.current = true
    setShowW1(false)
    setTimeout(() => { transitioning.current = false }, 1500)
  }, [])

  return (
    <div className="bg-black h-screen overflow-hidden relative">
      <Navbar />

      {/* Hero layer — always mounted, fades out when W1 is active */}
      <div
        className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
        style={{
          opacity: showW1 ? 0 : 1,
          pointerEvents: showW1 ? 'none' : 'auto',
          zIndex: showW1 ? 0 : 10,
        }}
      >
        <Hero
          onAutoEnter={goToW1}
          onScrollBeyondEnd={goToW1}
        />
      </div>

      {/* W1 layer — fades in on top after portal zoom */}
      <div
        className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
        style={{
          opacity: showW1 ? 1 : 0,
          pointerEvents: showW1 ? 'auto' : 'none',
          zIndex: showW1 ? 10 : 0,
        }}
      >
        <W1Frame
          isActive={showW1}
          onScrollUp={goToHero}
        />
      </div>

      <TathvaMenu />
    </div>
  )
}

