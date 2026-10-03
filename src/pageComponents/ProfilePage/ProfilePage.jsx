'use client'

import { startTransition, useEffect, useRef, useState } from 'react'
import styles from './ProfilePage.module.css'
import Galaxy from '../../components/Galaxy/Galaxy'
import Navbar from '@/pageComponents/Navbar/Navbar'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'

const tathvaWhiteLogo =
  'https://www.figma.com/api/mcp/asset/c4b1e068-12d7-4e70-bc34-c2dad84d5388.png'

const profileStorageKey = 'tathva-profile'

const initialProfile = {
  username: 'Username',
  email: 'adoc...@gmail.com',
  phoneNumber: '123456789',
  college: 'NIT Calicut',
  branch: 'CSE',
  yearOfStudy: '2',
  district: 'Kozhikode',
  state: 'Kerala',
}

const yearOfStudyOptions = ['1', '2', '3', '4']

const fieldRows = [
  {
    label: 'Phone Number',
    key: 'phoneNumber',
    type: 'tel',
    inputMode: 'numeric',
    pattern: '[0-9]{10}',
    maxLength: 10,
    required: true,
  },
  { label: 'College', key: 'college', type: 'text', required: true },
  { label: 'Branch', key: 'branch', type: 'text' },
  { label: 'Year of Study', key: 'yearOfStudy', options: yearOfStudyOptions },
  { label: 'State', key: 'state', type: 'text' },
  { label: 'District', key: 'district', type: 'text' },
]

const modalRows = [
  { label: 'Username', key: 'username', type: 'text', required: true },
  ...fieldRows,
]

function getFieldError(key, value) {
  if (key === 'username' && !value.trim()) {
    return 'Enter name'
  }

  if (key === 'college' && !value.trim()) {
    return 'Enter college'
  }

  if (key === 'phoneNumber' && !/^[0-9]{10}$/.test(value)) {
    return 'Enter valid phone number'
  }

  return ''
}

