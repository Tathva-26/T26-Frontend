'use client'
import { useState, useEffect } from 'react'
import './w1.css'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'

// Desktop Constants
const desktopAssetBase = 'https://c.animaapp.com/Dp7bguVy/img'
const desktopCards = [
  {
    id: 'workshops',
    number: '01',
    title: 'WORKSHOPS',
    description: [''],
    frame: `${desktopAssetBase}/vector-29.png`,
    image: `${desktopAssetBase}/tathva-26-generate-the-same-image---ar-321487---edit-httpss-m-97@2x.png`,
    titleClass: 'top-[140px] left-0 w-[204px] text-xl tracking-[5.00px]',
    descriptionClass: 'top-[154px] left-0 w-[204px]',
    markerClass: 'top-[45px] left-[77px]',
    iconClass: 'top-[510px] left-[77px]',
  },
  {
    id: 'competitions',
    number: '02',
    title: 'COMPETITIONS',
    description: [''],
    frame: `${desktopAssetBase}/group-35.png`,
    titleClass: 'top-[140px] left-px w-[204px] text-lg tracking-[4.50px]',
    descriptionClass: 'top-[154px] left-px w-[204px]',
    markerClass: 'top-[45px] left-[77px]',
    iconClass: 'top-[510px] left-[77px]',
  },
  {
    id: 'lectures',
    number: '03',
    title: 'LECTURES',
    description: [''],
    frame: `${desktopAssetBase}/group-36.png`,
    titleClass: 'top-[140px] left-[21px] w-[171px] text-xl tracking-[5.00px]',
    descriptionClass: 'top-[158px] left-px w-[204px]',
    markerClass: 'top-[45px] left-[77px]',
    iconClass: 'top-[510px] left-[77px]',
  },
  {
    id: 'hackathons',
    number: '04',
    title: 'HACKATHONS',
    description: [''],
    frame: `${desktopAssetBase}/group-37.png`,
    titleClass: 'top-[140px] left-px w-[204px] text-xl tracking-[5.00px]',
    descriptionClass: 'top-[157px] left-px w-[204px]',
    markerClass: 'top-[42px] left-[79px]',
    iconClass: 'top-[510px] left-[79px]',
  },
]

// Mobile Constants
const mobileCards = [
  {
    number: '01',
    title: 'WORKSHOPS',
    // description: (
    //   <>
    //     HANDS ON
    //     <br />
    //     MINDS ON
    //     <br />
    //     REAL WORLD
    //   </>
    // ),
    image: 'https://c.animaapp.com/UqxAlqQL/img/group-34@2x.png',
    position: 'absolute top-0 left-px w-[143px] h-[401px]',
    titleClass:
      "absolute top-[76px] left-0 w-[139px] [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-[13.6px] text-center tracking-[3.40px] leading-[normal]",
    descriptionClass:
      "absolute top-[105px] left-0 w-[139px] [font-family:'Instrument_Serif',Helvetica] font-normal text-white text-[10.9px] text-center tracking-[3.04px] leading-[normal]",
    numberPosition: 'top-[31px] left-[52px]',
    iconPosition: 'top-[347px] left-[52px]',
  },
  {
    number: '02',
    title: 'COMPETITIONS',
    // description: (
    //   <>
    //     THINK
    //     <br />
    //     SOLVE
    //     <br />
    //     BUILD
    //   </>
    // ),
    image: 'https://c.animaapp.com/UqxAlqQL/img/group-35@2x.png',
    position: 'absolute top-px left-[174px] w-[143px] h-[401px]',
    titleClass:
      "left-px w-[139px] text-[12.2px] tracking-[3.06px] absolute top-[76px] [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-center leading-[normal]",
    descriptionClass:
      "absolute top-[105px] left-px w-[139px] [font-family:'Instrument_Serif',Helvetica] font-normal text-white text-[10.9px] text-center tracking-[3.04px] leading-[normal]",
    numberPosition: 'top-[31px] left-[52px]',
    iconPosition: 'top-[347px] left-[52px]',
  },
  {
    number: '03',
    title: 'LECTURES',
    // description: (
    //   <>
    //     LEARN
    //     <br />
    //     GAIN PERSPECTIVE
    //     <br />
    //     GROW
    //   </>
    // ),
    image: 'https://c.animaapp.com/UqxAlqQL/img/group-36@2x.png',
    position: 'absolute top-[419px] left-0 w-[143px] h-[401px]',
    titleClass:
      "left-3.5 w-[116px] text-[13.6px] tracking-[3.40px] absolute top-[76px] [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-center leading-[normal]",
    descriptionClass:
      "absolute top-[107px] left-0 w-[139px] [font-family:'Instrument_Serif',Helvetica] font-normal text-white text-[10.9px] text-center tracking-[3.04px] leading-[normal]",
    numberPosition: 'top-[31px] left-[52px]',
    iconPosition: 'top-[347px] left-[52px]',
  },
  {
    number: '04',
    title: 'HACKATHONS',
    // description: (
    //   <>
    //     CODE
    //     <br />
    //     COLLABORATE
    //     <br />
    //     CREATE
    //   </>
    // ),
    image: 'https://c.animaapp.com/UqxAlqQL/img/group-37@2x.png',
    position: 'absolute top-[419px] left-[174px] w-[143px] h-[401px]',
    titleClass:
      "absolute top-[76px] left-0 w-[139px] [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-[13.6px] text-center tracking-[3.40px] leading-[normal]",
    descriptionClass:
      "absolute top-[107px] left-0 w-[139px] [font-family:'Instrument_Serif',Helvetica] font-normal text-white text-[10.9px] text-center tracking-[3.04px] leading-[normal]",
    numberPosition: 'top-[29px] left-[54px]',
    iconPosition: 'top-[347px] left-[54px]',
  },
]

