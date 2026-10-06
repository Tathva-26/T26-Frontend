'use client'

/* The context transports a ref; only event handlers and the frame loop read it. */
/* eslint-disable react-hooks/refs */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { detailMotion, detailDuration } from './expoDetailMotion.mjs'
import { expoDetailContent } from './expoDetailContent.mjs'
import styles from './ExpoDetails.module.css'
import TextType from './TextType'

const DetailsContext = createContext(null)
export const useExpoDetails = () => useContext(DetailsContext)

function DetailCopy({ active, reduced }) {
  const [full, setFull] = useState(false)
  return <>
    <button className={styles.showFull} onClick={() => setFull(true)} disabled={full || reduced}>{full || reduced ? 'Full text shown' : 'Show full text'}</button>
    <div className={styles.typingLayout}>
      <p className={styles.reserved} aria-hidden='true'>{expoDetailContent.description}</p>
      <TextType batched as='p' text={expoDetailContent.description} typingSpeed={2} loop={false} start={active} instant={full || reduced} showCursor cursorCharacter='|' className={styles.typed} aria-hidden='true' />
    </div>
    <p className={styles.screenReader}>{expoDetailContent.description}</p>
  </>
}

export function ExpoDetailsProvider({ children }) {
  const root = useRef(null)
  const dialog = useRef(null)
  const progress = useRef({ value: 0, reduced: false, state: 'closed' })
  const animation = useRef(null)
  const closeDeadline = useRef(null)
  const release = useRef(null)
  const opener = useRef(null)
  const [copy, setCopy] = useState({ mounted: false, active: false, reduced: false, session: 0 })
  const controller = useMemo(() => {
    const motionResult = {}
    const paint = () => {
      const p = progress.current.value
      const motion = detailMotion(p, progress.current.reduced, motionResult)
      root.current.style.setProperty('--detail-copy', motion.copy)
      root.current.style.setProperty('--detail-dark', motion.dark)
      root.current.style.setProperty('--detail-text', motion.text)
      // Static fallback deliberately uses only an opacity transition.
      root.current.style.setProperty('--detail-scale', 1)
      root.current.dataset.expoDetailState = progress.current.state
    }
    const finish = () => {
      window.clearTimeout(closeDeadline.current)
      closeDeadline.current = null
      animation.current?.kill()
      progress.current.value = 0
      progress.current.state = 'closed'
      setCopy(value => ({ ...value, mounted: false, active: false }))
      dialog.current?.close()
      release.current?.()
      release.current = null
      paint()
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true })
    }
    const close = () => {
      if (progress.current.state === 'closed' || progress.current.state === 'closing') return
      progress.current.state = 'closing'
      setCopy(value => ({ ...value, active: false }))
      animation.current?.kill()
      paint()
      const duration = (progress.current.reduced ? .15 : .65) * progress.current.value
      animation.current = gsap.to(progress.current, { value: 0, duration, ease: 'none', onUpdate: paint, onComplete: finish })
      // A throttled renderer must not keep the modal/scroll lock alive while
      // GSAP catches up. Finish at the intended wall-clock return duration.
      closeDeadline.current = window.setTimeout(finish, duration * 1000 + 50)
    }
    const open = (element) => {
      if (progress.current.state !== 'closed') return false
      const bridge = root.current.querySelector('[data-expo-progress]')
      const duration = Number(bridge?.dataset.expoDuration) || 1.65
      const exitStart = Number(bridge?.dataset.expoExitStart) || 1.2
      const phase = Number(bridge?.dataset.expoProgress) * duration
      if (bridge && (phase < 1 || phase >= exitStart)) return false
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
      progress.current.frozenPhase = bridge ? savedProgress * duration : null
      progress.current.state = 'opening'
      setCopy(value => ({ mounted: false, active: false, reduced: progress.current.reduced, session: value.session + 1 }))
      dialog.current.showModal()
      dialog.current.scrollTop = 0
      paint()
      animation.current = gsap.to(progress.current, { value: 1, duration: detailDuration(progress.current.reduced), ease: 'none', onUpdate: paint,
        onComplete: () => { progress.current.state = 'open'; paint(); setCopy(value => ({ ...value, mounted: true, active: true })) } })
      return true
    }
    return { progress, open, close, setCenter: (x, y) => { progress.current.centerX = x; progress.current.centerY = y } }
  }, [])
  useEffect(() => {
    const visibility = () => { if (document.hidden) animation.current?.pause(); else animation.current?.resume() }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const motion = () => { progress.current.reduced = preference.matches; setCopy(value => ({ ...value, reduced: preference.matches })) }
    document.addEventListener('visibilitychange', visibility)
    preference.addEventListener('change', motion)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      preference.removeEventListener('change', motion)
      animation.current?.kill()
      window.clearTimeout(closeDeadline.current)
      release.current?.()
    }
  }, [])

  return <DetailsContext.Provider value={controller}>
    <div ref={root} className={styles.root} data-expo-detail-state='closed' data-expo-ready='true'>
      {children}
      <dialog ref={dialog} className={styles.dialog} aria-labelledby='expo-detail-title' data-lenis-prevent
        onCancel={event => { event.preventDefault(); controller.close() }}>
        <div className={styles.atmosphere} aria-hidden='true' />
        <button className={styles.close} onClick={controller.close} aria-label='Close Expo details' autoFocus>Close <span aria-hidden='true'>×</span></button>
        <article className={styles.content}>
          <h2 id='expo-detail-title'>{expoDetailContent.heading}</h2>
          {copy.mounted && <DetailCopy key={copy.session} active={copy.active} reduced={copy.reduced} />}
        </article>
      </dialog>
    </div>
  </DetailsContext.Provider>
}
