'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollDownCue() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  const updateVisibility = useCallback(() => {
    const scroller = document.querySelector('.main-scroll')
    const scrollTop = scroller
      ? scroller.scrollTop
      : window.scrollY || document.documentElement.scrollTop
    const scrollHeight = scroller
      ? scroller.scrollHeight
      : Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        )
    const viewportHeight = scroller ? scroller.clientHeight : window.innerHeight

    const hasMoreContent = scrollHeight - viewportHeight - scrollTop > 48
    const heroIsActive =
      document.querySelector('[data-scroll-cue-hero="true"]') !== null
    setVisible(hasMoreContent || heroIsActive)
  }, [])

  useEffect(() => {
    const scroller = document.querySelector('.main-scroll')
    const resizeObserver = new ResizeObserver(updateVisibility)
    const mutationObserver = new MutationObserver(updateVisibility)
    resizeObserver.observe(document.documentElement)
    resizeObserver.observe(document.body)
    if (scroller) resizeObserver.observe(scroller)
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scroll-cue-hero'],
      childList: true,
      subtree: true,
    })

    window.addEventListener('scroll', updateVisibility, { passive: true })
    scroller?.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)
    window.addEventListener('load', updateVisibility)
    document.addEventListener('load', updateVisibility, true)
    const frames = []
    const checkAfterLayout = (remaining) => {
      const frame = requestAnimationFrame(() => {
        updateVisibility()
        if (remaining > 0) checkAfterLayout(remaining - 1)
      })
      frames.push(frame)
    }
    checkAfterLayout(4)
    document.fonts?.ready.then(updateVisibility)

    return () => {
      frames.forEach(cancelAnimationFrame)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('scroll', updateVisibility)
      scroller?.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
      window.removeEventListener('load', updateVisibility)
      document.removeEventListener('load', updateVisibility, true)
    }
  }, [pathname, updateVisibility])

  const scrollDown = () => {
    const scroller = document.querySelector('.main-scroll')
    const heroIsActive =
      document.querySelector('[data-scroll-cue-hero="true"]') !== null
    const viewportHeight = scroller ? scroller.clientHeight : window.innerHeight
    const scrollHeight = scroller
      ? scroller.scrollHeight
      : Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        )
    const currentTop = scroller
      ? scroller.scrollTop
      : window.scrollY || document.documentElement.scrollTop
    const target = Math.min(
      currentTop + viewportHeight * 0.72,
      scrollHeight - viewportHeight,
    )
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (heroIsActive && scroller) {
      scroller.dispatchEvent(
        new WheelEvent('wheel', {
          deltaY: viewportHeight * 0.72,
          bubbles: true,
          cancelable: true,
        }),
      )
      return
    }

    if (scroller && window.__lenis) {
      window.__lenis.scrollTo(target, {
        duration: prefersReducedMotion ? 0 : 1.15,
        easing: (progress) => 1 - Math.pow(1 - progress, 3),
      })
    } else if (scroller) {
      scroller.scrollTo({
        top: target,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })
    } else {
      window.scrollTo({
        top: target,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })
    }
  }

  return (
    <>
      <style jsx global>{`
        .scroll-down-cue {
          position: fixed;
          z-index: 100;
          bottom: max(20px, env(safe-area-inset-bottom));
          left: 50%;
          display: grid;
          width: 48px;
          height: 58px;
          place-items: center;
          padding: 0;
          transform: translateX(-50%);
          border: 0;
          background: transparent;
          color: white;
          cursor: pointer;
          filter: drop-shadow(0 0 5px rgb(255 255 255 / 80%))
            drop-shadow(0 0 12px rgb(89 113 255 / 80%));
        }

        .scroll-down-cue:focus-visible {
          border-radius: 8px;
          outline: 2px solid rgb(255 255 255 / 85%);
          outline-offset: 2px;
        }

        .scroll-down-cue::after {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          padding: 7px 11px;
          transform: translate(-50%, 5px);
          border: 1px solid rgb(255 255 255 / 22%);
          border-radius: 999px;
          background: rgb(7 10 20 / 88%);
          color: white;
          content: 'Keep scrolling...';
          font-family: 'Space Grotesk', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.03em;
          line-height: 1;
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          transition:
            opacity 220ms ease,
            transform 220ms ease;
        }

        .scroll-down-cue:hover::after,
        .scroll-down-cue:focus-visible::after {
          transform: translate(-50%, 0);
          opacity: 1;
        }

        .scroll-down-cue[hidden] {
          display: none;
        }

        .scroll-down-cue svg {
          width: 34px;
          height: 48px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 2.5;
        }

        .scroll-down-cue path {
          animation: scroll-down-cue-drop 1.35s ease-in-out infinite;
        }

        .scroll-down-cue path:nth-child(2) {
          animation-delay: 150ms;
        }

        .scroll-down-cue path:nth-child(3) {
          animation-delay: 300ms;
        }

        @keyframes scroll-down-cue-drop {
          0%,
          100% {
            opacity: 0.35;
            transform: translateY(-3px);
          }

          45% {
            opacity: 1;
            transform: translateY(3px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-down-cue path {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
      <button
        type='button'
        className='scroll-down-cue'
        aria-label='Keep scrolling down'
        onClick={scrollDown}
        hidden={!visible}
      >
        <svg viewBox='0 0 24 36' aria-hidden='true'>
          <path d='m6 5 6 6 6-6' />
          <path d='m6 15 6 6 6-6' />
          <path d='m6 25 6 6 6-6' />
        </svg>
      </button>
    </>
  )
}
