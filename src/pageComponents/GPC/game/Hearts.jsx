const HEART_PATH =
  "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.5 4.5c2 0 3.6 1.1 4.5 2.6.9-1.5 2.5-2.6 4.5-2.6 3.8 0 5.6 3.9 4.1 7.3C19.5 16.4 12 21 12 21z";

/** Lives as hearts: filled red while alive, faint once lost. */
export default function Hearts({ lives, max }) {
  const slots = Array.from({ length: max }, (_, slot) => slot);

  return (
    <div className="flex gap-1" role="img" aria-label={`${lives} of ${max} lives left`}>
      {slots.map((slot) => (
        <svg
          key={slot}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-5 w-5 transition-colors ${slot < lives ? "fill-red-500" : "fill-white/20"}`}
        >
          <path d={HEART_PATH} />
        </svg>
      ))}
    </div>
  );
}
