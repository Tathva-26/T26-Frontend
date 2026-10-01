import { GAME_KEYS } from "./constants";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Tracks held keys, a virtual joystick axis, and a virtual "fire" flag a
 * touch button can hold the same way a held key would.
 *
 * `onPress` fires once per physical key press (not on repeat).
 * Only game keys are preventDefault'ed, so Escape and browser shortcuts
 * still work.
 */
export function createInput(onPress) {
  const held = new Set();
  const virtual = { fire: false, x: 0, y: 0 };

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
    isDown: (code) => held.has(code) || (code === "Space" && virtual.fire),

    /** Merges keyboard (digital ±1) and the virtual joystick (continuous), clamped to ±1. */
    getAxis(axis) {
      const keyboard =
        axis === "x"
          ? Number(held.has("ArrowRight")) - Number(held.has("ArrowLeft"))
          : Number(held.has("ArrowDown")) - Number(held.has("ArrowUp"));
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
    },
  };
}