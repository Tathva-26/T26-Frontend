'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import styles from './ContactUs.module.css';

export default function ContactUs() {
  const [submissionReady, setSubmissionReady] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmissionReady(true);
  }

  return (
    <div className={styles.page}>
      <Link className={styles.brand} href="/" aria-label="Tathva home">
        <Image src="/images/contact-us/tathva-logo.png" alt="Tathva" fill priority sizes="55px" />
      </Link>

      <main className={styles.main}>
        <h1 className={styles.title}>CONTACT US</h1>

        <section className={styles.panel} aria-label="Contact form">
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldRow}>
              <label className={styles.topicLabel} htmlFor="contact-topic">Topic:</label>
              <input className={styles.control} id="contact-topic" name="topic" required />
            </div>

            <div className={styles.pairedFields}>
              <div className={styles.fieldRow}>
                <label className={styles.nameLabel} htmlFor="contact-name">Name:</label>
                <input className={styles.control} id="contact-name" name="name" autoComplete="name" required />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.phoneLabel} htmlFor="contact-phone">Phone No:</label>
                <input
                  className={styles.control}
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <label className={styles.emailLabel} htmlFor="contact-email">Email:</label>
              <input
                className={styles.control}
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div className={`${styles.fieldRow} ${styles.queryRow}`}>
              <label className={styles.queryLabel} htmlFor="contact-query">Query:</label>
              <textarea className={`${styles.control} ${styles.queryControl}`} id="contact-query" name="query" required />
            </div>

            <div className={styles.submitArea}>
              <button className={styles.submitButton} type="submit">Submit <span aria-hidden="true">→</span></button>
              {submissionReady && (
                <p className={styles.formStatus} role="status">
                  Your message is ready. Connect a submission service to send it.
                </p>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
