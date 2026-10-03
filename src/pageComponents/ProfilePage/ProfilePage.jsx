'use client'

import { startTransition, useEffect, useRef, useState } from 'react'
import styles from './ProfilePage.module.css'
import Galaxy from '../../components/Galaxy/Galaxy'
import Navbar from '@/pageComponents/Navbar/Navbar'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'

const profileStorageKey = 'tathva-profile'
const defaultAvatar = '/images/profile-main-avatar.png'

const initialProfile = {
  username: 'Username',
  email: 'adoc...@gmail.com',
  phoneNumber: '123456789',
  college: 'NIT Calicut',
  branch: 'CSE',
  yearOfStudy: '2',
  district: 'Kozhikode',
  state: 'Kerala',
  avatar: defaultAvatar,
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

  const [avatarPreview, setAvatarPreview] = useState(defaultAvatar)
  const [draftAvatar, setDraftAvatar] = useState(defaultAvatar)
  const [avatarError, setAvatarError] = useState('')
  const fileInputRef = useRef(null)

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (400KB = 400 * 1024 bytes)
    if (file.size > 400 * 1024) {
      setAvatarError('Image size must be below 400KB')
      return
    }

    setAvatarError('')
    const reader = new FileReader()
    reader.onload = () => {
      setDraftAvatar(reader.result)
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveAvatar() {
    setDraftAvatar(defaultAvatar)
    setAvatarError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
          if (loadedProfile.avatar) {
            setAvatarPreview(loadedProfile.avatar)
            setDraftAvatar(loadedProfile.avatar)
          }
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
    setDraftAvatar(avatarPreview)
    setAvatarError('')
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
      avatar: draftAvatar,
    }
    window.localStorage.setItem(profileStorageKey, JSON.stringify(savedProfile))
    setProfile(savedProfile)
    setDraftProfile(savedProfile)
    setAvatarPreview(draftAvatar)
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
      <div className={styles.backdrop}>
        <Galaxy
          mouseInteraction={false}
          hueShift={205}
          density={0.9}
          glowIntensity={0.35}
          saturation={0.55}
          twinkleIntensity={0.4}
          rotationSpeed={0.05}
        />
      </div>

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
        
        {/* Avatar container displaying saved profile avatar */}
        <div className={styles.avatarGroup}>
          <div className={styles.avatar} aria-label='User avatar'>
            <img src={avatarPreview} alt='User avatar' />
          </div>
        </div>

        {/* Username row with edit button aligned flex inline */}
        <div className={styles.usernameRow}>
          <h1 className={styles.username}>{profile.username}</h1>
          <button
            type='button'
            className={styles.nameEditButton}
            aria-label='Edit profile'
            onClick={openProfileEditor}
          >
            <svg
              className={styles.nameEditIcon}
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

            {/* Avatar Upload & Remove Section */}
            <div className={styles.avatarEditSection}>
              <div className={styles.avatarEditPreview}>
                <img src={draftAvatar} alt="Profile avatar preview" />
                <button
                  type="button"
                  className={styles.avatarEditOverlay}
                  aria-label="Upload profile picture"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.avatarFileInput}
                onChange={handleAvatarChange}
              />

              <div className={styles.avatarEditActions}>
                {draftAvatar !== defaultAvatar && (
                  <button
                    type="button"
                    className={styles.avatarEditButtonText}
                    style={{ color: '#ff6b6b' }}
                    onClick={handleRemoveAvatar}
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              <span style={{ fontSize: '0.72rem', color: 'rgba(238, 228, 255, 0.5)', marginTop: '0.2rem' }}>
                Max size: 400KB
              </span>

              {avatarError && (
                <p className={styles.avatarEditError} role="alert">
                  {avatarError}
                </p>
              )}
            </div>

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