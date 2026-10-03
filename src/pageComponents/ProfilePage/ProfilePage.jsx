'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ProfilePage.module.css';
import Galaxy from '../../components/Galaxy/Galaxy';
import Navbar from '@/pageComponents/Navbar/Navbar';
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu';
import { PATHS, api, apiErrorMessage, apiErrorStatus, apiFieldErrors } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { joinBookings } from '@/lib/bookings';
import {
  LABELS,
  avatarProblem,
  buildProfileFormData,
  changedFields,
  hasChanges,
  toDraft,
  validateProfile,
} from '@/lib/profile';
import { useUser } from '@/context/UserContext';
import { useBookings } from '@/hooks/useBookings';
import { useEvents } from '@/hooks/useEvents';

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

/**
 * Semester goes to 10 and year to 5, which is what the backend accepts. The
 * old form offered years 1-4 only, so a fifth-year could not describe
 * themselves, and had no semester field at all — one of the seven fields the
 * backend requires before it treats a profile as complete.
 */
const FIELD_ROWS = [
  { key: 'phone', type: 'tel', inputMode: 'tel', required: true },
  { key: 'college', type: 'text', required: true },
  { key: 'branch', type: 'text' },
  { key: 'semester', options: range(1, 10) },
  { key: 'year', options: range(1, 5) },
  { key: 'state', type: 'text' },
  { key: 'district', type: 'text' },
];

const MODAL_ROWS = [{ key: 'name', type: 'text', required: true }, ...FIELD_ROWS];