const cardIcon =
  'https://c.animaapp.com/UqxAlqQL/img/3ef01d988cdc695be23d44d3ff250f97-removebg-preview-4@2x.png'

function ActivityCard({ card, onSelect, selected, index, anySelected }) {
  return (
    <article
      className={`${card.position} animate-float transition-all duration-500 cursor-pointer ${
        anySelected
          ? selected
            ? 'scale-105 z-20'
            : 'opacity-70 blur-[2px] grayscale-[20%] z-0'
          : 'scale-100 opacity-100 blur-0 grayscale-0 z-10'
      }`}
      style={{ animationDelay: `${index * 0.15}s` }}
      aria-label={`${card.title}`}
      aria-current={selected ? 'true' : undefined}
      data-card-number={card.number}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(card.number)
      }}
    >
      <div className='w-full h-full relative'>
        <img
          className='absolute top-0 left-0 w-[139px] h-[402px]'
          alt=''
          aria-hidden='true'
          src={card.image}
        />
        <h2 className={card.titleClass}>{card.title}</h2>
        <p className={card.descriptionClass}>{card.description}</p>
        <div
          className={`absolute w-[33px] h-[34px] ${card.numberPosition} bg-[url(https://c.animaapp.com/UqxAlqQL/img/22e6ef5def6cb45e16f88405d9a1a8e5-removebg-preview-1-3@2x.png)] bg-cover bg-[50%_50%]`}
          aria-hidden='true'
        >
          <span className="absolute w-full h-[36.00%] top-[32.00%] left-0 [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-[10.9px] text-center tracking-[3.04px] leading-[normal] whitespace-nowrap">
            {card.number}
          </span>
        </div>
        <img
          className={`absolute ${card.iconPosition} w-[35px] h-[35px] aspect-[1] object-cover`}
          alt=''
          aria-hidden='true'
          src={cardIcon}
        />
      </div>
    </article>
  )
}

