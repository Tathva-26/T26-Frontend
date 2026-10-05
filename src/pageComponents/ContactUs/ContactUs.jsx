'use client'

import styles from './ContactUs.module.css'
import Navbar, { FlipText } from '@/pageComponents/Navbar/Navbar'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import Galaxy from '@/components/Galaxy/Galaxy'

const contacts = Array.from({ length: 6 }, (_, index) => ({
  number: String(index + 1).padStart(2, '0'),
  name: `PLACEHOLDER NAME ${String(index + 1).padStart(2, '0')}`,
  designation: 'PLACEHOLDER DESIGNATION',
  phone: `+91 00000 0000${index + 1}`,
}))

export default function ContactUs() {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden='true'>
        <Galaxy
          mouseInteraction={false}
          hueShift={0}
          density={0.9}
          glowIntensity={0.35}
          saturation={0.55}
          twinkleIntensity={0}
          starSpeed={0}
          rotationSpeed={0.05}
        />
      </div>
      <main className={styles.main}>
        <div className={styles.navigation}>
          <div className='hidden lg:block'>
            <Navbar />
          </div>
          <TathvaMenu />
        </div>

        <h1 className={styles.title}>CONTACT US</h1>

        <ul className={styles.directory} aria-label='Contact directory'>
          {contacts.map((contact) => (
            <li className={styles.contact} key={contact.number}>
              <span className={styles.number} aria-hidden='true'>
                {contact.number}
              </span>
              <div className={styles.details}>
                <h2 className={styles.name}>
                  <FlipText text={contact.name} />
                </h2>
                <p className={styles.designation}>
                  <FlipText text={contact.designation} />
                </p>
                <a
                  className={styles.phone}
                  href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                  aria-label={`Call ${contact.phone}`}
                >
                  <svg
                    className={styles.phoneIcon}
                    viewBox='0 0 24 24'
                    aria-hidden='true'
                  >
                    <path d='M6.6 2.8 9.4 2a1.5 1.5 0 0 1 1.8 1l1.1 3.3a1.5 1.5 0 0 1-.6 1.7L9.9 9.3a14 14 0 0 0 4.8 4.8l1.3-1.8a1.5 1.5 0 0 1 1.7-.6l3.3 1.1a1.5 1.5 0 0 1 1 1.8l-.8 2.8a2 2 0 0 1-2 1.5C10.6 20.4 3.6 13.4 5.1 4.8a2 2 0 0 1 1.5-2Z' />
                  </svg>
                  <FlipText text={contact.phone} />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
