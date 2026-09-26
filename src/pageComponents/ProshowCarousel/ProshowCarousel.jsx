"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { proshowArtists } from "@/lib/proshowArtists";
import useHoldToPlay from "@/hooks/useHoldToPlay";

const HOLD_MS = 1100;
const RING_COUNT = 7;
const SENS = 0.5; // <1 = heavier: the carousel moves less than your finger
const SPRING_MS = 75; // spring time-constant: bigger = softer, heavier glide
const IDLE_MS = 4250; // auto-advance to the next artist after this much idle time

const carouselStyles = `/*
 * Styles for ProshowCarousel that Tailwind classes can't express (keyframe
 * animations, the star fields, the plus-ray stars and the
 * carousel-circle maths). Kept here, as a CSS module, so the shared
 * globals.css stays untouched and class/keyframe names can't clash with
 * anything else in the project.
 */

/* ---------- animations ---------- */
@keyframes ringPulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
@keyframes twinkle {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
@keyframes eq {
  0%, 100% { transform: scaleY(0.25); }
  50% { transform: scaleY(1); }
}
/* The "hold to play" hint: a slow breathing glow so it catches the eye
   without being distracting, plus a little "press" on the key/tap icon. */
@keyframes hintPulse {
  0%, 100% { opacity: 0.65; }
  50% { opacity: 1; }
}
@keyframes keyPress {
  0%, 16%, 100% { transform: translateY(0); box-shadow: 0 2px 0 0 rgba(255, 255, 255, 0.35); }
  8% { transform: translateY(2px); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.35); }
}

.proshow-carousel .ringPulse { animation: ringPulse 9s ease-in-out infinite; }
.proshow-carousel .twinkle { animation: twinkle 6s ease-in-out infinite; }
.proshow-carousel .twinkleSlow { animation: twinkle 9s ease-in-out infinite; }
.proshow-carousel .fadeUp { animation: fadeUp 1.1s ease both; }
.proshow-carousel .eq { animation: eq 0.9s ease-in-out infinite; }
.proshow-carousel .hintPulse { animation: hintPulse 2.4s ease-in-out infinite; }
.proshow-carousel .keyPress { animation: keyPress 2.4s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .proshow-carousel .ringPulse, .proshow-carousel .twinkle, .proshow-carousel .twinkleSlow, .proshow-carousel .fadeUp, .proshow-carousel .eq, .proshow-carousel .hintPulse, .proshow-carousel .keyPress {
    animation: none;
  }
}

/* ---------- background ---------- */

/*
 * A randomly scattered starfield: mostly clearly-visible stars, a few
 * brighter ones, and a handful of faint dust-like specks. Each star has a
 * solid core (not a fade across its whole size), so small ones read as
 * crisp points instead of soft diffused blobs. The few standout stars with
 * light rays are separate elements (see .proshow-carousel .sparkle below) so each can be
 * rotated to its own angle.
 *
 * Performance: every star is its own tiny tile (a few px) placed at the star's
 * position, instead of a full-screen gradient that is only visible at one
 * point. Same look, but the browser paints a few pixels per star rather than
 * the whole screen ~250 times, which is what made the first paint slow.
 */
.proshow-carousel .bgStars {
  background:
    radial-gradient(1.54px 1.54px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(65.4vw - 3px) calc(54.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.53px 1.53px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(49.0vw - 3px) calc(56.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.73px 0.73px at 2px 2px, #fff6 0%, #fff6 55%, transparent 100%) calc(65.8vw - 2px) calc(83.3dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.38px 1.38px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(23.8vw - 3px) calc(18.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.82px 0.82px at 2px 2px, #fff6 0%, #fff6 55%, transparent 100%) calc(43.4vw - 2px) calc(28.6dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.28px 1.28px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(4.7vw - 3px) calc(20.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.37px 1.37px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(67.6vw - 3px) calc(41.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.53px 1.53px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(18.3vw - 3px) calc(80.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.77px 0.77px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(57.6vw - 2px) calc(68.6dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.43px 1.43px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(84.2vw - 3px) calc(62.0dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.53px 1.53px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(32.2vw - 3px) calc(44.0dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.6px 1.6px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(28.0vw - 3px) calc(6.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.2px 1.2px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(32.6vw - 3px) calc(36.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.49px 1.49px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(53.9vw - 3px) calc(87.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.15px 1.15px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(37.2vw - 3px) calc(28.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.25px 1.25px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(54.1vw - 3px) calc(92.0dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.7px 0.7px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(97.7vw - 2px) calc(97.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.31px 1.31px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(9.3vw - 3px) calc(37.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.54px 1.54px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(81.6vw - 3px) calc(44.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.53px 1.53px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(6.3vw - 3px) calc(81.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.81px 0.81px at 2px 2px, #fff6 0%, #fff6 55%, transparent 100%) calc(13.1vw - 2px) calc(90.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.28px 1.28px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(2.6vw - 3px) calc(31.4dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.49px 1.49px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(63.6vw - 3px) calc(51.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.65px 1.65px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(89.0vw - 3px) calc(32.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.65px 0.65px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(38.3vw - 2px) calc(23.6dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.68px 1.68px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(88.8vw - 3px) calc(90.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.45px 1.45px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(81.6vw - 3px) calc(3.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.64px 1.64px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(97.7vw - 3px) calc(70.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.64px 0.64px at 2px 2px, #fff6 0%, #fff6 55%, transparent 100%) calc(72.2vw - 2px) calc(72.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.19px 1.19px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(26.9vw - 3px) calc(57.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.42px 1.42px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(38.8vw - 3px) calc(19.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.55px 1.55px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(27.8vw - 3px) calc(97.0dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.31px 1.31px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(51.0vw - 3px) calc(59.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.15px 1.15px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(18.0vw - 3px) calc(16.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.32px 1.32px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(37.6vw - 3px) calc(94.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.68px 1.68px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(80.6vw - 3px) calc(94.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.36px 1.36px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(45.9vw - 3px) calc(72.4dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.67px 1.67px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(59.9vw - 3px) calc(10.7dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.13px 1.13px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(43.6vw - 3px) calc(79.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.28px 1.28px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(91.3vw - 3px) calc(89.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.24px 1.24px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(26.4vw - 3px) calc(38.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.68px 1.68px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(20.1vw - 3px) calc(89.4dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.44px 1.44px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(25.2vw - 3px) calc(47.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.12px 1.12px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(22.0vw - 3px) calc(17.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.15px 1.15px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(85.2vw - 3px) calc(23.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.68px 1.68px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(41.3vw - 3px) calc(96.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.36px 1.36px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(78.2vw - 3px) calc(29.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.35px 1.35px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(59.8vw - 3px) calc(66.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.33px 1.33px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(49.3vw - 3px) calc(13.0dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.45px 1.45px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(86.2vw - 3px) calc(28.4dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.34px 1.34px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(76.6vw - 3px) calc(76.7dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.62px 0.62px at 2px 2px, #fff6 0%, #fff6 55%, transparent 100%) calc(65.2vw - 2px) calc(61.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.41px 1.41px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(22.7vw - 3px) calc(86.5dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.2px 1.2px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(69.7vw - 3px) calc(57.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.29px 1.29px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(31.9vw - 3px) calc(89.5dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.35px 1.35px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(75.2vw - 3px) calc(62.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.79px 0.79px at 2px 2px, #fff6 0%, #fff6 55%, transparent 100%) calc(6.2vw - 2px) calc(32.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.6px 0.6px at 2px 2px, #fff6 0%, #fff6 55%, transparent 100%) calc(84.5vw - 2px) calc(75.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.48px 1.48px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(97.2vw - 3px) calc(72.4dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.47px 1.47px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(65.2vw - 3px) calc(74.5dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.69px 1.69px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(46.9vw - 3px) calc(24.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.68px 1.68px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(55.2vw - 3px) calc(49.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.51px 1.51px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(3.1vw - 3px) calc(49.5dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.61px 1.61px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(28.6vw - 3px) calc(25.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.61px 1.61px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(40.5vw - 3px) calc(49.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.34px 1.34px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(15.3vw - 3px) calc(66.4dvh - 3px) / 6px 6px no-repeat;
}

/* A dense layer of very fine stars (the "milky" background), like a deep-sky
   photo; the bigger .proshow-carousel .bgStars / .proshow-carousel .sparkle stars sit on top of it. */
.proshow-carousel .bgStarsFine {
  background:
    radial-gradient(0.89px 0.89px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(79.6vw - 2px) calc(32.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.4px 1.4px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(29.4vw - 3px) calc(94.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.96px 0.96px at 2px 2px, #fffc 0%, #fffc 55%, transparent 100%) calc(62.9vw - 2px) calc(50.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.89px 0.89px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(17.6vw - 2px) calc(81.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.69px 0.69px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(33.3vw - 2px) calc(12.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.67px 0.67px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(20.8vw - 2px) calc(19.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.88px 0.88px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(59.4vw - 2px) calc(53.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.76px 0.76px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(74.1vw - 2px) calc(84.6dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.41px 1.41px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(91.3vw - 3px) calc(78.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.93px 0.93px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(77.4vw - 2px) calc(55.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.8px 0.8px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(82.5vw - 2px) calc(76.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.22px 1.22px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(22.2vw - 3px) calc(47.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.82px 0.82px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(1.8vw - 2px) calc(98.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.78px 0.78px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(75.8vw - 2px) calc(43.3dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.98px 0.98px at 2px 2px, #fffb 0%, #fffb 55%, transparent 100%) calc(6.0vw - 2px) calc(47.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.72px 0.72px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(53.1vw - 2px) calc(2.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.87px 0.87px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(57.5vw - 2px) calc(6.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.11px 1.11px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(69.9vw - 3px) calc(24.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.03px 1.03px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(97.0vw - 3px) calc(10.7dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.61px 0.61px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(76.9vw - 2px) calc(9.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.53px 1.53px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(66.9vw - 3px) calc(76.7dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.89px 0.89px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(60.0vw - 2px) calc(49.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.7px 0.7px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(47.2vw - 2px) calc(41.6dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.86px 0.86px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(2.3vw - 2px) calc(48.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.84px 0.84px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(9.4vw - 2px) calc(87.4dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.76px 0.76px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(16.9vw - 2px) calc(94.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.91px 0.91px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(53.2vw - 2px) calc(81.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.98px 0.98px at 2px 2px, #fffb 0%, #fffb 55%, transparent 100%) calc(84.2vw - 2px) calc(28.6dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.73px 0.73px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(31.7vw - 2px) calc(19.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.09px 1.09px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(98.0vw - 3px) calc(76.5dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.65px 1.65px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(96.4vw - 3px) calc(25.7dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.64px 0.64px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(65.7vw - 2px) calc(92.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.92px 0.92px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(36.1vw - 2px) calc(77.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.35px 1.35px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(52.7vw - 3px) calc(85.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.94px 0.94px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(82.0vw - 2px) calc(27.3dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.73px 0.73px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(67.6vw - 2px) calc(73.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.25px 1.25px at 3px 3px, #fff9 0%, #fff9 55%, transparent 100%) calc(8.3vw - 3px) calc(45.4dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.88px 0.88px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(45.0vw - 2px) calc(84.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.64px 0.64px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(43.1vw - 2px) calc(11.3dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.24px 1.24px at 3px 3px, #fff9 0%, #fff9 55%, transparent 100%) calc(81.4vw - 3px) calc(93.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.46px 1.46px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(7.4vw - 3px) calc(55.0dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.8px 0.8px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(7.6vw - 2px) calc(73.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.75px 0.75px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(32.6vw - 2px) calc(23.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.09px 1.09px at 3px 3px, #fff9 0%, #fff9 55%, transparent 100%) calc(73.5vw - 3px) calc(86.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.42px 1.42px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(21.5vw - 3px) calc(61.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.78px 0.78px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(33.2vw - 2px) calc(96.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.68px 0.68px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(78.2vw - 2px) calc(21.6dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.93px 0.93px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(34.6vw - 2px) calc(14.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.49px 1.49px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(30.4vw - 3px) calc(24.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.66px 1.66px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(7.2vw - 3px) calc(29.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.19px 1.19px at 3px 3px, #fff9 0%, #fff9 55%, transparent 100%) calc(42.0vw - 3px) calc(52.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.77px 0.77px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(68.5vw - 2px) calc(80.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.1px 1.1px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(89.0vw - 3px) calc(38.7dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.48px 1.48px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(2.9vw - 3px) calc(59.4dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.72px 0.72px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(67.9vw - 2px) calc(2.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.07px 1.07px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(65.5vw - 3px) calc(59.7dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.62px 0.62px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(12.7vw - 2px) calc(69.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.18px 1.18px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(34.5vw - 3px) calc(94.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.81px 0.81px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(17.6vw - 2px) calc(42.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.93px 0.93px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(23.4vw - 2px) calc(71.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.34px 1.34px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(11.1vw - 3px) calc(99.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.79px 0.79px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(72.3vw - 2px) calc(48.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.91px 0.91px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(51.0vw - 2px) calc(51.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.59px 1.59px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(66.1vw - 3px) calc(79.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.93px 0.93px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(82.5vw - 2px) calc(79.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.73px 0.73px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(74.0vw - 2px) calc(53.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.79px 0.79px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(70.3vw - 2px) calc(47.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.63px 0.63px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(73.0vw - 2px) calc(72.4dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.88px 0.88px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(12.6vw - 2px) calc(49.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.86px 0.86px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(74.3vw - 2px) calc(33.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.93px 0.93px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(89.8vw - 2px) calc(3.4dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.1px 1.1px at 3px 3px, #fff9 0%, #fff9 55%, transparent 100%) calc(77.1vw - 3px) calc(59.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.1px 1.1px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(94.5vw - 3px) calc(72.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.92px 0.92px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(71.3vw - 2px) calc(25.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.66px 0.66px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(64.6vw - 2px) calc(48.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.89px 0.89px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(48.4vw - 2px) calc(41.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.5px 1.5px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(17.3vw - 3px) calc(96.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.93px 0.93px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(46.8vw - 2px) calc(9.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.92px 0.92px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(60.9vw - 2px) calc(90.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.28px 1.28px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(95.7vw - 3px) calc(18.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.84px 0.84px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(75.3vw - 2px) calc(91.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.74px 0.74px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(2.0vw - 2px) calc(29.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.3px 1.3px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(17.7vw - 3px) calc(1.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.96px 0.96px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(85.5vw - 2px) calc(19.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.02px 1.02px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(78.8vw - 3px) calc(70.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.24px 1.24px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(13.3vw - 3px) calc(91.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.52px 1.52px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(22.1vw - 3px) calc(59.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.99px 0.99px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(39.5vw - 2px) calc(13.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.82px 0.82px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(14.1vw - 2px) calc(42.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.23px 1.23px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(68.0vw - 3px) calc(52.7dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.1px 1.1px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(60.2vw - 3px) calc(52.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.61px 0.61px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(70.9vw - 2px) calc(97.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.65px 0.65px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(39.4vw - 2px) calc(42.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.94px 0.94px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(60.3vw - 2px) calc(50.4dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.62px 0.62px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(95.2vw - 2px) calc(45.4dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.27px 1.27px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(7.6vw - 3px) calc(41.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.92px 0.92px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(29.7vw - 2px) calc(90.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.73px 0.73px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(41.0vw - 2px) calc(45.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.79px 0.79px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(98.9vw - 2px) calc(12.4dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.87px 0.87px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(98.8vw - 2px) calc(81.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.41px 1.41px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(83.3vw - 3px) calc(31.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.84px 0.84px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(87.4vw - 2px) calc(29.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.55px 1.55px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(36.0vw - 3px) calc(97.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.07px 1.07px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(49.8vw - 3px) calc(47.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.86px 0.86px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(93.1vw - 2px) calc(91.3dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.14px 1.14px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(83.2vw - 3px) calc(24.0dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.12px 1.12px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(58.0vw - 3px) calc(1.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.82px 0.82px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(95.9vw - 2px) calc(94.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.91px 0.91px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(8.7vw - 2px) calc(99.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.74px 0.74px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(50.9vw - 2px) calc(28.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.86px 0.86px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(68.0vw - 2px) calc(83.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.1px 1.1px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(42.1vw - 3px) calc(68.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.64px 0.64px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(1.3vw - 2px) calc(86.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.76px 0.76px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(29.7vw - 2px) calc(34.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.72px 0.72px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(33.4vw - 2px) calc(13.4dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.74px 0.74px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(16.2vw - 2px) calc(13.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.23px 1.23px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(78.8vw - 3px) calc(55.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.8px 0.8px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(13.9vw - 2px) calc(75.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.65px 0.65px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(13.3vw - 2px) calc(98.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.09px 1.09px at 3px 3px, #fff9 0%, #fff9 55%, transparent 100%) calc(68.8vw - 3px) calc(19.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.12px 1.12px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(92.8vw - 3px) calc(65.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.8px 0.8px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(51.7vw - 2px) calc(49.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.8px 0.8px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(47.7vw - 2px) calc(2.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.94px 0.94px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(47.7vw - 2px) calc(96.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.62px 0.62px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(91.7vw - 2px) calc(53.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.93px 0.93px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(35.4vw - 2px) calc(11.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.26px 1.26px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(31.1vw - 3px) calc(11.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.05px 1.05px at 3px 3px, #fff9 0%, #fff9 55%, transparent 100%) calc(96.3vw - 3px) calc(11.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.76px 0.76px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(3.1vw - 2px) calc(46.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.64px 0.64px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(30.0vw - 2px) calc(44.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.65px 0.65px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(74.3vw - 2px) calc(15.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.66px 0.66px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(52.7vw - 2px) calc(21.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.97px 0.97px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(20.2vw - 2px) calc(32.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.84px 0.84px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(38.4vw - 2px) calc(36.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.45px 1.45px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(77.5vw - 3px) calc(62.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.92px 0.92px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(80.9vw - 2px) calc(33.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.66px 0.66px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(4.9vw - 2px) calc(76.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.73px 0.73px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(4.7vw - 2px) calc(86.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.34px 1.34px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(95.0vw - 3px) calc(98.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.83px 0.83px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(48.9vw - 2px) calc(90.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.86px 0.86px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(67.6vw - 2px) calc(84.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.48px 1.48px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(90.7vw - 3px) calc(48.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.81px 0.81px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(92.0vw - 2px) calc(54.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.26px 1.26px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(49.3vw - 3px) calc(52.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.56px 1.56px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(43.7vw - 3px) calc(61.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.01px 1.01px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(47.4vw - 3px) calc(23.4dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.82px 0.82px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(91.5vw - 2px) calc(72.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.82px 0.82px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(23.5vw - 2px) calc(24.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.0px 1.0px at 2px 2px, #fffb 0%, #fffb 55%, transparent 100%) calc(47.8vw - 2px) calc(2.0dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.47px 1.47px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(23.3vw - 3px) calc(85.4dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.65px 0.65px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(16.8vw - 2px) calc(36.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.43px 1.43px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(83.6vw - 3px) calc(1.0dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.79px 0.79px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(62.6vw - 2px) calc(79.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.82px 0.82px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(76.8vw - 2px) calc(50.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.67px 0.67px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(6.0vw - 2px) calc(80.3dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.26px 1.26px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(78.7vw - 3px) calc(50.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.75px 0.75px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(5.2vw - 2px) calc(28.3dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.05px 1.05px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(41.8vw - 3px) calc(18.6dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.28px 1.28px at 3px 3px, #fffc 0%, #fffc 55%, transparent 100%) calc(12.6vw - 3px) calc(95.7dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.43px 1.43px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(94.2vw - 3px) calc(14.5dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.86px 0.86px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(32.6vw - 2px) calc(2.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.23px 1.23px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(26.6vw - 3px) calc(42.0dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.64px 0.64px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(96.8vw - 2px) calc(28.3dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.64px 0.64px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(95.9vw - 2px) calc(92.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.1px 1.1px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(92.8vw - 3px) calc(73.7dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.76px 0.76px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(44.8vw - 2px) calc(38.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.0px 1.0px at 2px 2px, #fffc 0%, #fffc 55%, transparent 100%) calc(29.0vw - 2px) calc(28.4dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.69px 1.69px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(11.8vw - 3px) calc(35.2dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.83px 0.83px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(53.7vw - 2px) calc(92.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.82px 0.82px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(60.1vw - 2px) calc(8.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.67px 0.67px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(6.0vw - 2px) calc(4.9dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.6px 0.6px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(8.0vw - 2px) calc(16.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.91px 0.91px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(32.2vw - 2px) calc(43.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.91px 0.91px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(18.7vw - 2px) calc(82.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.65px 0.65px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(69.5vw - 2px) calc(2.4dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.27px 1.27px at 3px 3px, #fffa 0%, #fffa 55%, transparent 100%) calc(25.6vw - 3px) calc(66.9dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.84px 0.84px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(55.1vw - 2px) calc(86.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.89px 0.89px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(29.4vw - 2px) calc(75.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.67px 0.67px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(44.1vw - 2px) calc(87.2dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.83px 0.83px at 2px 2px, #fffa 0%, #fffa 55%, transparent 100%) calc(40.4vw - 2px) calc(95.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.68px 1.68px at 3px 3px, #fffd 0%, #fffd 55%, transparent 100%) calc(4.8vw - 3px) calc(50.8dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.11px 1.11px at 3px 3px, #fff9 0%, #fff9 55%, transparent 100%) calc(60.6vw - 3px) calc(74.3dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.78px 0.78px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(3.6vw - 2px) calc(11.5dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.62px 0.62px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(16.1vw - 2px) calc(21.1dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.84px 0.84px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(26.1vw - 2px) calc(37.7dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(1.07px 1.07px at 3px 3px, #fffb 0%, #fffb 55%, transparent 100%) calc(9.7vw - 3px) calc(57.4dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(1.16px 1.16px at 3px 3px, #fff9 0%, #fff9 55%, transparent 100%) calc(64.5vw - 3px) calc(88.1dvh - 3px) / 6px 6px no-repeat,
    radial-gradient(0.76px 0.76px at 2px 2px, #fff9 0%, #fff9 55%, transparent 100%) calc(9.2vw - 2px) calc(21.8dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.9px 0.9px at 2px 2px, #fff7 0%, #fff7 55%, transparent 100%) calc(27.5vw - 2px) calc(37.3dvh - 2px) / 4px 4px no-repeat,
    radial-gradient(0.87px 0.87px at 2px 2px, #fff8 0%, #fff8 55%, transparent 100%) calc(4.5vw - 2px) calc(96.0dvh - 2px) / 4px 4px no-repeat;
}

/*
 * A standout star: a soft glowing core with two thin rays that fade out
 * towards their tips (a subtle diffraction-spike look). Size, rotation and
 * brightness are set per star (inline style) so no two look identical.
 */
.proshow-carousel .sparkle {
  background-image:
    radial-gradient(circle at center, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.45) 9%, transparent 26%),
    linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%);
  background-size: 100% 100%, 100% 1px, 1px 100%;
  background-position: center;
  background-repeat: no-repeat;
}

/* ---------- carousel ---------- */

/*
 * A carousel circle. JS sets --a (distance from centre, 0 = active) and
 * --sgn (side, -1/1) on each item while scrolling; this turns them into
 * position/scale/opacity/brightness, blending between the 1st/2nd/3rd
 * neighbour values (--x1..3 offsets, --o1..2 opacities, set on the page).
 */
.proshow-carousel .item {
  --a: 9;
  --sgn: 1;
  --m1: min(var(--a), 1);
  --m2: clamp(0, calc(var(--a) - 1), 1);
  --m3: clamp(0, calc(var(--a) - 2), 1);
  transform: translateX(
      calc(
        var(--c) * var(--sgn) *
          (
            var(--x1) * var(--m1) + (var(--x2) - var(--x1)) * var(--m2) +
              (var(--x3) - var(--x2)) * var(--m3)
          )
      )
    )
    scale(calc(1 - 0.32 * var(--m1) - 0.18 * var(--m2) - 0.2 * var(--m3)));
  opacity: calc(
    1 - (1 - var(--o1)) * var(--m1) - (var(--o1) - var(--o2)) * var(--m2) - var(--o2) * var(--m3)
  );
  filter: brightness(calc(1 - 0.5 * var(--m1))) saturate(calc(1 - 0.4 * var(--m1)));
}

/* ---------- celestial smoke + beam ("locking on" to the active artist) ---------- */

@keyframes driftFar {
  from { transform: translate3d(-2%, 1%, 0) rotate(-1deg) scale(1.06); }
  to   { transform: translate3d(2.2%, -1.2%, 0) rotate(1.2deg) scale(1.12); }
}
@keyframes driftNear {
  from { transform: scaleX(-1) translate3d(2.5%, -1%, 0) rotate(1deg) scale(1.1); }
  to   { transform: scaleX(-1) translate3d(-2.5%, 1.4%, 0) rotate(-1.2deg) scale(1.04); }
}
@keyframes auraBreathe {
  0%, 100% { opacity: 0.78; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.04); }
}
@keyframes dustDrift {
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
}

/*
 * Two depths of nebula smoke, each drawn twice: once dark and translucent
 * (the ambient gas) and once pale and bright. The bright copy is only
 * revealed inside the beam's halo (.proshow-carousel .litField), so the smoke appears to be
 * lit where the beam passes through it. Both copies use the same texture and
 * the same drift, so they always line up exactly.
 * --lock (0..1) comes from the component: 1 when an artist is settled in the
 * centre, dipping while the carousel moves, so the beam "re-locks" on arrival.
 */
.proshow-carousel .smokeLayer {
  position: absolute;
  inset: -8%;
  -webkit-mask-size: cover;
  mask-size: cover;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  will-change: transform;
}
.proshow-carousel .smokeFar {
  -webkit-mask-image: url("/images/proshow/celestial-smoke-a.png");
  mask-image: url("/images/proshow/celestial-smoke-a.png");
  animation: driftFar 140s ease-in-out infinite alternate;
}
.proshow-carousel .smokeNear {
  -webkit-mask-image: url("/images/proshow/celestial-smoke-b.png");
  mask-image: url("/images/proshow/celestial-smoke-b.png");
  animation: driftNear 100s ease-in-out infinite alternate;
}
.proshow-carousel .darkFar  { background: rgb(80, 72, 188);  opacity: 0.38; }
.proshow-carousel .darkNear { background: rgb(118, 88, 214); opacity: 0.24; }
.proshow-carousel .litFar   { background: rgb(132, 160, 255); opacity: 0.62; }
.proshow-carousel .litNear  { background: rgb(196, 208, 255); opacity: 0.5;  }

.proshow-carousel .litField {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: calc(0.4 + 0.6 * var(--lock, 1));
  -webkit-mask-image: radial-gradient(
    ellipse calc(var(--c, 260px) * 0.85) calc(var(--beam-cy, 45dvh) * 1.05)
      at 50% calc(var(--beam-cy, 45dvh) * 0.62),
    #000 0%, rgba(0, 0, 0, 0.7) 35%, transparent 100%
  );
  mask-image: radial-gradient(
    ellipse calc(var(--c, 260px) * 0.85) calc(var(--beam-cy, 45dvh) * 1.05)
      at 50% calc(var(--beam-cy, 45dvh) * 0.62),
    #000 0%, rgba(0, 0, 0, 0.7) 35%, transparent 100%
  );
}

/* Glow around the active artist (sits in the carousel, under the artists).
   Subtle on purpose: it lights the edges without covering the artist. */
.proshow-carousel .aura {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 150%;
  height: 150%;
  margin: -75% 0 0 -75%;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
  background:
    radial-gradient(ellipse 34% 20% at 50% 21%, rgb(214 228 255 / calc(0.34 * var(--lock, 1))) 0%, transparent 100%),
    radial-gradient(closest-side, rgb(120 150 255 / calc(0.30 * var(--lock, 1))) 0%, rgb(110 90 240 / calc(0.16 * var(--lock, 1))) 38%, rgb(70 50 190 / calc(0.06 * var(--lock, 1))) 62%, transparent 78%);
  animation: auraBreathe 9s ease-in-out infinite;
}

/* A few soft, faint particles in front of everything, drifting up. */
.proshow-carousel .dust {
  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
}
.proshow-carousel .dustInner {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 200%;
  background-size: 100% 50%;
  background-repeat: repeat-y;
  background-image:
    radial-gradient(5px 5px at 23.1% 44.6%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(3px 3px at 31.9% 29.3%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(6px 6px at 38.8% 55.8%, rgba(214, 226, 255, 0.16) 0%, transparent 70%),
    radial-gradient(3px 3px at 35.5% 76.7%, rgba(214, 226, 255, 0.16) 0%, transparent 70%),
    radial-gradient(6px 6px at 63.9% 11.2%, rgba(214, 226, 255, 0.22) 0%, transparent 70%),
    radial-gradient(5px 5px at 38.1% 84.6%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(5px 5px at 65.7% 18.4%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(4px 4px at 7.7% 95.6%, rgba(214, 226, 255, 0.16) 0%, transparent 70%),
    radial-gradient(4px 4px at 92.0% 96.7%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(6px 6px at 7.6% 45.2%, rgba(214, 226, 255, 0.16) 0%, transparent 70%),
    radial-gradient(5px 5px at 60.5% 94.8%, rgba(214, 226, 255, 0.16) 0%, transparent 70%),
    radial-gradient(4px 4px at 16.2% 55.9%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(3px 3px at 73.3% 30.4%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(6px 6px at 42.5% 15.7%, rgba(214, 226, 255, 0.22) 0%, transparent 70%),
    radial-gradient(5px 5px at 86.4% 18.2%, rgba(214, 226, 255, 0.22) 0%, transparent 70%),
    radial-gradient(3px 3px at 85.7% 49.5%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(3px 3px at 29.0% 14.3%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(3px 3px at 76.3% 23.4%, rgba(214, 226, 255, 0.1) 0%, transparent 70%);
  animation: dustDrift 120s linear infinite;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .proshow-carousel .smokeFar, .proshow-carousel .smokeNear, .proshow-carousel .aura, .proshow-carousel .dustInner {
    animation: none;
  }
}
`;
const N = proshowArtists.length;

