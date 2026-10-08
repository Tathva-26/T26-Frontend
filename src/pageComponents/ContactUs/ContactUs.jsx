'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './ContactUs.module.css'
import Navbar from '@/pageComponents/Navbar/Navbar'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import { BACKEND_ENABLED, PATHS, api, apiErrorMessage, apiFieldErrors } from '@/lib/api'
import { CONTACT_FIELDS, isValidEmail, normalisePhone, validateContact } from '@/lib/validation'
import { useUser } from '@/context/UserContext'

export default function ContactUs() {
  const { user } = useUser()
  const [fieldErrors, setFieldErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // The backend requires an email with every query. When signed in, the
  // account email pre-fills the visible field — editable, never forced.
  const accountEmail = isValidEmail(user?.email) ? user.email.trim() : ''
  const emailRef = useRef(null)
  const emailEditedRef = useRef(false)

  // Auth resolves after first paint, so fill the field when it arrives —
  // unless the visitor already typed something themselves.
  useEffect(() => {
    if (accountEmail && emailRef.current && !emailEditedRef.current) {
      emailRef.current.value = accountEmail
    }
  }, [accountEmail])

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const form = event.currentTarget
    const data = new FormData(form)
    const values = Object.fromEntries(
      CONTACT_FIELDS.map((field) => [field, String(data.get(field) ?? '').trim()]),
    )

    const errors = validateContact(values)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setStatus({ kind: 'error', message: 'Check the highlighted fields and try again.' })
      return
    }

    setFieldErrors({})

    if (!BACKEND_ENABLED) {
      setStatus({
        kind: 'error',
        message: 'The contact form is not open yet. Please try again later.',
      })
      return
    }

    setSubmitting(true)
    setStatus(null)

    try {
      const response = await api.post(PATHS.contactCreate, {
        ...values,
        phone: normalisePhone(values.phone),
      })

      // The backend signals success with 201. A 200 here is not a success,
      // so it must not be treated as one.
      if (response.status !== 201) {
        setStatus({
          kind: 'error',
          message: 'Your message could not be sent. Please try again.',
        })
        return
      }

      form.reset()
      if (accountEmail && emailRef.current) emailRef.current.value = accountEmail
      setStatus({ kind: 'success', message: 'Thanks — your query has reached us.' })
    } catch (error) {
      // The form is deliberately left as it was, so nothing has to be retyped.
      setFieldErrors(apiFieldErrors(error))
      setStatus({
        kind: 'error',
        message: apiErrorMessage(error, 'Your message could not be sent. Please try again.'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  /** Clears a field's error as soon as it is edited, rather than on resubmit. */
  function handleInput(event) {
    const { name } = event.target
    if (name === 'email') emailEditedRef.current = true
    setFieldErrors((previous) => {
      if (!name || !previous[name]) return previous
      const next = { ...previous }
      delete next[name]
      return next
    })
  }

  function fieldProps(name) {
    const message = fieldErrors[name]
    return {
      'aria-invalid': message ? 'true' : undefined,
      'aria-describedby': message ? `contact-${name}-error` : undefined,
    }
  }

  function fieldError(name) {
    const message = fieldErrors[name]
    if (!message) return null

    return (
      <span className={styles.fieldError} id={`contact-${name}-error`} role='alert'>
        {message}
      </span>
    )
  }

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
          Questions about events, passes, or anything Tathva? Drop a line and the team will respond.
        </p>

        <section className={styles.panel} aria-label='Contact form'>
          <form className={styles.form} onSubmit={handleSubmit} onInput={handleInput} noValidate>
            <div className={styles.fieldRow}>
              <label className={styles.topicLabel} htmlFor='contact-topic'>
                Topic
              </label>
              <input
                className={styles.control}
                id='contact-topic'
                name='topic'
                placeholder='What is this about?'
                {...fieldProps('topic')}
              />
              {fieldError('topic')}
            </div>

            <div className={styles.pairedFields}>
              <div className={styles.fieldRow}>
                <label className={styles.nameLabel} htmlFor='contact-name'>
                  Name
                </label>
                <input
                  className={styles.control}
                  id='contact-name'
                  name='name'
                  autoComplete='name'
                  placeholder='Your name'
                  {...fieldProps('name')}
                />
                {fieldError('name')}
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.phoneLabel} htmlFor='contact-phone'>
                  Phone
                </label>
                <input
                  className={styles.control}
                  id='contact-phone'
                  name='phone'
                  type='tel'
                  autoComplete='tel'
                  inputMode='tel'
                  placeholder='10-digit mobile number'
                  {...fieldProps('phone')}
                />
                {fieldError('phone')}
              </div>
            </div>

            <div className={styles.fieldRow}>
              <label className={styles.emailLabel} htmlFor='contact-email'>
                Email
              </label>
              <input
                ref={emailRef}
                className={styles.control}
                id='contact-email'
                name='email'
                type='email'
                autoComplete='email'
                placeholder='you@example.com'
                defaultValue={accountEmail}
                {...fieldProps('email')}
              />
              {fieldError('email')}
            </div>

            <div className={`${styles.fieldRow} ${styles.queryRow}`}>
              <label className={styles.queryLabel} htmlFor='contact-query'>
                Query
              </label>
              <textarea
                className={`${styles.control} ${styles.queryControl}`}
                id='contact-query'
                name='query'
                placeholder='Tell us how we can help…'
                {...fieldProps('query')}
              />
              {fieldError('query')}
            </div>

            <div className={styles.submitArea}>
              <button className={styles.submitButton} type='submit' disabled={submitting}>
                {submitting ? 'Sending…' : <>Submit <span aria-hidden='true'>→</span></>}
              </button>
              {status && (
                <p
                  className={`${styles.formStatus} ${
                    status.kind === 'success' ? styles.formStatusSuccess : styles.formStatusError
                  }`}
                  role={status.kind === 'success' ? 'status' : 'alert'}
                >
                  {status.message}
                </p>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
