import Image from "next/image";

// Layer hooks (for GSAP): [data-layer] = background | atmosphere | primary-image |
// secondary-image | document | text | texture. Placement lives in editorial.css classes.
const L = (layer, extra = "") => `ed__l ed__l--${layer} ${extra}`;

export function EditorialSection({ id, tone = "paper", className = "", children }) {
  return (
    <section id={id} data-section={id} data-tone={tone} className={`ed ed--${tone} ${className}`}>
      <div data-layer="background" className="ed__bg" aria-hidden="true" />
      <div className="ed__stage">{children}</div>
    </section>
  );
}

export function DateHeading({ children, sub, className = "" }) {
  return (
    <div data-layer="text" data-part="date-group" className={L("text", `ed__date-group ${className}`)}>
      <p data-part="date" className="ed__date">{children}</p>
      {sub && <p data-part="date-sub" className="ed__date-sub">{sub}</p>}
    </div>
  );
}

export function EditorialText({ title, quote, quoteAuthor, paragraphs = [], className = "" }) {
  return (
    <div data-layer="text" data-part="body" className={L("text", `ed__text ${className}`)}>
      {title && <h2 data-part="title" className="ed__title">{title}</h2>}
      {quote && (
        <blockquote data-part="quote" className="ed__quote">
          <p className="ed__quote-text">{quote}</p>
          {quoteAuthor && <cite className="ed__quote-author">— {quoteAuthor}</cite>}
        </blockquote>
      )}
      {paragraphs.map((p, i) => (
        <p key={i} className="ed__p">{p}</p>
      ))}
    </div>
  );
}

// layer: primary-image | secondary-image | atmosphere. tint: mono (default) | warm | faded | contemporary.
// All images feature clean, intentional rectangular boundaries.
export function EditorialImage({
  image,
  layer = "primary-image",
  tint = "mono",
  className = "",
  sizes = "60vw",
  priority = false,
}) {
  const { src, alt, width, height } = image;
  return (
    <figure
      data-layer={layer}
      data-placeholder={src ? undefined : ""}
      aria-hidden={layer === "atmosphere" ? "true" : undefined}
      className={L(layer, `ed__photo ed__photo--${tint} ${className}`)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {src ? (
        <Image src={src} alt={alt || ""} fill sizes={sizes} priority={priority} className="ed__img" />
      ) : (
        <div role={alt ? "img" : undefined} aria-label={alt || undefined} className="ed__ph" />
      )}
    </figure>
  );
}

// A physical document/sheet of paper laid over compositions with clean straight edges.
export function EditorialDocument({ image, className = "", sizes = "30vw" }) {
  const { src, alt, width, height } = image;
  return (
    <figure
      data-layer="document"
      className={L("document", `ed__doc ${className}`)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {src ? (
        <Image src={src} alt={alt || ""} fill sizes={sizes} className="ed__img ed__img--doc" />
      ) : (
        <div role="img" aria-label={alt || undefined} className="ed__ph ed__ph--doc" />
      )}
    </figure>
  );
}

// Subtle physical grain overlay covering the stage.
export function EditorialTexture({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      data-layer="texture"
      className={`ed__tex ed__tex--grain ${className}`}
    />
  );
}