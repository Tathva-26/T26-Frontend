"use client";

import dynamic from "next/dynamic";

import { Component, useCallback, useEffect, useRef, useState } from "react";
import styles from "./Expo.module.css";

const CrystalScene = dynamic(() => import("./CrystalScene"), { ssr: false });

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Crystal3D({ journey, onProject, transition = false }) {
  const wrapper = useRef(null);
  const [visible, setVisible] = useState(false);

  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [awake, setAwake] = useState(true);
  const [generation, setGeneration] = useState(0);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);
  const onLost = useCallback(() => setReady(false), []);
  const onRestored = useCallback(() => { setReady(false); setGeneration(value => value + 1); }, []);
  const retry = () => { setFailed(false); setReady(false); setGeneration(value => value + 1); };

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(query.matches);
    const visibility = () => setAwake(!document.hidden);
    motion(); visibility();
    query.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { rootMargin: "80px" });
    observer.observe(wrapper.current);
    return () => {
      observer.disconnect();

      query.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  // Mount immediately to prepare assets and shaders before Expo enters.
  // Once ready, offscreen rendering pauses; loading stays in live 3D.

  return (
    <div ref={wrapper} className={`${styles.crystal} ${ready && !failed ? styles.ready : ""}`} data-crystal-state={failed ? "error" : ready ? "ready" : "loading"}>
      <span id="crystal-instructions" className={styles.hint}>Move your pointer or gently drag the crystal to tilt it. Click or tap the crystal to explore Expo. Trace its fractures to wake the robot. Vertical swipes scroll the page. When focused, arrows tilt, Enter or Space activates, and Escape resets.</span>
      {failed && <button className={styles.retry} onClick={retry}>Retry 3D crystal</button>}
      {!failed && (
        <div className={styles.canvas}>
          <SceneBoundary key={generation} onFailure={onFailure}>
            <CrystalScene reduced={reduced} active={awake && (visible || !ready)} onReady={onReady} onFailure={onFailure} onLost={onLost} onRestored={onRestored} journey={journey} onProject={onProject} transition={transition} />
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}