// The few standout stars with light rays. x/y are % of the page, size is the
// ray length in px, rot is each star's own angle, o is its brightness.
// Fixed values (not Math.random) so server and client render identically.
const SPARKLES = [
  { x: 70.7, y: 15.5, size: 30, rot: 84, o: 0.6 },
  { x: 4.8, y: 59.1, size: 21, rot: 72, o: 0.55 },
  { x: 20, y: 78, size: 32, rot: 58, o: 0.45 },
  { x: 88.2, y: 35.2, size: 23, rot: 47, o: 0.5 },
  { x: 10.1, y: 42.9, size: 27, rot: 40, o: 0.6 },
  { x: 92, y: 72, size: 20, rot: 0, o: 0.45 },
  { x: 15.1, y: 30.2, size: 28, rot: 31, o: 0.5 },
  { x: 80, y: 88, size: 30, rot: 22, o: 0.55 },
  { x: 34.2, y: 16.1, size: 20, rot: 14, o: 0.6 },
];

// Smaller versions of the same plus-ray star, scattered around the edges.
const MINI_SPARKLES = [
  { x: 9.9, y: 97.7, size: 14, rot: 31, o: 0.68 },
  { x: 22.4, y: 9.2, size: 15, rot: 63, o: 0.5 },
  { x: 30, y: 90, size: 11, rot: 12, o: 0.41 },
  { x: 52, y: 3, size: 16, rot: 40, o: 0.47 },
  { x: 27, y: 3.5, size: 13, rot: 36, o: 0.48 },
  { x: 59.1, y: 95, size: 16, rot: 29, o: 0.62 },
  { x: 78, y: 6, size: 11, rot: 70, o: 0.69 },
  { x: 2.7, y: 44.3, size: 12, rot: 24, o: 0.52 },
  { x: 26, y: 64, size: 16, rot: 37, o: 0.48 },
  { x: 4.3, y: 74.8, size: 13, rot: 25, o: 0.67 },
  { x: 62.8, y: 4.3, size: 14, rot: 73, o: 0.65 },
  { x: 40.4, y: 6.6, size: 16, rot: 6, o: 0.56 },
  { x: 9.9, y: 15.5, size: 9, rot: 7, o: 0.6 },
  { x: 1.6, y: 70.8, size: 11, rot: 62, o: 0.6 },
  { x: 11.4, y: 84, size: 15, rot: 17, o: 0.45 },
  { x: 84, y: 18.4, size: 9, rot: 68, o: 0.41 },
];

