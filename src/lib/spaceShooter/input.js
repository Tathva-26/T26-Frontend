import { GAME_KEYS } from "./constants";

/**
 * Tracks held keys. `onPress` fires once per physical key press (not on repeat).
 * Only game keys are preventDefault'ed, so Escape and browser shortcuts still work.
 */
export function createInput(onPress) {
  const held = new Set();

  const handleKeyDown = (event) => {
    if (GAME_KEYS.includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    held.add(event.code);
    onPress?.(event.code);
  };
  const handleKeyUp = (event) => held.delete(event.code);

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  return {
    isDown: (code) => held.has(code),
    dispose() {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    },
  };
}
