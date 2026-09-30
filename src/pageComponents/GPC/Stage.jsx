/**
 * Renders children in Figma design coordinates and scales the whole box to fit.
 * The outer div takes the scaled size so surrounding layout stays correct.
 */
export default function Stage({ width, height, scale, children }) {
  return (
    <div
      className="relative"
      style={{ width: width * scale, height: height * scale, visibility: scale ? "visible" : "hidden" }}
    >
      <div
        className="absolute left-0 top-0"
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
