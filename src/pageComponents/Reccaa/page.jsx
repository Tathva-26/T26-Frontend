import { Jost, Source_Serif_4 } from "next/font/google";
import Image from "next/image";
import { reccaaContent as c } from "./reccaa";
import {
  EditorialSection,
  DateHeading,
  EditorialText,
  EditorialImage,
  EditorialDocument,
  EditorialTexture,
} from "./Editorial";
import { ReccaaScrollDriver } from "./ReccaaScrollDriver";
import SmoothScroll from "@/components/SmoothScroll";
import TathvaMenu from "@/components/TathvaMenu/TathvaMenu";
import Navbar from "@/pageComponents/Navbar/Navbar";
import Footer from "@/pageComponents/Footer/Footer";
import "./editorial.css";

const display = Jost({ subsets: ["latin"], weight: ["300", "500", "700", "800"], variable: "--font-display" });
const body = Source_Serif_4({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "RECCAA CLUB × TATHVA '26 | Editorial Archive",
  description:
    "NITC never truly leaves the hearts of those who once called its precincts home. RECCAA Club is a shining testament to the fact.",
};

const IMG_SIZES = "(max-width: 767px) 100vw, (max-width: 1440px) 60vw, 65vw";
const DOC_SIZES = "(max-width: 767px) 70vw, (max-width: 1440px) 38vw, 42vw";

export default function ReccaaPage() {
  return (
    <>
      <SmoothScroll />
      <div className="reccaa-navbar">
        <Navbar />
      </div>
      <TathvaMenu />
      <main className={`${display.variable} ${body.variable}`}>
        <ReccaaScrollDriver>
        {/* ── OPENING HERO SPREAD: RECCAA CLUB x TATHVA '26 ──
            Cosmic purple theme inspired by reference artwork.
            The club wordmark borrows the RECCAA logo's paired type styles. */}
        <section id="hero" className="reccaa-hero">
          <div className="reccaa-hero__bg" aria-hidden="true" />
          <div className="reccaa-hero__content">
            <h1 className="reccaa-hero__title">
              <span className="reccaa-hero__brand">
                <span className="reccaa-hero__brand-name">RECCAA</span>
                <span className="reccaa-hero__brand-club">CLUB</span>
              </span>
              <span className="reccaa-hero__cross" aria-hidden="true">×</span>
              <span className="reccaa-hero__tathva">
                <Image
                  src="/images/hero/tathvalogo.png"
                  alt="Tathva"
                  width={2048}
                  height={416}
                  className="reccaa-hero__tathva-logo"
                />
              </span>
            </h1>
            <p className="reccaa-hero__sub">
              NITC never truly leaves the hearts of those who once called its precincts home. RECCAA Club is a shining testament to the fact.
            </p>
          </div>
        </section>

        {/* ── CHAPTER 01: BEFORE THERE WAS RECCAA ──
            Archival ink tone: early REC Calicut engineers meeting at Bharat Tourist Home. */}
        <div className="reccaa-chapter reccaa-chapter--ch1">
          <EditorialSection id="ch1" tone="ink" className="ed--ch1">
            <div className="ed__col ed__col--text">
              <DateHeading sub={c.ch1.marker} className="ch1__date">
                {c.ch1.number}
              </DateHeading>
              <EditorialText
                title={c.ch1.title}
                paragraphs={c.ch1.text}
                className="ch1__text"
              />
            </div>
            <div className="ed__col ed__col--visual">
              <EditorialImage
                image={c.ch1.photo}
                priority
                sizes={IMG_SIZES}
                className="ch1__image"
              />
            </div>
            <EditorialTexture />
          </EditorialSection>
        </div>

        {/* ── CHAPTER 02: THE PEOPLE WHO MADE IT POSSIBLE ──
            Paper tone, inverted spread: Prof. P M Jussay and early leaders. */}
        <div className="reccaa-chapter reccaa-chapter--ch2">
          <EditorialSection id="ch2" tone="paper" className="ed--ch2">
            <div className="ed__col ed__col--text">
              <DateHeading sub={c.ch2.marker} className="ch2__date">
                {c.ch2.number}
              </DateHeading>
              <EditorialText
                title={c.ch2.title}
                paragraphs={c.ch2.text}
                className="ch2__text"
              />
            </div>
            <div className="ed__col ed__col--visual">
              <div className="ch2__wrap">
                <EditorialImage
                  image={c.ch2.photoA}
                  className="ch2__a"
                  sizes={IMG_SIZES}
                />
                <EditorialImage
                  image={c.ch2.photoB}
                  layer="secondary-image"
                  tint="warm"
                  className="ch2__b"
                  sizes={DOC_SIZES}
                />
              </div>
            </div>
            <EditorialTexture />
          </EditorialSection>
        </div>

        {/* ── CHAPTER 03: WHEN THE COMMUNITY CAME TOGETHER ──
            Sepia tone: the Suma Joseph effort and collective unity. */}
        <div className="reccaa-chapter reccaa-chapter--ch3">
          <EditorialSection id="ch3" tone="sepia" className="ed--ch3">
            <div className="ed__col ed__col--text">
              <DateHeading sub={c.ch3.marker} className="ch3__date">
                {c.ch3.number}
              </DateHeading>
              <EditorialText
                title={c.ch3.title}
                quote={c.ch3.quote}
                quoteAuthor={c.ch3.quoteAuthor}
                paragraphs={c.ch3.text}
                className="ch3__text"
              />
            </div>
            <div className="ed__col ed__col--visual">
              <div className="ch3__wrap">
                <EditorialImage
                  image={c.ch3.photo}
                  tint="warm"
                  className="ch3__image"
                  sizes={IMG_SIZES}
                />
                <EditorialDocument
                  image={c.ch3.document}
                  className="ch3__doc"
                  sizes={DOC_SIZES}
                />
              </div>
            </div>
            <EditorialTexture />
          </EditorialSection>
        </div>

        {/* ── CHAPTER 04: FROM AN IDEA TO A PLACE ──
            Paper tone, architectural spread: construction, ₹1.8 crore, and the sinking crane. */}
        <div className="reccaa-chapter reccaa-chapter--ch4">
          <EditorialSection id="ch4" tone="paper" className="ed--ch4">
            <div className="ed__col ed__col--text">
              <DateHeading sub={c.ch4.marker} className="ch4__date">
                {c.ch4.number}
              </DateHeading>
              <EditorialText
                title={c.ch4.title}
                paragraphs={c.ch4.text}
                className="ch4__text"
              />
            </div>
            <div className="ed__col ed__col--visual">
              <div className="ch4__wrap">
                <EditorialImage
                  image={c.ch4.photo}
                  tint="mono"
                  className="ch4__image"
                  sizes={IMG_SIZES}
                />
                <EditorialDocument
                  image={c.ch4.document}
                  className="ch4__doc"
                  sizes={DOC_SIZES}
                />
              </div>
            </div>
            <EditorialTexture />
          </EditorialSection>
        </div>

        {/* ── CHAPTER 05: THE NEXT CHAPTER ──
            Contemporary ink tone: modern conference, grounds, and Tathva '26. */}
        <div className="reccaa-chapter reccaa-chapter--ch5">
          <EditorialSection id="ch5" tone="ink" className="ed--ch5">
            <EditorialImage
              image={c.ch5.atmosphere}
              layer="atmosphere"
              tint="faded"
              sizes="100vw"
              className="ch5__atmosphere"
            />
            <div className="ed__col ed__col--text">
              <DateHeading sub={c.ch5.marker} className="ch5__date">
                {c.ch5.number}
              </DateHeading>
              <EditorialText
                title={c.ch5.title}
                paragraphs={c.ch5.text}
                className="ch5__text"
              />
            </div>
            <div className="ed__col ed__col--visual">
              <div className="ch5__wrap">
                <EditorialImage
                  image={c.ch5.photo}
                  tint="contemporary"
                  sizes={IMG_SIZES}
                  className="ch5__image"
                />
                <EditorialDocument
                  image={c.ch5.document}
                  className="ch5__doc"
                  sizes={DOC_SIZES}
                />
              </div>
            </div>
            <EditorialTexture />
          </EditorialSection>
        </div>
        </ReccaaScrollDriver>
      </main>
      <Footer />
    </>
  );
}