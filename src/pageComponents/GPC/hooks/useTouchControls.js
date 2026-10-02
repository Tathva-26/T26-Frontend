import { useLayoutEffect, useState } from "react";

/**
 * True when the player is using touch, which is what decides whether the
 * on-screen joystick and fire button are needed - screen width says nothing
 * about that (tablets and landscape phones are wide and still touch-only).
 *
 * Starts from the device's primary pointer, then follows whichever pointer
 * was used last, so a touchscreen laptop gets the controls as soon as the
 * screen is touched and loses them again when the mouse is used.
 */
export function useTouchControls() {
  const [touch, setTouch] = useState(false);

  useLayoutEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const fromQuery = () => setTouch(query.matches);
    const fromPointer = (event) => setTouch(event.pointerType !== "mouse");

    fromQuery();
    query.addEventListener("change", fromQuery);
    window.addEventListener("pointerdown", fromPointer, true);
    return () => {
      query.removeEventListener("change", fromQuery);
      window.removeEventListener("pointerdown", fromPointer, true);
    };
  }, []);

  return touch;
}
