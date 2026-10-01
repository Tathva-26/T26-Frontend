'use client'

/* The context transports a ref; only event handlers and the frame loop read it. */
/* eslint-disable react-hooks/refs */

import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import styles from './ExpoDetails.module.css'

const DetailsContext = createContext(null)
export const useExpoDetails = () => useContext(DetailsContext)

export function ExpoDetailsProvider({ children }) {
  const root = useRef(null)
  const dialog = useRef(null)
  const progress = useRef({ value: 0, reduced: false, state: 'closed' })
  const animation = useRef(null)
  const release = useRef(null)
  const opener = useRef(null)
  const controller = useMemo(() => {
    const paint = () => {
      const p = progress.current.value
      const clamp = (v) => Math.max(0, Math.min(1, v))
      root.current.style.setProperty('--detail-copy', 1 - clamp((p - .09) / .33))
      root.current.style.setProperty('--detail-dark', clamp((p - .2) / .52))
      root.current.style.setProperty('--detail-text', clamp((p - .5) / .5))
      root.current.style.setProperty('--detail-scale', progress.current.reduced ? 1 : 1 + .08 * p + .07 * Math.sin(p * Math.PI))
      root.current.dataset.expoDetailState = progress.current.state
    }
    const finish = () => {
      progress.current.state = 'closed'
      dialog.current?.close()
      release.current?.()
      release.current = null
      paint()
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true })
    }
    const close = () => {
      if (progress.current.state === 'closed' || progress.current.state === 'closing') return
      progress.current.state = 'closing'
      animation.current?.kill()
      paint()
      animation.current = gsap.to(progress.current, { value: 0, duration: (progress.current.reduced ? .15 : .9) * progress.current.value, ease: 'none', onUpdate: paint, onComplete: finish })
    }
    const open = (element) => {
      if (progress.current.state !== 'closed') return false
      const bridge = root.current.querySelector('[data-expo-progress]')
      const phase = Number(bridge?.dataset.expoProgress) * 2.15
      if (bridge && (phase < 1 || phase >= 1.45)) return false
      opener.current = element instanceof HTMLElement ? element : document.activeElement
      const scroller = document.querySelector('.main-scroll') || document.scrollingElement
      const lenis = window.__lenis
      const stopped = lenis?.isStopped
      const top = scroller.scrollTop
      const overflow = scroller.style.overflow
      const behavior = scroller.style.scrollBehavior
      lenis?.stop()
      scroller.style.overflow = 'hidden'
      scroller.style.scrollBehavior = 'auto'
      release.current = () => {
        scroller.style.overflow = overflow
        // A resize can change pin distances; restore the same journey phase.
        const start = Number(bridge?.dataset.expoStart)
        const end = Number(bridge?.dataset.expoEnd)
        const restoreTop = bridge && Number.isFinite(start) && Number.isFinite(end) ? start + (end - start) * phase / 2.15 : top
        scroller.scrollTop = restoreTop
        if (lenis && window.__lenis === lenis) {
          lenis.scrollTo(restoreTop, { immediate: true, force: true })
          if (!stopped) lenis.start()
        }
        scroller.style.scrollBehavior = behavior
      }
      progress.current.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      progress.current.frozenPhase = bridge ? phase : null
      progress.current.state = 'opening'
      dialog.current.showModal()
      paint()
      animation.current = gsap.to(progress.current, { value: 1, duration: progress.current.reduced ? .15 : .9, ease: 'none', onUpdate: paint,
        onComplete: () => { progress.current.state = 'open'; paint() } })
      return true
    }
    return { progress, open, close }
  }, [])
  useEffect(() => () => { animation.current?.kill(); release.current?.() }, [])

  return <DetailsContext.Provider value={controller}>
    <div ref={root} className={styles.root} data-expo-detail-state='closed'>
      {children}
      <dialog ref={dialog} className={styles.dialog} aria-labelledby='expo-detail-title' data-lenis-prevent
        onCancel={event => { event.preventDefault(); controller.close() }}>
        <div className={styles.atmosphere} aria-hidden='true' />
        <button className={styles.close} onClick={controller.close} aria-label='Close Expo details' autoFocus>Close <span aria-hidden='true'>×</span></button>
        <article className={styles.content}>
          <p className={styles.eyebrow}>TATHVA ’26 / NIT CALICUT</p>
          <h2 id='expo-detail-title'>Ideas take shape.</h2>
          <p>Tathva’26 Expo is all about technology, the trending, the innovations, the age-old, and many more.</p>
          <p>National Institute of Technology, Calicut presents Tathva Expo—Asia’s largest student-run Tech Startup Expo.</p>
          <p>Explore technology, meet the innovators, and discover what comes next at Tathva Expo.</p>
          <p className={styles.note}>Exhibitor and programme details will be announced here.</p>
        </article>
      </dialog>
    </div>
  </DetailsContext.Provider>
}