// Shortest signed distance from the active index, so the list loops forever.
function offsetOf(i, active) {
  let d = (((i - active) % N) + N) % N;
  if (d > N / 2) d -= N;
  return d;
}

export default function ProshowCarousel() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [coarse, setCoarse] = useState(false);

  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const pageRef = useRef(null);
  const orbitRef = useRef(null);
  const itemRefs = useRef([]);
  const playingRef = useRef(false);
  const activeRef = useRef(0);
  const posRef = useRef(0); // continuous scroll position, in artist units
  const tweenRef = useRef(0);
  const goalRef = useRef(0); // where the heavy follow is heading
  const followingRef = useRef(false); // true while the follow loop is running
  const velRef = useRef(0); // glide velocity (artists per ms)
  const gesture = useRef({ down: false, moved: false });

  const artist = proshowArtists[active];

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Single shared Audio instance for the whole page.
  useEffect(() => {
    const audio = new Audio();
    audio.loop = false; // plays the track once, then "ended" advances the artist
    audio.preload = "none";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  const startTrack = useCallback((index) => {
    const audio = audioRef.current;
    if (!audio) return;
    const src = proshowArtists[index].track.src;
    if (!audio.src.endsWith(src)) audio.src = src;
    audio
      .play()
      .then(() => {
        playingRef.current = true;
        setPlaying(true);
      })
      .catch(() => {
        playingRef.current = false;
        setPlaying(false);
      });
  }, []);

  const stopTrack = useCallback(() => {
    audioRef.current?.pause();
    playingRef.current = false;
    setPlaying(false);
  }, []);

  // Lay every circle out from the continuous position; CSS interpolates
  // size/opacity/offset from each circle's distance (--a) to the centre.
  const applyPos = useCallback(
    (p) => {
      posRef.current = p;
      // 1 when an artist sits exactly in the centre, easing to 0 halfway
      // between two; drives the beam/smoke/aura so they re-lock on arrival.
      const off = Math.min(1, Math.abs(p - Math.round(p)) * 2.2);
      pageRef.current?.style.setProperty("--lock", (1 - off * off * (3 - 2 * off)).toFixed(3));
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        let d = (((i - p) % N) + N) % N;
        if (d > N / 2) d -= N;
        const a = Math.abs(d);
        el.style.setProperty("--a", a.toFixed(3));
        el.style.setProperty("--sgn", d < 0 ? "-1" : "1");
        el.style.zIndex = String(Math.round(10 - a * 2));
        el.style.pointerEvents = a > 2.5 ? "none" : "";
      });
      const idx = ((Math.round(p) % N) + N) % N;
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
        // A new artist stops the current song; it only plays again on a hold.
        if (playingRef.current) stopTrack();
      }
    },
    [stopTrack],
  );

  useLayoutEffect(() => {
    applyPos(posRef.current);
  }, [applyPos]);

  // The beam comes from the top of the page and ends at the active artist,
  // so it needs to know where the centre of the carousel is.
  useLayoutEffect(() => {
    const page = pageRef.current;
    const orbit = orbitRef.current;
    if (!page || !orbit) return;
    const measure = () => {
      const p = page.getBoundingClientRect();
      const o = orbit.getBoundingClientRect();
      page.style.setProperty("--beam-cy", `${Math.round(o.top - p.top + o.height / 2)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(page);
    ro.observe(orbit.parentElement);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  const stopTween = () => {
    cancelAnimationFrame(tweenRef.current);
    tweenRef.current = 0;
    followingRef.current = false;
  };

  const animateTo = useCallback(
    (target, fast = false) => {
      stopTween();
      goalRef.current = target;
      const from = posRef.current;
      if (from === target) return;
      const dur = fast
        ? 300
        : Math.min(450 + Math.abs(target - from) * 100, 800);
      let t0;
      const tick = (now) => {
        t0 ??= now;
        const k = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
        applyPos(from + (target - from) * e);
        if (k < 1) tweenRef.current = requestAnimationFrame(tick);
        else tweenRef.current = 0;
      };
      tweenRef.current = requestAnimationFrame(tick);
    },
    [applyPos],
  );

  // Heavy follow: pos eases toward a goal set by the finger / trackpad.
  const followTo = useCallback(
    (goal) => {
      goalRef.current = goal;
      if (followingRef.current) return;
      stopTween(); // drop any keyboard/tap tween, then glide from where we are
      followingRef.current = true;
      velRef.current = 0;
      let last = performance.now();
      // Critically damped spring: velocity is carried across target changes,
      // so committing to the next artist never causes a sudden jolt.
      const w = 1 / SPRING_MS;
      const tick = (now) => {
        const dt = Math.min(now - last, 40);
        last = now;
        const x = posRef.current - goalRef.current;
        const v = velRef.current;
        const acc = -w * w * x - 2 * w * v;
        const nv = v + acc * dt;
        const nx = x + nv * dt;
        velRef.current = nv;
        const done = Math.abs(nx) < 0.001 && Math.abs(nv) < 0.0002;
        applyPos(done ? goalRef.current : goalRef.current + nx);
        if (done) stopTween();
        else tweenRef.current = requestAnimationFrame(tick);
      };
      tweenRef.current = requestAnimationFrame(tick);
    },
    [applyPos],
  );

  const step = useCallback(
    (dir) => animateTo(Math.round(goalRef.current) + dir),
    [animateTo],
  );

  const goTo = useCallback(
    (index) => {
      animateTo(
        Math.round(posRef.current) + offsetOf(index, activeRef.current),
      );
    },
    [animateTo],
  );

  // Auto-advance while idle: pauses during any drag/hold and while music is
  // playing, and restarts on the next interaction anywhere on the page.
  const idleTimerRef = useRef(0);
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(function tick() {
      if (!gesture.current.down && !playingRef.current) step(1);
      idleTimerRef.current = setTimeout(tick, IDLE_MS);
    }, IDLE_MS);
  }, [step]);

  useEffect(() => {
    resetIdle();
    window.addEventListener("pointerdown", resetIdle);
    window.addEventListener("wheel", resetIdle, { passive: true });
    window.addEventListener("keydown", resetIdle);
    return () => {
      clearTimeout(idleTimerRef.current);
      window.removeEventListener("pointerdown", resetIdle);
      window.removeEventListener("wheel", resetIdle);
      window.removeEventListener("keydown", resetIdle);
    };
  }, [resetIdle]);

  // Stops the current song and moves on to the next artist right away,
  // instead of waiting out the idle timer. Used both when the song is
  // stopped by holding again, and when a track finishes playing on its own.
  const stopAndAdvance = useCallback(() => {
    stopTrack();
    step(1);
    resetIdle();
  }, [stopTrack, step, resetIdle]);

  // A track that finishes playing on its own (not looping) advances too.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener("ended", stopAndAdvance);
    return () => audio.removeEventListener("ended", stopAndAdvance);
  }, [stopAndAdvance]);

  const onProgress = useCallback((p) => {
    progressRef.current?.style.setProperty("stroke-dashoffset", String(1 - p));
  }, []);

  const onComplete = useCallback(() => {
    if (playingRef.current) stopAndAdvance();
    else startTrack(activeRef.current);
  }, [startTrack, stopAndAdvance]);

  const { holding, start, cancel } = useHoldToPlay({
    duration: HOLD_MS,
    onProgress,
    onComplete,
  });

  // Arrow-key navigation.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "ArrowRight") step(1);
      else if (e.code === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  useEffect(() => {
    cancel();
  }, [active, cancel]);

  const stepPx = () => (orbitRef.current?.offsetWidth || 300) * 0.8;

  // Trackpad / mouse horizontal scrolling. Native listener so it can be
  // non-passive and stop the browser's swipe-back gesture.
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    let settle = 0;
    let dir = 0;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      cancel();
      dir = Math.sign(e.deltaX);
      if (!followingRef.current) goalRef.current = posRef.current;
      followTo(goalRef.current + (e.deltaX / stepPx()) * SENS);
      clearTimeout(settle);
      // Once scrolling pauses, commit in the scroll direction after a small
      // nudge (25%) rather than waiting for the halfway point.
      settle = setTimeout(() => {
        const p = goalRef.current;
        const target = dir > 0 ? Math.floor(p + 0.75) : Math.ceil(p - 0.75);
        followTo(target); // keep gliding from the current motion, no jump
      }, 40);
    };
    page.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      page.removeEventListener("wheel", onWheel);
      clearTimeout(settle);
    };
  }, [followTo, animateTo, cancel]);

  useEffect(() => () => stopTween(), []);

  // Pointer: drag scrolls the carousel (touch and mouse), a flick carries on
  // with momentum, press-and-hold on the centre plays.
  const onPointerDown = (e, isCenter, index) => {
    if (!e.isPrimary || gesture.current.down) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    stopTween();
    goalRef.current = posRef.current;
    gesture.current = {
      index,
      x: e.clientX,
      y: e.clientY,
      startPos: posRef.current,
      vx: 0,
      lastX: e.clientX,
      lastT: e.timeStamp,
      moved: false,
      down: true,
    };
    if (isCenter) start();
  };
  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g.down) return;
    const dx = e.clientX - g.x;
    if (!g.moved && Math.abs(dx) < 8 && Math.abs(e.clientY - g.y) < 8) return;
    if (!g.moved) cancel();
    g.moved = true;
    const now = e.timeStamp;
    if (now > g.lastT)
      g.vx = 0.7 * g.vx + 0.3 * ((e.clientX - g.lastX) / (now - g.lastT));
    g.lastX = e.clientX;
    g.lastT = now;
    followTo(g.startPos - (dx / stepPx()) * SENS);
  };
  const onPointerUp = () => {
    const g = gesture.current;
    if (!g.down) return;
    g.down = false;
    cancel();
    if (!g.moved) {
      // plain tap on a side artist brings it to the centre
      if (g.index !== undefined && g.index !== activeRef.current) goTo(g.index);
      return;
    }
    // project the flick forward a little, then snap to the nearest artist
    followTo(Math.round(goalRef.current - ((g.vx * 160) / stepPx()) * SENS));
  };

  return (
    <main
      ref={pageRef}
      className="proshow-carousel relative grid h-dvh w-full touch-none select-none grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] items-center justify-items-center overflow-hidden overscroll-none bg-[radial-gradient(ellipse_at_50%_45%,#100e18_0%,#0a0912_55%,#050408_100%)] px-4 pt-[clamp(14px,3dvh,32px)] pb-[clamp(28px,7dvh,64px)] text-white [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [--c:clamp(180px,min(38dvh,36vw),470px)] [--o1:0.6] [--o2:0.4] [--x1:0.8] [--x2:1.32] [--x3:1.7] max-lg:[--c:clamp(170px,min(40dvh,52vw),420px)] max-lg:[--x1:0.84] max-lg:[--x2:1.38] max-sm:pb-[92px] max-sm:[--c:min(58vw,40dvh)] max-sm:[--o2:0] max-sm:[--x1:0.8] max-sm:[--x2:1.4]"
    >
      <style>{carouselStyles}</style>
      <div
        className={`twinkle pointer-events-none absolute inset-0`}
        aria-hidden="true"
      >
        <div className="bgStarsFine twinkleSlow absolute inset-0" />
        <div className={`bgStars absolute inset-0`} />
        {[...SPARKLES, ...MINI_SPARKLES].map((s, i) => (
          <span
            key={i}
            className={`sparkle absolute`}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.o,
              transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
            }}
          />
        ))}
      </div>

      {/* Celestial smoke: dark ambient gas at two depths, plus bright copies
          that are only revealed inside the beam's halo (so the beam lights it). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="smokeLayer smokeFar darkFar" />
        <div className="smokeLayer smokeNear darkNear" />
        <div className="litField">
          <div className="smokeLayer smokeFar litFar" />
          <div className="smokeLayer smokeNear litNear" />
        </div>
      </div>

      <span className="absolute top-[clamp(14px,3dvh,30px)] left-[clamp(16px,2.4vw,32px)] z-2 font-(family-name:--font-bebas) text-[clamp(16px,2.4vw,30px)] tracking-[0.45em] max-sm:text-[14px] max-sm:tracking-[0.3em]">
        TATHVA ‘26
      </span>
      <span className="absolute top-[clamp(14px,3dvh,30px)] right-[clamp(8px,2.4vw,32px)] -mr-[0.45em] z-2 font-(family-name:--font-bebas) text-[clamp(16px,2.4vw,30px)] tracking-[0.45em] max-sm:text-[14px] max-sm:tracking-[0.3em]">
        PRO-SHOW
      </span>

      <h1
        key={artist.id}
        className={`fadeUp z-2 mt-[clamp(22px,4dvh,44px)] text-center font-(family-name:--font-space) text-[clamp(40px,min(9vw,11dvh),104px)] leading-none font-bold tracking-[-0.01em]`}
      >
        {artist.name}
      </h1>

      <section
        className="relative z-1 grid h-full min-h-0 w-full touch-none place-items-center py-[clamp(10px,2.5dvh,28px)]"
        aria-roledescription="carousel"
        aria-label="Proshow artists"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div className="relative h-(--c) w-(--c)" ref={orbitRef}>
          <div
            className="pointer-events-none absolute inset-0 z-0"
            aria-hidden="true"
          >
            {Array.from({ length: RING_COUNT }, (_, i) => (
              <span
                key={i}
                className={`ringPulse absolute top-1/2 left-1/2 aspect-square w-[calc(var(--c)*(1+var(--k)*0.62))] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(190,170,255,0.09)]`}
                style={{ "--k": i + 1, animationDelay: `${i * -1.2}s` }}
              />
            ))}
          </div>
          <div className="aura" aria-hidden="true" />
          <svg
            className="pointer-events-none absolute -inset-[6.5%] z-6 h-[113%] w-[113%] overflow-visible"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              className="fill-none stroke-white opacity-90 [stroke-width:0.35]"
              cx="50"
              cy="50"
              r="49.4"
            />
            <circle
              ref={progressRef}
              className={`origin-center -rotate-90 fill-none stroke-[#c9b6ff] drop-shadow-[0_0_3px_#a78bfa] [stroke-linecap:round] [stroke-width:1.6] ${
                holding ? "opacity-100" : "opacity-0"
              }`}
              cx="50"
              cy="50"
              r="49.4"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset="1"
            />
          </svg>

          {proshowArtists.map((a, i) => {
            const o = offsetOf(i, active);
            const isCenter = o === 0;
            return (
              <button
                key={a.id}
                type="button"
                tabIndex={isCenter ? 0 : -1}
                className={`item absolute inset-0 cursor-grab touch-none overflow-hidden rounded-full border-0 bg-[#120b22] p-0 outline-none [-webkit-tap-highlight-color:transparent] will-change-[transform,opacity] active:cursor-grabbing`}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                aria-label={
                  isCenter ? `${a.name}, hold to play` : `Show ${a.name}`
                }
                aria-current={isCenter}
                aria-hidden={Math.abs(o) > 2}
                onPointerDown={(e) => onPointerDown(e, isCenter, i)}
                onClick={(e) => {
                  // detail === 0 is a keyboard activation (Enter)
                  if (!isCenter && e.detail === 0) goTo(i);
                }}
                onKeyDown={(e) => {
                  if (e.code === "Space") e.preventDefault();
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  className="pointer-events-none block size-full object-cover"
                  src={a.image}
                  alt=""
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </section>

      <div
        className={`hintPulse mt-[clamp(10px,2dvh,22px)] flex items-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-5 py-1.5 text-white/85 shadow-[0_0_18px_-4px_rgba(201,182,255,0.5)]`}
        role="note"
        aria-label={coarse ? "Hold the artist to play" : "Hold space bar to play"}
      >
        {coarse && (
          <svg
            className={`keyPress size-4 shrink-0`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M4 21c1.6-3.4 4.6-5 8-5s6.4 1.6 8 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
        <span className="text-[clamp(11px,1.2vw,16px)] tracking-[0.04em]" aria-hidden="true">
          {coarse ? "HOLD THE ARTIST TO PLAY" : "HOLD SPACE BAR TO PLAY"}
        </span>
      </div>

      <p
        key={`d-${artist.id}`}
        className={`fadeUp -mr-[0.4em] mt-[clamp(8px,1.6dvh,18px)] text-center font-(family-name:--font-bebas) text-[clamp(20px,3vw,34px)] tracking-[0.4em] uppercase`}
      >
        {artist.date}
      </p>
      <p
        key={`p-${artist.id}`}
        className={`fadeUp mt-[clamp(8px,1.6dvh,18px)] line-clamp-4 max-w-[min(640px,100%)] overflow-hidden text-justify text-[clamp(12px,1.35vw,17px)] leading-[1.55] text-[#ece8f7] [text-align-last:center] max-sm:line-clamp-3 max-sm:text-center [@media(max-height:520px)]:hidden!`}
      >
        {artist.description}
      </p>

      <div className="dust" aria-hidden="true">
        <div className="dustInner" />
      </div>

      <div
        className={`pointer-events-none absolute right-[clamp(12px,2.4vw,32px)] bottom-[clamp(12px,3dvh,32px)] z-7 flex items-center gap-3 rounded-full bg-white/[0.07] py-2 pr-[18px] pl-2 backdrop-blur-[10px] transition-[opacity,translate] duration-400 max-sm:right-1/2 max-sm:bottom-3.5 max-sm:translate-x-1/2 ${
          playing ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <img
          src={artist.image}
          alt=""
          className="size-11 rounded-full object-cover"
          draggable={false}
        />
        <div className="flex flex-col leading-[1.15]">
          <span className="text-[8px] tracking-[0.08em] text-[#ddd]">
            NOW PLAYING
          </span>
          <span className="text-base font-bold">{artist.track.title}</span>
          <span className="text-[9px] text-[#ccc]">{artist.track.artist}</span>
        </div>
        <span
          className="ml-1 inline-flex h-3.5 items-end gap-0.5"
          aria-hidden="true"
        >
          {[0, -0.3, -0.6].map((delay) => (
            <i
              key={delay}
              className={`eq h-full w-[3px] origin-bottom rounded-xs bg-[#c9b6ff]`}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </span>
      </div>
    </main>
  );
}
