'use client';

import { startTransition, useEffect, useState } from 'react';
import styles from './ProfilePage.module.css';

const tathvaWhiteLogo = 'https://www.figma.com/api/mcp/asset/c4b1e068-12d7-4e70-bc34-c2dad84d5388.png';

const navItems = ['PROSHOW', 'WORKSHOPS', 'CAMPUS AMBASADOR', 'GALLERY'];
const profileStorageKey = 'tathva-profile';

const initialProfile = {
  username: 'Username',
  email: 'adoc...@gmail.com',
  phoneNumber: '123456789',
  college: 'NIT Calicut',
  branch: 'CSE',
  semester: '3',
  yearOfStudy: '2',
  district: 'Kozhikode',
  state: 'Kerala',
};

const fieldRows = [
  { label: 'Phone Number', key: 'phoneNumber', type: 'tel' },
  { label: 'College', key: 'college', type: 'text' },
  { label: 'Branch', key: 'branch', type: 'text' },
  { label: 'Semester', key: 'semester', type: 'text' },
  { label: 'Year of Study', key: 'yearOfStudy', type: 'text' },
  { label: 'District', key: 'district', type: 'text' },
  { label: 'State', key: 'state', type: 'text' },
];

const modalRows = [
  { label: 'Username', key: 'username', type: 'text' },
  ...fieldRows,
];

export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [draftProfile, setDraftProfile] = useState(initialProfile);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    const savedProfile = window.localStorage.getItem(profileStorageKey);
    if (!savedProfile) return;

    try {
      const parsedProfile = JSON.parse(savedProfile);
      if (parsedProfile && typeof parsedProfile === 'object' && !Array.isArray(parsedProfile)) {
        const loadedProfile = { ...initialProfile, ...parsedProfile };
        startTransition(() => {
          setProfile(loadedProfile);
          setDraftProfile(loadedProfile);
        });
      }
    } catch {
      window.localStorage.removeItem(profileStorageKey);
    }
  }, []);

  function openProfileEditor() {
    setDraftProfile(profile);
    setIsEditorOpen(true);
  }

  function saveProfile(event) {
    event.preventDefault();
    const savedProfile = {
      ...draftProfile,
      username: draftProfile.username.trim() || profile.username,
    };
    window.localStorage.setItem(profileStorageKey, JSON.stringify(savedProfile));
    setProfile(savedProfile);
    setDraftProfile(savedProfile);
    setIsEditorOpen(false);
  }

  return (
    <div className={styles.pageShell}>
      <div className={styles.profileBackdrop} aria-hidden="true" />
      <div className={styles.stars} aria-hidden="true" />

      <header className={styles.topbar}>
        <div className={styles.leftHeader}>
          <div className={styles.brandWrap}>
            <div className={styles.logoMark} aria-hidden="true">
              <img src={tathvaWhiteLogo} alt="Tathva logo" className={styles.logoImage} />
            </div>
            <button type="button" className={styles.menuButton} aria-label="Open menu">
              <span />
              <span />
              <span />
            </button>
          </div>

          <nav className={styles.mainNav} aria-label="Main navigation">
            {navItems.map((item) => (
              <a key={item} href="#" className={styles.navItem}>
                {item}
              </a>
            ))}
          </nav>
        </div>

        <button type="button" className={styles.signOutButton}>
          <span className={styles.signOutIcon} aria-hidden="true">
            <img src="/images/profile-avatar.png" alt="" />
          </span>
          Sign out
        </button>
      </header>

      <main className={styles.contentWrap}>
        <div className={styles.avatar} aria-label="User avatar">
          <img src="/images/profile-main-avatar.png" alt="" />
        </div>
        <h1 className={styles.username}>
          {profile.username}
          <button
            type="button"
            className={styles.usernameEditButton}
            aria-label="Edit profile"
            onClick={openProfileEditor}
          >
            <svg
              className={styles.usernameEditIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </h1>

        <label className={styles.emailField}>
          <span className={styles.inputIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7.5C4 6.39543 4.89543 5.5 6 5.5H18C19.1046 5.5 20 6.39543 20 7.5V16.5C20 17.6046 19.1046 18.5 18 18.5H6C4.89543 18.5 4 17.6046 4 16.5V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M4.5 6.5L12 12.5L19.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className={styles.emailText}>{profile.email}</span>
        </label>

        <p className={styles.infoNote}>
          <span>Add a phone number below before you book anything</span>
          <span className={styles.highlight}> — registrations are rejected without one.</span>
        </p>

        <section className={styles.detailsSection}>
          <h2 className={styles.sectionTitle}>Your details</h2>

          <div className={styles.detailsGrid}>
            {fieldRows.map(({ label, key }, index) => {
              const isLast = index === fieldRows.length - 1;
              const isState = label === 'State';

              return (
                <div
                  key={label}
                  className={`${styles.fieldBlock} ${isState ? styles.stateField : ''}`.trim()}
                >
                  <label className={styles.fieldLabel}>{label}</label>
                  <div className={styles.fieldValue}>{profile[key]}</div>
                  {isLast && !isState && <div className={styles.fieldSpacer} aria-hidden="true" />}
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.bookingsSection}>
          <div className={styles.bookingsHeader}>
            <h2 className={styles.sectionTitle}>Your Bookings</h2>
            <button type="button" className={styles.refreshButton}>
              REFRESH
            </button>
          </div>

          <div className={styles.bookingCard}>
            Nothing booked yet. A new booking can take a moment to appear here after payment — hit refresh if you have just paid.
          </div>
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
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsEditorOpen(false);
          }}
          tabIndex={-1}
        >
          <form className={styles.profileModal} onSubmit={saveProfile}>
            <h2 id="profile-editor-title" className={styles.modalTitle}>Edit Profile</h2>
            <div className={styles.modalRows}>
              {modalRows.map(({ label, key, type, inputMode }, index) => (
                <label className={styles.modalRow} htmlFor={`profile-edit-${key}`} key={key}>
                  <span className={styles.modalLabel}>{label}</span>
                  <input
                    id={`profile-edit-${key}`}
                    className={styles.modalInput}
                    type={type}
                    inputMode={inputMode}
                    value={draftProfile[key]}
                    autoFocus={index === 0}
                    onChange={(event) => setDraftProfile((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))}
                  />
                </label>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                type="button"
                onClick={() => setIsEditorOpen(false)}
              >
                Cancel
              </button>
              <button className={styles.saveButton} type="submit">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
