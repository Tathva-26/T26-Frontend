'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'
import Crystal3D from './Crystal3D'
import styles from './Expo.module.css'
import { expoJourney } from './expoJourney.mjs'
import { measureExpoLabels, expoLeaderPaths } from './expoLeaders.mjs'
import FallbackShards from './FallbackShards'

export default function Expo({ sharedCrystal = false }) {
  const details = useRef(null)
  const stage = useRef(null)
  const layout = useRef(null)
  const journey = useRef(expoJourney(1))
  const leaders = useRef([])
  const project = useCallback((points) => {
    if (!layout.current) return
    expoLeaderPaths(points, layout.current).forEach((path, index) => leaders.current[index]?.setAttribute('d', path))
  }, [])
  useLayoutEffect(() => {
    if (sharedCrystal) return
    let disposed = false
    const measure = () => {
      const box = stage.current.getBoundingClientRect()
      const slot = stage.current.querySelector('[data-expo-slot]').getBoundingClientRect()
      stage.current.style.setProperty('--expo-slot-left', `${slot.left - box.left}px`)
      stage.current.style.setProperty('--expo-slot-top', `${slot.top - box.top}px`)
      stage.current.style.setProperty('--expo-slot-width', `${slot.width}px`)
      stage.current.style.setProperty('--expo-slot-height', `${slot.height}px`)
      layout.current = { width: box.width, height: box.height, slotWidth: slot.width, slotHeight: slot.height,
        endX: slot.left - box.left + slot.width / 2, endY: slot.top - box.top + slot.height / 2,
        startX: slot.left - box.left + slot.width / 2, startY: slot.top - box.top + slot.height / 2,
        labels: measureExpoLabels(stage.current, box) }
      journey.current = { ...expoJourney(1), layout: layout.current }
      project([[-.25, -.18], [.27, -.10], [.25, .18], [-.12, .30]].map(([dx, dy]) => ({
        x: (layout.current.endX + dx * slot.width) / box.width * 2 - 1,
        y: 1 - (layout.current.endY + dy * slot.height) / box.height * 2,
      })))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage.current)
    document.fonts.ready.then(() => { if (!disposed) measure() })
    return () => { disposed = true; observer.disconnect() }
  }, [sharedCrystal, project])

  return (
    <section className={styles.page} data-expo-page>
      <section ref={stage} className={styles.stage} aria-labelledby='expo-title'>
        <h1 id='expo-title' className={styles.title}>
          <span className={styles.desktopTitle}>EXPO</span>
        </h1>
        <FallbackShards />

        <p className={styles.intro} data-expo-intro>
          Tathva’26 Expo is all about technology,
          the trending, the innovations, the age-old,
          and many more.
        </p>
        <svg className={styles.desktopLines} aria-hidden='true'>
          {[0, 1, 2].map(index => <path key={index} ref={node => { leaders.current[index] = node }} />)}
        </svg>
        <div className={styles.crystalSlot} data-expo-slot>
        </div>
        {!sharedCrystal && <div className={styles.standaloneCrystal}><Crystal3D journey={journey} onProject={project} preload /></div>}
        <p className={styles.description} data-expo-description>
          National Institute of
          Technology, Calicut.
          presents Tathva Expo-
          Asia’s largest student-
          run Tech Startup Expo.
        </p>
        <button
          className={styles.explore} data-expo-explore
          onClick={() => details.current?.showModal()}
          aria-haspopup='dialog'
        >
          <span>EXPLORE</span>
        </button>

        <dialog
          ref={details}
          className={styles.details}
          data-lenis-prevent
          onClick={(event) => {
            if (event.target === event.currentTarget) details.current.close()
          }}
        >
          <form method='dialog'>
            <button aria-label='Close Expo details' className={styles.close}>
              ×
            </button>
          </form>
          <p className={styles.eyebrow}>TATHVA ’26 / NIT CALICUT</p>
          <h2>Ideas take shape.</h2>
          <p>
            Explore technology, meet the innovators, and discover what comes
            next at Tathva Expo.
          </p>
          <p className={styles.detailsNote}>
            Exhibitor and programme details will be announced here.
          </p>
        </dialog>
      </section>
    </section>
  )
}