export default function ProfilePage() {
  const { user, isLoading, isSignedIn, hasPhone, message, avatar, refresh, signIn, signOut } = useUser();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);

  /* Events are only needed to put a title on each booking, and that join is
     on tiqrEventId. Not fetched at all when nobody is signed in. */
  const { events } = useEvents(null, { enabled: isSignedIn });
  const {
    bookings: rawBookings,
    loading: bookingsLoading,
    error: bookingsError,
    refresh: refreshBookings,
    cooldownSeconds,
    canRefresh,
  } = useBookings({ enabled: isSignedIn });

  const bookings = useMemo(() => joinBookings(rawBookings, events), [rawBookings, events]);

  useEffect(() => {
    if (!isEditorOpen) return undefined;

    function handleDialogKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsEditorOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown, true);
    return () => document.removeEventListener('keydown', handleDialogKeyDown, true);
  }, [isEditorOpen]);

  function openEditor() {
    setDraft(toDraft(user));
    setImageFile(null);
    setFieldErrors({});
    setSaveError(null);
    setIsEditorOpen(true);
  }

  function updateField(key, value) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  function chooseImage(file) {
    const problem = avatarProblem(file);
    setFieldErrors((previous) => {
      const next = { ...previous };
      if (problem) next.image = problem;
      else delete next.image;
      return next;
    });
    setImageFile(problem ? null : file);
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (saving) return;

    const errors = validateProfile(draft, user);
    if (Object.keys(errors).length > 0 || fieldErrors.image) {
      setFieldErrors((previous) => ({ ...previous, ...errors }));
      setSaveError('Check the highlighted fields.');
      return;
    }

    const changed = changedFields(user, draft);

    // The endpoint 400s on a body with no recognised fields, so a save with
    // nothing to save is simply closed rather than sent.
    if (!hasChanges(changed, imageFile)) {
      setIsEditorOpen(false);
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      // Multipart always, so an optional avatar travels with the text fields
      // in one request. Content-Type is left unset on purpose: the browser
      // has to pick the multipart boundary itself.
      await api.put(PATHS.user, buildProfileFormData(changed, imageFile), {
        headers: { 'Content-Type': undefined },
      });
      refresh();
      setIsEditorOpen(false);
    } catch (error) {
      const status = apiErrorStatus(error);
      const deadline = error?.response?.data?.deadline;

      if (status === 403 && deadline) {
        setSaveError(`Profile edits closed on ${formatDateTime(deadline) || deadline}.`);
      } else {
        setFieldErrors((previous) => ({ ...previous, ...apiFieldErrors(error) }));
        setSaveError(apiErrorMessage(error, 'Could not save your profile.'));
      }
    } finally {
      setSaving(false);
    }
  }

  const background = (
    <Galaxy
      mouseInteraction={false}
      hueShift={205}
      density={0.9}
      glowIntensity={0.35}
      saturation={0.55}
      twinkleIntensity={0.4}
      rotationSpeed={0.05}
    />
  );

  if (isLoading) {
    return (
      <div className={styles.pageShell}>
        {background}
        <div className={styles.signInPrompt}>
          <p>Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={styles.pageShell}>
        {background}
        <div className={styles.signInPrompt}>
          {message && <p className={styles.noticeBanner}>{message}</p>}
          <p>Sign in to see your profile and bookings.</p>
          <button type="button" className={styles.signInButton} onClick={() => signIn()}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageShell}>
      {background}

      <header className={styles.topbar}>
        <div className={styles.leftHeader}>
          <div className={styles.brandWrap}></div>
        </div>

        <button type="button" className={styles.signOutButton} onClick={() => signOut('/')}>
          <span className={styles.signOutIcon} aria-hidden="true">
            <img src={avatar || '/images/profile-avatar.png'} alt="" />
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
          <div className={styles.avatar} aria-label="User avatar">
            {/* `picture` is null until an upload, and the Google avatar on the
                session stands in before the bundled placeholder. */}
            <img src={avatar || '/images/profile-main-avatar.png'} alt="" />
          </div>
          <button
            type="button"
            className={styles.avatarEditButton}
            aria-label="Edit profile"
            onClick={openEditor}
          >
            <svg
              className={styles.avatarEditIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <h1 className={styles.username}>{user?.name || 'Your profile'}</h1>

        <label className={styles.emailField}>
          <span className={styles.inputIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7.5C4 6.39543 4.89543 5.5 6 5.5H18C19.1046 5.5 20 6.39543 20 7.5V16.5C20 17.6046 19.1046 18.5 18 18.5H6C4.89543 18.5 4 17.6046 4 16.5V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M4.5 6.5L12 12.5L19.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className={styles.emailText}>{user?.email}</span>
        </label>

        {message && <p className={`${styles.noticeBanner} ${styles.noticeBannerInfo}`}>{message}</p>}

        {/* Booking is refused outright without a phone number, so this warns
            up front rather than letting the refusal arrive after an event has
            been chosen. */}
        {!hasPhone && (
          <p className={styles.infoNote}>
            <span>Add a phone number below before you book anything</span>
            <span className={styles.highlight}> — registrations are rejected without one.</span>
          </p>
        )}

        <section className={styles.detailsSection}>
          <h2 className={styles.sectionTitle}>Your details</h2>

          <div className={styles.detailsGrid}>
            {FIELD_ROWS.map(({ key }, index) => {
              const isLast = index === FIELD_ROWS.length - 1;
              const isState = key === 'state';
              const value = user?.[key];

              return (
                <div
                  key={key}
                  className={`${styles.fieldBlock} ${isState ? styles.stateField : ''}`.trim()}
                >
                  <label className={styles.fieldLabel}>{LABELS[key]}</label>
                  <div className={styles.fieldValue}>
                    {value === null || value === undefined || value === '' ? '—' : value}
                  </div>
                  {isLast && !isState && <div className={styles.fieldSpacer} aria-hidden="true" />}
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.bookingsSection}>
          <div className={styles.bookingsHeader}>
            <h2 className={styles.sectionTitle}>Your Bookings</h2>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={refreshBookings}
              disabled={!canRefresh}
            >
              {/* A live read is debounced to ten seconds server-side, so the
                  button counts that down instead of firing into the debounce. */}
              {cooldownSeconds > 0 ? `REFRESH (${cooldownSeconds}s)` : 'REFRESH'}
            </button>
          </div>

          {bookingsLoading ? (
            <div className={styles.bookingCard}>Checking your bookings…</div>
          ) : bookingsError ? (
            <div className={styles.bookingCard}>{bookingsError}</div>
          ) : bookings.length === 0 ? (
            <div className={styles.bookingCard}>
              Nothing booked yet. A new booking can take a moment to appear here after payment — hit refresh if you have just paid.
            </div>
          ) : (
            <div className={styles.bookingList}>
              {bookings.map((booking) => (
                <div className={styles.bookingRow} key={booking.id}>
                  <div>
                    <div className={styles.bookingTitle}>{booking.title}</div>
                    <div className={styles.bookingMeta}>
                      {[
                        booking.reference && `Ref ${booking.reference}`,
                        booking.quantity > 1 && `${booking.quantity} tickets`,
                        booking.amount,
                        booking.createdLabel,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <span
                    className={`${styles.statusPill} ${
                      booking.status === 'CONFIRMED'
                        ? styles.statusConfirmed
                        : booking.status === 'PENDING'
                          ? styles.statusPending
                          : ''
                    }`.trim()}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {isEditorOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-editor-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsEditorOpen(false);
          }}
          tabIndex={-1}
        >
          <form ref={modalRef} className={styles.profileModal} onSubmit={saveProfile} noValidate>
            <h2 id="profile-editor-title" className={styles.modalTitle}>Edit Profile</h2>

            <div className={styles.modalRows}>
              <div className={styles.avatarRow}>
                <span className={styles.modalLabel}>Profile picture</span>
                <input
                  className={styles.avatarInput}
                  type="file"
                  accept="image/*"
                  onChange={(event) => chooseImage(event.target.files?.[0] ?? null)}
                />
                <span className={styles.avatarHint}>
                  Up to 400 KB. Stored as webp; SVG is not accepted.
                </span>
                {fieldErrors.image && (
                  <span className={styles.modalFieldError} role="alert">{fieldErrors.image}</span>
                )}
              </div>

              {MODAL_ROWS.map(({ key, type, inputMode, required, options }, index) => (
                <label className={styles.modalRow} htmlFor={`profile-edit-${key}`} key={key}>
                  <span className={styles.modalLabel}>
                    {LABELS[key]}
                    {required && <span className={styles.requiredMarker} aria-hidden="true">*</span>}
                  </span>
                  {options ? (
                    <select
                      id={`profile-edit-${key}`}
                      className={`${styles.modalInput} ${styles.modalSelect} ${fieldErrors[key] ? styles.modalInputError : ''}`.trim()}
                      value={draft[key] ?? ''}
                      aria-invalid={Boolean(fieldErrors[key])}
                      aria-describedby={fieldErrors[key] ? `profile-error-${key}` : undefined}
                      onChange={(event) => updateField(key, event.target.value)}
                    >
                      <option value="">Not set</option>
                      {options.map((option) => (
                        <option value={option} key={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`profile-edit-${key}`}
                      className={`${styles.modalInput} ${fieldErrors[key] ? styles.modalInputError : ''}`.trim()}
                      type={type}
                      inputMode={inputMode}
                      value={draft[key] ?? ''}
                      aria-invalid={Boolean(fieldErrors[key])}
                      aria-describedby={fieldErrors[key] ? `profile-error-${key}` : undefined}
                      autoFocus={index === 0}
                      onChange={(event) => updateField(key, event.target.value)}
                    />
                  )}
                  {fieldErrors[key] && (
                    <span className={styles.modalFieldError} id={`profile-error-${key}`} role="alert">
                      {fieldErrors[key]}
                    </span>
                  )}
                </label>
              ))}
            </div>

            {saveError && <p className={styles.modalSubmitError} role="alert">{saveError}</p>}

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                type="button"
                onClick={() => setIsEditorOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button className={styles.saveButton} type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
