'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'
import Crystal3D from './Crystal3D'
import styles from './Expo.module.css'
import { expoJourney } from './expoJourney.mjs'
import { measureExpoLabels, expoLeaderPaths } from './expoLeaders.mjs'
import FallbackShards from './FallbackShards'
import { ExpoDetailsProvider, useExpoDetails } from './ExpoDetails'

export default function Expo(props) {
  const context = useExpoDetails()
  return context ? <ExpoContent {...props} /> : <ExpoDetailsProvider><ExpoContent {...props} /></ExpoDetailsProvider>
}

function ExpoContent({ sharedCrystal = false }) {
  const details = useExpoDetails()
  const stage = useRef(null)
  const layout = useRef(null)
  const journey = useRef(expoJourney(1))
  const leaders = useRef([])
  const project = useCallback((points) => {
    if (!layout.current) return
    expoLeaderPaths(points, layout.current).forEach((path, index) => {
      const node = leaders.current[index]
      if (node && node.getAttribute('d') !== path) node.setAttribute('d', path)
    })
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
        <h1 id='expo-title' className={styles.title} data-expo-title>
          <span className={styles.desktopTitle}>EXPO</span>
        </h1>
        <FallbackShards />

        <p className={styles.intro} data-expo-intro>
          Tathva’26 Expo is all about technology,
          the trending, the innovations, the age-old,
          and many more.
        </p>
        <svg data-expo-connectors className={styles.desktopLines} aria-hidden='true'>
          {[0, 1, 2].map(index => <path key={index} ref={node => { leaders.current[index] = node }} />)}
        </svg>
        <div className={styles.crystalSlot} data-expo-slot>
        <button className={styles.fallbackActivate} aria-label='Explore the Tathva crystal' aria-haspopup='dialog' onClick={event => details.open(event.currentTarget)} />
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
          onClick={event => details.open(event.currentTarget)}
          aria-haspopup='dialog'
        >
          <span>EXPLORE</span>
        </button>


      </section>
    </section>
  )
}
