"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useCallback, useEffect, useRef, useState } from "react";
import styles from "./Expo.module.css";
import { canRevealCrystal } from './expoRenderBudget.mjs';
import { useExpoDetails } from './ExpoDetails';

const CrystalScene = dynamic(() => import("./CrystalScene"), { ssr: false });

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Crystal3D({ journey, onProject, preload = false }) {
  const wrapper = useRef(null);
  const [visible, setVisible] = useState(false);
  const [requested, setRequested] = useState(preload);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [awake, setAwake] = useState(true);
  const [admitted, setAdmitted] = useState(false);
  const details = useExpoDetails();
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(query.matches);
    const visibility = () => setAwake(!document.hidden);
    motion(); visibility();
    query.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting) setRequested(true);
    }, { rootMargin: "80px" });
    observer.observe(wrapper.current);
    const loader = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setRequested(true);
    }, { rootMargin: '1200px 0px' });
    loader.observe(wrapper.current);
    return () => {
      observer.disconnect();
      loader.disconnect();
      query.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (!ready || admitted || failed || reduced) return;
    let frame;
    const reveal = () => {
      if (canRevealCrystal(journey?.current, details?.progress.current.state)) setAdmitted(true);
      else frame = requestAnimationFrame(reveal);
    };
    reveal();
    return () => cancelAnimationFrame(frame);
  }, [ready, admitted, failed, reduced, journey, details]);

  // Keep the illustration visible while loading, without treating a slow
  // download/background tab as a fatal error. Actual loader/context failures
  // still select the fallback through SceneBoundary and ContextEvents.

  return (
    <div ref={wrapper} className={`${styles.crystal} ${admitted && !failed && !reduced ? styles.ready : ""}`} data-crystal-state={failed ? "fallback" : reduced ? "reduced-motion" : admitted ? "ready" : "loading"}>
      <Image data-expo-fallback-image className={styles.fallback} src="/images/expo/crystal-figma.webp" alt="A cyan Tathva robot glowing inside a dark, faceted crystal" width={492} height={507} priority unoptimized />
      <span id="crystal-instructions" className={styles.hint}>Move your pointer or gently drag the crystal to tilt it. Click or tap the crystal to explore Expo. Trace its fractures to wake the robot. Vertical swipes scroll the page. When focused, arrows tilt, Enter or Space activates, and Escape resets.</span>
      {!failed && !reduced && requested && (
        <div className={styles.canvas}>
          <SceneBoundary onFailure={onFailure}>
            <CrystalScene active={awake && (visible || !ready)} onReady={onReady} onFailure={onFailure} journey={journey} onProject={onProject} />
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}
