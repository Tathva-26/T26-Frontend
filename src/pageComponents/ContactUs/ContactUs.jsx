'use client'

import styles from './ContactUs.module.css'
import Navbar from '@/pageComponents/Navbar/Navbar'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'

export default function ContactUs() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className='hidden lg:block'>
          <Navbar />
        </div>
        <TathvaMenu />
        <p className={styles.kicker}>Reach out — we&apos;ll get back to you</p>
        <h1 className={styles.title}>CONTACT US</h1>
        <p className={styles.subtitle}>
          Questions about events, passes, or anything Tathva? Write to us.
        </p>

        <div className={styles.emailRow}>
          <a className={styles.emailLink} href='mailto:techteamtathva@gmail.com'>
            <span className={styles.emailKicker}>Tech Team</span>
            techteamtathva@gmail.com
          </a>
          <a className={styles.emailLink} href='mailto:tathva@nitc.ac.in'>
            <span className={styles.emailKicker}>Official</span>
            tathva@nitc.ac.in
          </a>
        </div>
      </main>
    </div>
  )
}
