"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useCallback, useEffect, useRef, useState } from "react";
import styles from "./Expo.module.css";

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
    return () => {
      observer.disconnect();
      query.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  // A stalled GPU/texture load also leaves the illustration visible.
  useEffect(() => {
    if (!requested || ready || failed || reduced) return;
    const timeout = window.setTimeout(onFailure, 20000);
    return () => window.clearTimeout(timeout);
  }, [requested, ready, failed, reduced, onFailure]);

  return (
    <div ref={wrapper} className={`${styles.crystal} ${ready && !failed && !reduced ? styles.ready : ""}`} data-crystal-state={failed ? "fallback" : reduced ? "reduced-motion" : ready ? "ready" : "loading"}>
      <Image className={styles.fallback} src="/images/expo/crystal-fallback.png" alt="A cyan Tathva robot glowing inside a dark, faceted crystal" width={534} height={703} priority unoptimized />
      <span id="crystal-instructions" className={styles.hint}>Move your pointer or gently drag the crystal to tilt it. Trace its fractures or tap three times to wake the robot. Vertical swipes scroll the page. When focused, arrows tilt, Enter or Space activates, and Escape resets.</span>
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