function getProfileErrors(values) {
  return Object.fromEntries(
    ['username', 'phoneNumber', 'college']
      .map((key) => [key, getFieldError(key, values[key])])
      .filter(([, error]) => error),
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile)
  const [draftProfile, setDraftProfile] = useState(initialProfile)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [showSubmitError, setShowSubmitError] = useState(false)
  const profileModalRef = useRef(null)

  useEffect(() => {
    const savedProfile = window.localStorage.getItem(profileStorageKey)
    if (!savedProfile) return

    try {
      const parsedProfile = JSON.parse(savedProfile)
      if (
        parsedProfile &&
        typeof parsedProfile === 'object' &&
        !Array.isArray(parsedProfile)
      ) {
        const loadedProfile = { ...initialProfile, ...parsedProfile }
        delete loadedProfile.semester
        startTransition(() => {
          setProfile(loadedProfile)
          setDraftProfile(loadedProfile)
        })
      }
    } catch {
      window.localStorage.removeItem(profileStorageKey)
    }
  }, [])

  useEffect(() => {
    if (!isEditorOpen) return undefined

    function handleDialogKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsEditorOpen(false)
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = profileModalRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusableElements?.length) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown, true)
    return () =>
      document.removeEventListener('keydown', handleDialogKeyDown, true)
  }, [isEditorOpen])

  function openProfileEditor() {
    setDraftProfile(profile)
    setValidationErrors({})
    setShowSubmitError(false)
    setIsEditorOpen(true)
  }

  function saveProfile(event) {
    event.preventDefault()
    const errors = getProfileErrors(draftProfile)
    setValidationErrors(errors)
    if (Object.keys(errors).length > 0) {
      setShowSubmitError(true)
      return
    }

    const savedProfile = {
      ...draftProfile,
      username: draftProfile.username.trim() || profile.username,
    }
    window.localStorage.setItem(profileStorageKey, JSON.stringify(savedProfile))
    setProfile(savedProfile)
    setDraftProfile(savedProfile)
    setShowSubmitError(false)
    setIsEditorOpen(false)
  }

  function updateDraftField(key, value) {
    const nextProfile = { ...draftProfile, [key]: value }
    setDraftProfile(nextProfile)

    if (Object.keys(validationErrors).length > 0) {
      const errors = getProfileErrors(nextProfile)
      setValidationErrors(errors)
      setShowSubmitError(Object.keys(errors).length > 0)
    }
  }

  function validateFieldOnBlur(key, value) {
    const error = getFieldError(key, value)
    setValidationErrors((currentErrors) => {
      if (error) return { ...currentErrors, [key]: error }

      const { [key]: _removedError, ...remainingErrors } = currentErrors
      return remainingErrors
    })
  }

  return (
    <div className={styles.pageShell}>
      <Galaxy
        mouseInteraction={false}
        hueShift={205}
        density={0.9}
        glowIntensity={0.35}
        saturation={0.55}
        twinkleIntensity={0.4}
        rotationSpeed={0.05}
      />

      <header className={styles.topbar}>
        <div className={styles.leftHeader}>
          <div className={styles.brandWrap}></div>
        </div>

        <button type='button' className={styles.signOutButton}>
          <span className={styles.signOutIcon} aria-hidden='true'>
            <img src='/images/profile-avatar.png' alt='' />
          </span>
          Sign out
        </button>
      </header>

      <main className={styles.contentWrap}>
        <div className='hidden lg:block'>
          <Navbar />
        </div>
        <TathvaMenu />
        <div className={styles.avatarGroup}>
          <div className={styles.avatar} aria-label='User avatar'>
            <img src='/images/profile-main-avatar.png' alt='' />
          </div>
          <button
            type='button'
            className={styles.avatarEditButton}
            aria-label='Edit profile'
            onClick={openProfileEditor}
          >
            <svg
              className={styles.avatarEditIcon}
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              aria-hidden='true'
            >
              <path
                d='M12 20h9'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
              />
              <path
                d='M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>
        </div>
        <h1 className={styles.username}>{profile.username}</h1>

        <label className={styles.emailField}>
          <span className={styles.inputIcon} aria-hidden='true'>
            <svg
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M4 7.5C4 6.39543 4.89543 5.5 6 5.5H18C19.1046 5.5 20 6.39543 20 7.5V16.5C20 17.6046 19.1046 18.5 18 18.5H6C4.89543 18.5 4 17.6046 4 16.5V7.5Z'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinejoin='round'
              />
              <path
                d='M4.5 6.5L12 12.5L19.5 6.5'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </span>
          <span className={styles.emailText}>{profile.email}</span>
        </label>

        <p className={styles.infoNote}>
          <span>Add a phone number below before you book anything</span>
          <span className={styles.highlight}>
            {' '}
            — registrations are rejected without one.
          </span>
        </p>

        <section className={styles.detailsSection}>
          <h2 className={styles.sectionTitle}>Your details</h2>

          <div className={styles.detailsGrid}>
            {fieldRows.map(({ label, key }, index) => {
              const isLast = index === fieldRows.length - 1
              const isState = label === 'State'

              return (
                <div
                  key={label}
                  className={`${styles.fieldBlock} ${isState ? styles.stateField : ''}`.trim()}
                >
                  <label className={styles.fieldLabel}>{label}</label>
                  <div className={styles.fieldValue}>{profile[key]}</div>
                  {isLast && !isState && (
                    <div className={styles.fieldSpacer} aria-hidden='true' />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className={styles.bookingsSection}>
          <div className={styles.bookingsHeader}>
            <h2 className={styles.sectionTitle}>Your Bookings</h2>
            <button type='button' className={styles.refreshButton}>
              REFRESH
            </button>
          </div>

          <div className={styles.bookingCard}>
            Nothing booked yet. A new booking can take a moment to appear here
            after payment — hit refresh if you have just paid.
          </div>
        </section>
      </main>

      {isEditorOpen && (
        <div
          className={styles.modalOverlay}
          role='dialog'
          aria-modal='true'
          aria-labelledby='profile-editor-title'
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsEditorOpen(false)
          }}
          tabIndex={-1}
        >
          <form
            ref={profileModalRef}
            className={styles.profileModal}
            onSubmit={saveProfile}
            noValidate
          >
            <h2 id='profile-editor-title' className={styles.modalTitle}>
              Edit Profile
            </h2>
            <div className={styles.modalRows}>
              {modalRows.map(
                (
                  {
                    label,
                    key,
                    type,
                    inputMode,
                    pattern,
                    maxLength,
                    required,
                    options,
                    readOnly,
                  },
                  index,
                ) => (
                  <label
                    className={styles.modalRow}
                    htmlFor={`profile-edit-${key}`}
                    key={key}
                  >
                    <span className={styles.modalLabel}>
                      {label}
                      {required && (
                        <span
                          className={styles.requiredMarker}
                          aria-hidden='true'
                        >
                          *
                        </span>
                      )}
                    </span>
                    {readOnly ? (
                      <output
                        id={`profile-edit-${key}`}
                        className={`${styles.modalInput} ${styles.modalDerived}`}
                        aria-live='polite'
                      >
                        {draftProfile[key]}
                      </output>
                    ) : options ? (
                      <select
                        id={`profile-edit-${key}`}
                        className={`${styles.modalInput} ${styles.modalSelect} ${validationErrors[key] ? styles.modalInputError : ''}`.trim()}
                        value={draftProfile[key]}
                        aria-invalid={Boolean(validationErrors[key])}
                        aria-describedby={
                          validationErrors[key]
                            ? `profile-error-${key}`
                            : undefined
                        }
                        autoFocus={index === 0}
                        onChange={(event) =>
                          updateDraftField(key, event.target.value)
                        }
                        onBlur={(event) =>
                          validateFieldOnBlur(key, event.currentTarget.value)
                        }
                      >
                        {options.map((option) => (
                          <option value={option} key={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`profile-edit-${key}`}
                        className={`${styles.modalInput} ${validationErrors[key] ? styles.modalInputError : ''}`.trim()}
                        type={type}
                        inputMode={inputMode}
                        pattern={pattern}
                        maxLength={maxLength}
                        required={required}
                        value={draftProfile[key]}
                        aria-invalid={Boolean(validationErrors[key])}
                        aria-describedby={
                          validationErrors[key]
                            ? `profile-error-${key}`
                            : undefined
                        }
                        autoFocus={index === 0}
                        onChange={(event) =>
                          updateDraftField(key, event.target.value)
                        }
                        onBlur={(event) =>
                          validateFieldOnBlur(key, event.currentTarget.value)
                        }
                      />
                    )}
                    {validationErrors[key] && (
                      <span
                        className={styles.modalFieldError}
                        id={`profile-error-${key}`}
                        role='alert'
                      >
                        {validationErrors[key]}
                      </span>
                    )}
                  </label>
                ),
              )}
            </div>
            {showSubmitError && (
              <p className={styles.modalSubmitError} role='alert'>
                Enter required details
              </p>
            )}
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                type='button'
                onClick={() => setIsEditorOpen(false)}
              >
                Cancel
              </button>
              <button className={styles.saveButton} type='submit'>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
