import { GAME_KEYS, MOVE_KEYS } from "./constants";
import { clamp } from "./math";

/**
 * Tracks held keys, a virtual joystick axis, and a virtual "fire" flag a
 * touch button can hold the same way a held key would.
 *
 * `onPress` fires once per physical key press (not on repeat).
 * Only game keys are preventDefault'ed, and never together with Ctrl/Cmd/Alt,
 * so Escape and browser shortcuts still work.
 */
export function createInput(onPress) {
  const held = new Set();
  const virtual = { fire: false, x: 0, y: 0 };

  const anyHeld = (codes) => codes.some((code) => held.has(code));

  const handleKeyDown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (GAME_KEYS.includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    held.add(event.code);
    onPress?.(event.code);
  };
  const handleKeyUp = (event) => held.delete(event.code);

  // A key released while the window isn't focused never sends keyup, which
  // would leave the ship drifting. Drop everything when focus is lost.
  const release = () => {
    held.clear();
    virtual.fire = false;
    virtual.x = 0;
    virtual.y = 0;
  };
  const handleVisibility = () => {
    if (document.hidden) release();
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", release);
  document.addEventListener("visibilitychange", handleVisibility);

  return {
    isDown: (code) => held.has(code) || (code === "Space" && virtual.fire),

    /** Merges keyboard (digital ±1) and the virtual joystick (continuous), clamped to ±1. */
    getAxis(axis) {
      const keyboard =
        axis === "x"
          ? Number(anyHeld(MOVE_KEYS.right)) - Number(anyHeld(MOVE_KEYS.left))
          : Number(anyHeld(MOVE_KEYS.down)) - Number(anyHeld(MOVE_KEYS.up));
      const joystick = axis === "x" ? virtual.x : virtual.y;
      return clamp(keyboard + joystick, -1, 1);
    },

    setVirtualFire(isDown) {
      virtual.fire = isDown;
    },

    setJoystick(x, y) {
      virtual.x = clamp(x, -1, 1);
      virtual.y = clamp(y, -1, 1);
    },

    dispose() {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", handleVisibility);
    },
  };
}
