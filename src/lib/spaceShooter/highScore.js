import { HIGH_SCORE_KEY } from "./constants";

/** Reads the saved best score; returns 0 if nothing is saved or storage is unavailable. */
export function loadHighScore() {
  try {
    const saved = Number.parseInt(window.localStorage.getItem(HIGH_SCORE_KEY) ?? "", 10);
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0; // storage blocked (private mode, disabled cookies)
  }
}

export function saveHighScore(score) {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // storage blocked: the score simply will not persist
  }
}
