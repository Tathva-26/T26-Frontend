'use client'

/* The context transports a ref; only event handlers and the frame loop read it. */
/* eslint-disable react-hooks/refs */

import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { detailMotion, detailDuration } from './expoDetailMotion.mjs'
import { expoDetailContent } from './expoDetailContent.mjs'
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
      const motion = detailMotion(p, progress.current.reduced)
      root.current.style.setProperty('--detail-copy', motion.copy)
      root.current.style.setProperty('--detail-dark', motion.dark)
      root.current.style.setProperty('--detail-text', motion.text)
      // Static fallback deliberately uses only an opacity transition.
      root.current.style.setProperty('--detail-scale', 1)
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
      animation.current = gsap.to(progress.current, { value: 0, duration: detailDuration(progress.current.reduced) * progress.current.value, ease: 'none', onUpdate: paint, onComplete: finish })
    }
    const open = (element) => {
      if (progress.current.state !== 'closed') return false
      const bridge = root.current.querySelector('[data-expo-progress]')
      const phase = Number(bridge?.dataset.expoProgress) * 1.65
      if (bridge && (phase < 1 || phase >= 1.2)) return false
      opener.current = element instanceof HTMLElement ? element : document.activeElement
      const scroller = document.querySelector('.main-scroll') || document.scrollingElement
      const lenis = window.__lenis
      const stopped = lenis?.isStopped
      const top = scroller.scrollTop
      const originalStart = Number(bridge?.dataset.expoStart)
      const originalEnd = Number(bridge?.dataset.expoEnd)
      const savedProgress = bridge ? (top - originalStart) / (originalEnd - originalStart) : 0
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
        const restoreTop = bridge && Number.isFinite(start) && Number.isFinite(end) && (start !== originalStart || end !== originalEnd) ? start + (end - start) * savedProgress : top
        scroller.scrollTop = restoreTop
        if (lenis && window.__lenis === lenis) {
          lenis.scrollTo(restoreTop, { immediate: true, force: true })
          if (!stopped) lenis.start()
        }
        scroller.style.scrollBehavior = behavior
      }
      progress.current.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      progress.current.frozenPhase = bridge ? savedProgress * 1.65 : null
      progress.current.state = 'opening'
      dialog.current.showModal()
      dialog.current.scrollTop = 0
      paint()
      animation.current = gsap.to(progress.current, { value: 1, duration: detailDuration(progress.current.reduced), ease: 'none', onUpdate: paint,
        onComplete: () => { progress.current.state = 'open'; paint() } })
      return true
    }
    return { progress, open, close, setCenter: (x, y) => { progress.current.centerX = x; progress.current.centerY = y } }
  }, [])
  useEffect(() => {
    const visibility = () => { if (document.hidden) animation.current?.pause(); else animation.current?.resume() }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const motion = () => { progress.current.reduced = preference.matches }
    document.addEventListener('visibilitychange', visibility)
    preference.addEventListener('change', motion)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      preference.removeEventListener('change', motion)
      animation.current?.kill()
      release.current?.()
    }
  }, [])

  return <DetailsContext.Provider value={controller}>
    <div ref={root} className={styles.root} data-expo-detail-state='closed'>
      {children}
      <dialog ref={dialog} className={styles.dialog} aria-labelledby='expo-detail-title' data-lenis-prevent
        onCancel={event => { event.preventDefault(); controller.close() }}>
        <div className={styles.atmosphere} aria-hidden='true' />
        <button className={styles.close} onClick={controller.close} aria-label='Close Expo details' autoFocus>Close <span aria-hidden='true'>×</span></button>
        <article className={styles.content}>
          <p className={styles.eyebrow}>{expoDetailContent.label}</p>
          <h2 id='expo-detail-title'>{expoDetailContent.heading}</h2>
          {expoDetailContent.paragraphs.map((paragraph, index) => <p key={index} className={styles.paragraph} style={{ '--paragraph-order': Math.min(index, 5) }}>{paragraph}</p>)}
        </article>
      </dialog>
    </div>
  </DetailsContext.Provider>
}
