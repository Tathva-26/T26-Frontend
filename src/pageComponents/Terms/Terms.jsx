import Link from "next/link";
import styles from "./Terms.module.css";
import Navbar from "@/pageComponents/Navbar/Navbar";
import TathvaMenu from "@/components/TathvaMenu/TathvaMenu";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: (
      <p>
        By accessing or registering on this website, you agree to be bound by
        these Terms &amp; Conditions, along with any policies referenced within
        it. Tathva &apos;26 is the annual techno-management festival of the
        National Institute of Technology Calicut (NIT Calicut). If you do not
        agree with any part of these terms, please do not use this website or
        its services.
      </p>
    ),
  },
  {
    title: "2. Registration & Eligibility",
    body: (
      <>
        <p>
          Some features, including event registration, passes and accommodation
          booking, require you to create an account with accurate and complete
          information. You are responsible for maintaining the confidentiality
          of your account credentials and for all activity that occurs under
          your account.
        </p>
        <p>
          Certain competitions, workshops and lectures may carry their own
          eligibility criteria (such as team size, educational qualification, or
          age limits), which will be specified on the respective event page and
          must be followed in addition to these terms.
        </p>
      </>
    ),
  },
  {
    title: "3. Passes, Payments & Refunds",
    body: (
      <>
        <p>
          Passes and event fees must be paid in full through the payment methods
          made available on the website. A successful registration is confirmed
          only once payment has been processed and acknowledged.
        </p>
        <ul>
          <li>Fees once paid are non-refundable.</li>
          <li>
            Passes and bookings are non-transferable unless explicitly
            permitted.
          </li>
          <li>
            In the event a workshop, lecture or competition is cancelled or
            rescheduled by the organisers, affected participants will be
            notified and, where applicable, offered a refund or alternative
            slot.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Code of Conduct",
    body: (
      <p>
        Participants are expected to behave respectfully towards organisers,
        volunteers, speakers and fellow participants, both on campus and through
        the website. Tathva reserves the right to disqualify, remove, or deny
        entry/access to any participant found engaging in harassment, cheating,
        vandalism, or any conduct that disrupts the event or violates applicable
        law.
      </p>
    ),
  },
  {
    title: "5. Intellectual Property",
    body: (
      <p>
        All content on this website — including the Tathva name, logo, graphics,
        text, and design — is the property of Tathva, NIT Calicut, and is
        protected by applicable intellectual property laws. You may not
        reproduce, distribute, or create derivative works from this content
        without prior written permission.
      </p>
    ),
  },
  {
    title: "6. Limitation of Liability",
    body: (
      <p>
        Tathva and NIT Calicut will not be held liable for any indirect,
        incidental, or consequential loss arising from your use of this website,
        participation in events, or inability to access any service due to
        factors beyond reasonable control, including technical failures,
        third-party services, or force majeure events.
      </p>
    ),
  },
  {
    title: "7. Changes to These Terms",
    body: (
      <p>
        These Terms &amp; Conditions may be updated from time to time to reflect
        changes in our services or for legal and regulatory reasons. Continued
        use of the website after any changes constitutes acceptance of the
        revised terms.
      </p>
    ),
  },
  {
    title: "8. Contact Us",
    body: (
      <p>
        If you have any questions about these Terms &amp; Conditions, please
        reach out through our <Link href="/contact">contact page</Link>.
      </p>
    ),
  },
];

export default function Terms() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="hidden lg:block">
          <Navbar />
        </div>
        <TathvaMenu />

        <h1 className={styles.title}>TERMS &amp; CONDITIONS</h1>
        <p className={styles.updated}>Tathva &apos;26 — NIT Calicut</p>

        <section className={styles.panel} aria-label="Terms and Conditions">
          {SECTIONS.map((section) => (
            <div key={section.title} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <div className={styles.sectionBody}>{section.body}</div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