function MobileView() {
  const [selectedCard, setSelectedCard] = useState(null)
  const [scale, setScale] = useState(1)
  const [viewportHeight, setViewportHeight] = useState(917)

  useEffect(() => {
    const handleResize = () => {
      setScale(window.innerWidth / 412)
      setViewportHeight(window.innerHeight)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <main
      className='block min-[1285px]:hidden bg-[url(https://c.animaapp.com/UqxAlqQL/img/android-compact---16.png)] bg-cover bg-[50%_50%] w-full relative overflow-hidden'
      style={{ minHeight: `${Math.max(917 * scale, viewportHeight)}px` }}
      onClick={() => setSelectedCard(null)}
    >
      <div
        className='w-[412px] h-[917px] absolute left-1/2 origin-top'
        style={{
          top: `${Math.max((viewportHeight - 917 * scale) / 2, 0)}px`,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-500 z-10 ${
            selectedCard
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedCard(null)
          }}
        />
        <section
          id='activities'
          className='absolute w-[313px] h-[820px] top-[50px] left-[53px]'
          aria-label='Tathva activities'
        >
          {mobileCards.map((card, index) => (
            <ActivityCard
              key={card.number}
              card={card}
              index={index}
              anySelected={selectedCard !== null}
              selected={selectedCard === card.number}
              onSelect={setSelectedCard}
            />
          ))}
        </section>
      </div>
    </main>
  )
}

function DesktopView() {
  return (
    <main
      className='hidden min-[1285px]:flex events-container bg-[url(https://c.animaapp.com/Dp7bguVy/img/frame-48.png)] bg-cover bg-[50%_50%] w-full h-[max(697px,100svh)] relative items-center justify-center overflow-hidden'
      data-model-id='998:1701'
    >
      <div className='hidden lg:block'></div>
      <TathvaMenu />
      <div className='absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-500 pointer-events-none z-10 page-overlay' />
      <img
        src='/images/menu/border_left.png'
        alt=''
        className='absolute left-[30px] top-1/2 -translate-y-1/2 h-[50%] max-h-[350px] w-auto pointer-events-none z-50'
      />
      <img
        src='/images/menu/border_right.png'
        alt=''
        className='absolute right-[30px] top-1/2 -translate-y-1/2 h-[50%] max-h-[350px] w-auto pointer-events-none z-50'
      />
      <div className='w-[1413px] h-full relative mx-auto flex shrink-0 items-center justify-center'>
        <section
          className='relative w-[988px] h-[590px] flex shrink-0'
          aria-label='Tathva events'
        >
          {desktopCards.map((card, index) => (
            <article
              id={card.id}
              key={card.id}
              className={`w-[207.79px] h-[590.5px] relative animate-float event-card ${
                index === 0 ? '' : index === 2 ? 'ml-[44.9px]' : 'ml-[57.9px]'
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className='w-full h-full relative event-card-inner cursor-pointer'>
                <img
                  className='absolute top-0 left-0 w-[205px] h-[592px]'
                  alt=''
                  aria-hidden='true'
                  src={card.frame}
                />
                {card.image && (
                  <img
                    className='absolute top-[251px] left-5 w-[164px] h-[249px] aspect-[0.66] object-cover'
                    alt='Workshop artwork'
                    src={card.image}
                  />
                )}
                <h2
                  className={`absolute [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-center leading-[normal] ${card.titleClass}`}
                >
                  {card.title}
                </h2>
                <p
                  className={`absolute [font-family:'Instrument_Serif',Helvetica] font-normal text-white text-base text-center tracking-[4.48px] leading-[normal] ${card.descriptionClass}`}
                >
                  {card.description.map((line) => (
                    <span className='block' key={line}>
                      {line}
                    </span>
                  ))}
                </p>
                <div
                  className={`absolute w-[49px] h-[50px] bg-[url(https://c.animaapp.com/Dp7bguVy/img/22e6ef5def6cb45e16f88405d9a1a8e5-removebg-preview-1-3@2x.png)] bg-cover bg-[50%_50%] ${card.markerClass}`}
                  aria-label={`${card.number}: ${card.title}`}
                >
                  <span className="absolute w-full h-[36.00%] top-[32.00%] left-0 [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-base text-center tracking-[4.48px] leading-[normal] whitespace-nowrap">
                    {card.number}
                  </span>
                </div>
                <img
                  className={`absolute w-[52px] h-[52px] aspect-[1] object-cover ${card.iconClass}`}
                  alt=''
                  aria-hidden='true'
                  src={`${desktopAssetBase}/3ef01d988cdc695be23d44d3ff250f97-removebg-preview-4@2x.png`}
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export const Frame = ({ onScrollUp, onScroll, isActive }) => {
  // Only intercept scroll/wheel when this panel is active
  useEffect(() => {
    if (!isActive) return
    const handleWheel = (e) => {
      if (typeof onScroll === 'function') {
        e.preventDefault()
        onScroll(e.deltaY, e.timeStamp)
      } else if (e.deltaY < 0 && typeof onScrollUp === 'function') {
        e.preventDefault()
        onScrollUp()
      }
    }

    let touchStartY = 0
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }
    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY
      const delta = touchStartY - currentY
      touchStartY = currentY
      if (typeof onScroll === 'function') {
        onScroll(delta * 1.5)
      }
    }
    const handleTouchEnd = (e) => {
      if (typeof onScroll !== 'function' && typeof onScrollUp === 'function') {
        const delta =
          touchStartY - (e.changedTouches?.[0]?.clientY || touchStartY)
        if (delta < -40) onScrollUp()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onScrollUp, onScroll, isActive])

  return (
    <>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse-glow {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.15); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .events-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.7) 100%);
          pointer-events: none;
          z-index: 5;
        }
        .events-container:has(.event-card:hover) .event-card:not(:hover) {
          opacity: 0.35;
          filter: grayscale(70%) blur(4px) brightness(0.6);
          transform: scale(0.96) translateY(10px);
        }
        .events-container:has(.event-card:hover) .page-overlay {
          opacity: 0.75;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .event-card {
          transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          z-index: 20;
        }
        .event-card-inner {
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        .event-card-inner::after {
          content: '';
          position: absolute;
          inset: -30px;
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.6s ease;
          pointer-events: none;
          z-index: -1;
          filter: blur(25px);
        }
        .event-card:hover .event-card-inner {
          transform: scale(1.12) translateY(-15px);
          filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));
        }
        .event-card:hover .event-card-inner::after {
          animation: pulse-glow 2s infinite alternate ease-in-out;
        }
        #workshops:hover .event-card-inner::after {
          background: radial-gradient(circle at center, rgba(255, 90, 90, 0.5) 0%, transparent 60%);
        }
        #competitions:hover .event-card-inner::after {
          background: radial-gradient(circle at center, rgba(90, 200, 255, 0.5) 0%, transparent 60%);
        }
        #lectures:hover .event-card-inner::after {
          background: radial-gradient(circle at center, rgba(100, 255, 120, 0.5) 0%, transparent 60%);
        }
        #hackathons:hover .event-card-inner::after {
          background: radial-gradient(circle at center, rgba(255, 200, 80, 0.5) 0%, transparent 60%);
        }
      `}</style>
      <DesktopView />
      <MobileView />
    </>
  )
}
