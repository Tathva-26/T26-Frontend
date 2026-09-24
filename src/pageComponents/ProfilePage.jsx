import styles from './ProfilePage.module.css';

const tathvaWhiteLogo = 'https://www.figma.com/api/mcp/asset/c4b1e068-12d7-4e70-bc34-c2dad84d5388.png';

const navItems = ['PROSHOW', 'WORKSHOPS', 'CAMPUS AMBASADOR', 'GALLERY'];

const fieldRows = [
  { label: 'Phone Number', value: '123456789' },
  { label: 'College', value: 'NIT Calicut' },
  { label: 'Branch', value: 'CSE' },
  { label: 'Semester', value: '3' },
  { label: 'Year of Study', value: '2' },
  { label: 'District', value: 'Kozhikode' },
  { label: 'State', value: 'Kerala' },
];

export default function ProfilePage() {
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
        <h1 className={styles.username}>Username</h1>

        <label className={styles.emailField}>
          <span className={styles.inputIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7.5C4 6.39543 4.89543 5.5 6 5.5H18C19.1046 5.5 20 6.39543 20 7.5V16.5C20 17.6046 19.1046 18.5 18 18.5H6C4.89543 18.5 4 17.6046 4 16.5V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M4.5 6.5L12 12.5L19.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className={styles.emailText}>adoc...@gmail.com</span>
        </label>

        <p className={styles.infoNote}>
          <span>Add a phone number below before you book anything</span>
          <span className={styles.highlight}> — registrations are rejected without one.</span>
        </p>

        <section className={styles.detailsSection}>
          <h2 className={styles.sectionTitle}>Your details</h2>

          <div className={styles.detailsGrid}>
            {fieldRows.map(({ label, value }, index) => {
              const isLast = index === fieldRows.length - 1;
              const isState = label === 'State';

              return (
                <div
                  key={label}
                  className={`${styles.fieldBlock} ${isState ? styles.stateField : ''}`.trim()}
                >
                  <label className={styles.fieldLabel}>{label}</label>
                  <div className={styles.fieldValue}>{value}</div>
                  {isState && (
                    <button type="button" className={styles.saveButton}>
                      Save Changes
                    </button>
                  )}
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
    </div>
  );
}
