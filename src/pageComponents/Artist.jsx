import styles from "./Artist.module.css";

export default function Artist() {
  return (
    <main className={styles.frame} data-model-id="54:2">
      <img
        className={styles.performer}
        src="/images/artist/performer.png"
        alt="Concert performer"
      />
      <img
        className={styles.proshowTag}
        src="/images/artist/proshow-tag.svg"
        alt=""
        aria-hidden="true"
      />
      <h1 className={styles.proshowText}>Proshow</h1>
      <img
        className={styles.topDivider}
        src="/images/artist/divider.svg"
        alt=""
        aria-hidden="true"
      />
      <img
        className={styles.flow}
        src="/images/artist/flow.svg"
        alt="Proshow event flow illustration"
      />
    </main>
  );
}
