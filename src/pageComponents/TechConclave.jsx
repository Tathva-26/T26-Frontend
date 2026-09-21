import styles from "./TechConclave.module.css";

export default function TechConclave() {
  return (
    <div className={styles.frame}>
      <img
        className={styles.imgRight}
        src="/images/techconclave/conclaveright.png"
        alt=""
      />
      <img
        className={styles.imgLeft}
        src="/images/techconclave/conclaveleft.png"
        alt=""
      />
      <img
        className={styles.plus1}
        src="/images/techconclave/greenplus.png"
        alt=""
      />

      {/* Middle Vertical Text Block: TECH CO NC LA VE */}
      <div className={styles.verticalTextBlock}>
        <span className={styles.techText}>TECH</span>
        <span className={styles.conclaveVcrText}>CO</span>
        <span className={styles.conclaveVcrText}>NC</span>
        <span className={styles.conclaveVcrText}>LA</span>
        <span className={styles.conclaveVcrText}>VE</span>
      </div>

      {/* Right Header: TECH CONCLAVE */}
      <div className={styles.rightHeader}>
        <span className={styles.rightTech}>TECH</span>
        <span className={styles.rightConclave}>CONCLAVE</span>
      </div>

      {/* Right Paragraph in Space Grotesk */}
      <p className={styles.descriptionParagraph}>
        A space for inspiring personalities engaging conversations and unforgettable experiences
      </p>

      {/* Bottom Left Banner Text in Bebas Neue */}
      <div className={styles.talksShowsText}>
        TALKS . SHOWS . CONVERSATIONS . EXPERIENCES.
      </div>

      {/* Date Block */}
      <div className={styles.dateBlock}>
        <span className={styles.dateMonth}>OCT</span>
        <span className={styles.dateDays}>10-11</span>
      </div>
    </div>
  );
}
