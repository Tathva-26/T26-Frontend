"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./WheelsExperience.module.css";

const START_FRAME = 105;
const END_FRAME = 240;
const FRAME_COUNT = END_FRAME - START_FRAME + 1;
const ASPECT_RATIO = 16 / 9;

const getFramePath = (index) => {
  const frameNum = (START_FRAME + index).toString().padStart(3, "0");
  return `/wheels/frames/ezgif-frame-${frameNum}.webp`;
};

export default function WheelsExperience() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const imagesRef = useRef([]);
  const targetFrameRef = useRef(0);
  const currentFrameRef = useRef(0);
  const lastDrawnFrameRef = useRef(-1);

  const wheelsSceneRef = useRef(null);
  const wheelsLeftRef = useRef(null);
  const wheelsRightRef = useRef(null);
  const wheelsTickerRef = useRef(null);

  const tvScreenRef = useRef(null);
  const wheelsTextRef = useRef(null);

  const isScrollCompleteRef = useRef(false);
  const canTriggerTvRef = useRef(false);
  const tvTransitionStartedRef = useRef(false);
  const tvTimelineRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // The host site intentionally locks its document scroll. This route restores
    // scroll only while mounted, then puts the shared shell back exactly as found.
    const documentStyles = {
      htmlHeight: document.documentElement.style.height,
      htmlOverflow: document.documentElement.style.overflow,
      htmlOverflowX: document.documentElement.style.overflowX,
      htmlOverflowY: document.documentElement.style.overflowY,
      bodyHeight: document.body.style.height,
      bodyMinHeight: document.body.style.minHeight,
      bodyOverflow: document.body.style.overflow,
      bodyOverflowX: document.body.style.overflowX,
      bodyOverflowY: document.body.style.overflowY,
    };
    document.documentElement.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.overflowX = "clip";
    document.documentElement.style.overflowY = "auto";
    document.body.style.height = "auto";
    document.body.style.minHeight = "100%";
    document.body.style.overflow = "visible";
    document.body.style.overflowX = "clip";
    document.body.style.overflowY = "visible";

    const coverRef = { x: 0, y: 0, w: 0, h: 0, dpr: 1, isMobile: false };
    const timeoutIds = [];
    let isActive = true;

    const updateCanvasDimensions = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth <= 768 || "ontouchstart" in window;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2);
      const targetWidth = Math.max(1, Math.floor(viewportWidth * dpr));
      const targetHeight = Math.max(1, Math.floor(viewportHeight * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      let destinationWidth = targetWidth;
      let destinationHeight = targetWidth / ASPECT_RATIO;
      if (destinationHeight < targetHeight) {
        destinationHeight = targetHeight;
        destinationWidth = targetHeight * ASPECT_RATIO;
      }

      coverRef.x = Math.round((targetWidth - destinationWidth) / 2);
      coverRef.y = Math.round((targetHeight - destinationHeight) / 2);
      coverRef.w = Math.round(destinationWidth);
      coverRef.h = Math.round(destinationHeight);
      coverRef.dpr = dpr;
      coverRef.isMobile = isMobile;

      const context = canvas.getContext("2d");
      if (context) {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = isMobile ? "low" : "medium";
      }
    };

    updateCanvasDimensions();

    let loadedCount = 0;
    const images = [];
    const renderFrame = (index) => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const context = canvas.getContext("2d");
      if (!context) return false;
      const image = imagesRef.current[index];
      if (!image || !image.complete || image.naturalWidth === 0) return false;
      if (coverRef.w <= 0 || coverRef.h <= 0) updateCanvasDimensions();

      const scrollShiftX = coverRef.isMobile
        ? Math.round(index * 2 * coverRef.dpr)
        : 0;
      context.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        coverRef.x - scrollShiftX,
        coverRef.y,
        coverRef.w,
        coverRef.h,
      );
      return true;
    };

    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const image = new Image();
      image.src = getFramePath(index);
      const handleImageLoad = (imageIndex) => {
        if (!isActive) return;
        loadedCount += 1;
        setLoadProgress(Math.floor((loadedCount / FRAME_COUNT) * 100));

        const currentTarget = Math.min(
          FRAME_COUNT - 1,
          Math.max(0, Math.round(currentFrameRef.current)),
        );
        if (imageIndex === currentTarget || lastDrawnFrameRef.current === -1) {
          if (renderFrame(imageIndex)) lastDrawnFrameRef.current = imageIndex;
        }
        if (loadedCount === FRAME_COUNT) {
          setIsLoaded(true);
          ScrollTrigger.refresh();
        }
      };
      image.onload = () => handleImageLoad(index);
      image.onerror = () => handleImageLoad(index);
      images.push(image);
    }
    imagesRef.current = images;

    const updateCinematicText = (progress) => {
      if (
        !wheelsSceneRef.current ||
        !wheelsLeftRef.current ||
        !wheelsRightRef.current ||
        !wheelsTickerRef.current
      ) {
        return;
      }

      let opacity = 0;
      let leftY = 0;
      let rightY = 0;
      let tickerY = 0;
      if (progress < 0.35) {
        wheelsSceneRef.current.style.visibility = "visible";
        opacity = progress <= 0.12 ? 1 : Math.max(0, 1 - (progress - 0.12) / 0.2);
        const factor = progress / 0.32;
        leftY = -factor * 40;
        rightY = -factor * 30;
        tickerY = factor * 25;
      } else {
        wheelsSceneRef.current.style.visibility = "hidden";
      }

      wheelsSceneRef.current.style.opacity = opacity.toFixed(3);
      wheelsLeftRef.current.style.transform = `translate3d(0, ${leftY.toFixed(1)}px, 0)`;
      wheelsRightRef.current.style.transform = `translate3d(0, ${rightY.toFixed(1)}px, 0)`;
      wheelsTickerRef.current.style.transform = `translate3d(0, ${tickerY.toFixed(1)}px, 0)`;
    };

    const triggerTvTransition = () => {
      if (tvTransitionStartedRef.current) return;
      tvTransitionStartedRef.current = true;

      const televisionRect = tvScreenRef.current?.getBoundingClientRect();
      const canvasWrapper = canvasWrapperRef.current;
      if (!televisionRect || !canvasWrapper || !wheelsTextRef.current) return;

      const canvasRect = canvasWrapper.getBoundingClientRect();
      const moveX = televisionRect.left + televisionRect.width / 2 - (canvasRect.left + canvasRect.width / 2);
      const moveY = televisionRect.top + televisionRect.height / 2 - (canvasRect.top + canvasRect.height / 2);
      const targetScale = Math.min(
        televisionRect.width / canvasRect.width,
        televisionRect.height / canvasRect.height,
      ) * 0.95;

      tvTimelineRef.current?.kill();
      const timeline = gsap.timeline({
        onReverseComplete: () => {
          tvTransitionStartedRef.current = false;
          gsap.set(canvasWrapper, { clearProps: "transform,opacity" });
          gsap.set(wheelsTextRef.current, { opacity: 0, scale: 0.85 });
          canTriggerTvRef.current = false;
        },
      });
      timeline.to(canvasWrapper, {
        x: moveX,
        y: moveY,
        scale: targetScale,
        opacity: 0,
        duration: 2.2,
        ease: "power2.out",
      });
      timeline.to(
        wheelsTextRef.current,
        { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" },
        "-=0.8",
      );
      tvTimelineRef.current = timeline;
    };

    const reverseTvTransition = () => {
      if (tvTransitionStartedRef.current) tvTimelineRef.current?.reverse();
    };

    let animationFrameId;
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const lerpRate = isTouchDevice ? 0.2 : 0.08;
    const renderLoop = () => {
      const difference = targetFrameRef.current - currentFrameRef.current;
      currentFrameRef.current = Math.abs(difference) > 0.001
        ? currentFrameRef.current + difference * lerpRate
        : targetFrameRef.current;

      const frameToDraw = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(currentFrameRef.current)),
      );
      if (frameToDraw !== lastDrawnFrameRef.current || lastDrawnFrameRef.current === -1) {
        if (renderFrame(frameToDraw)) {
          lastDrawnFrameRef.current = frameToDraw;
        } else {
          for (let offset = 1; offset < FRAME_COUNT; offset += 1) {
            const previous = frameToDraw - offset;
            if (previous >= 0 && renderFrame(previous)) break;
            const next = frameToDraw + offset;
            if (next < FRAME_COUNT && renderFrame(next)) break;
          }
        }
      }

      if (currentFrameRef.current >= FRAME_COUNT - 1.2 && targetFrameRef.current >= FRAME_COUNT - 1.2) {
        if (!isScrollCompleteRef.current) {
          isScrollCompleteRef.current = true;
          timeoutIds.push(window.setTimeout(() => { canTriggerTvRef.current = true; }, 250));
        }
      }
      updateCinematicText(currentFrameRef.current / (FRAME_COUNT - 1));
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    animationFrameId = requestAnimationFrame(renderLoop);
    updateCinematicText(0);

    let lastViewportWidth = window.innerWidth;
    let lastViewportHeight = window.innerHeight;
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth <= 768 || "ontouchstart" in window;
      if (isMobile && viewportWidth === lastViewportWidth && Math.abs(viewportHeight - lastViewportHeight) < 75) return;
      lastViewportWidth = viewportWidth;
      lastViewportHeight = viewportHeight;
      updateCanvasDimensions();
      renderFrame(lastDrawnFrameRef.current >= 0 ? lastDrawnFrameRef.current : 0);
    };
    window.addEventListener("resize", handleResize);

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0,
      onUpdate: (self) => {
        if (tvTransitionStartedRef.current) {
          targetFrameRef.current = FRAME_COUNT - 1;
          if (self.progress < 0.985) reverseTvTransition();
          return;
        }
        targetFrameRef.current = self.progress * (FRAME_COUNT - 1);
        if (self.progress >= 0.995) {
          if (!isScrollCompleteRef.current) {
            isScrollCompleteRef.current = true;
            timeoutIds.push(window.setTimeout(() => { canTriggerTvRef.current = true; }, 250));
          }
        } else if (self.progress < 0.96) {
          isScrollCompleteRef.current = false;
          canTriggerTvRef.current = false;
        }
      },
    });

    const onNextScroll = () => {
      if (isScrollCompleteRef.current && canTriggerTvRef.current && !tvTransitionStartedRef.current) triggerTvTransition();
    };
    const handleWheel = (event) => {
      if (event.deltaY > 5) onNextScroll();
      else if (event.deltaY < -5) reverseTvTransition();
    };
    let touchStartY = 0;
    let touchHandled = false;
    const handleTouchStart = (event) => {
      if (event.touches.length > 0) {
        touchStartY = event.touches[0].clientY;
        touchHandled = false;
      }
    };
    const handleTouchMove = (event) => {
      if (event.touches.length === 0 || touchHandled) return;
      const deltaY = touchStartY - event.touches[0].clientY;
      if (deltaY > 25 && isScrollCompleteRef.current && canTriggerTvRef.current && !tvTransitionStartedRef.current) {
        touchHandled = true;
        onNextScroll();
      } else if (deltaY < -25 && tvTransitionStartedRef.current) {
        touchHandled = true;
        reverseTvTransition();
      }
    };
    const handleKeyDown = (event) => {
      if (["ArrowDown", "PageDown", " "].includes(event.key)) onNextScroll();
      else if (["ArrowUp", "PageUp"].includes(event.key)) reverseTvTransition();
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      images.forEach((image) => { image.onload = null; image.onerror = null; });
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      trigger.kill();
      tvTimelineRef.current?.kill();
      Object.assign(document.documentElement.style, {
        height: documentStyles.htmlHeight,
        overflow: documentStyles.htmlOverflow,
        overflowX: documentStyles.htmlOverflowX,
        overflowY: documentStyles.htmlOverflowY,
      });
      Object.assign(document.body.style, {
        height: documentStyles.bodyHeight,
        minHeight: documentStyles.bodyMinHeight,
        overflow: documentStyles.bodyOverflow,
        overflowX: documentStyles.bodyOverflowX,
        overflowY: documentStyles.bodyOverflowY,
      });
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.viewport}>
        <div className={styles.tv}>
          <img src="/wheels/tv.png" alt="TV" className={styles.tvImage} />
          <div ref={tvScreenRef} className={styles.tvScreen}>
            <span ref={wheelsTextRef} className={styles.tvTitle}>Wheels</span>
          </div>
        </div>

        <div ref={canvasWrapperRef} className={styles.canvasWrapper}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>

        <div className={styles.overlay}>
          <div ref={wheelsSceneRef} className={styles.scene}>
            <div className={styles.topRow}>
              <div ref={wheelsLeftRef} className={styles.leftTitle}>
                <img src="/wheels/Wheels.svg" alt="Wheels" className={styles.headingImage} />
                <img src="/wheels/Auto Show.svg" alt="Auto Show" className={styles.subtitleImage} />
              </div>
              <div ref={wheelsRightRef} className={styles.rightInfo}>
                <p><span className={styles.infoLabel}>Prototype</span><span className={styles.prototypeColon}>:</span><br />1981 DeLorean</p>
                <p><span className={styles.infoLabel}>Status:</span> Operational</p>
                <p><span className={styles.infoLabel}>Power Source:</span> Mr. Fusion™ Reactor</p>
                <p><span className={styles.infoLabel}>Objective:</span><br />Bend the continuum. Revisit the impossible.</p>
                <p><span className={styles.infoLabel}>Function:</span> Temporal displacement via flux synchronization</p>
              </div>
            </div>
            <div ref={wheelsTickerRef} className={styles.tickerContainer}>
              <div className={styles.tickerTrack}>
                {[0, 1, 2, 3].map((index) => (
                  <span key={index} className={styles.tickerContent}>
                    <span className={styles.tickerBullet}>•</span> 09 OCT 2026 11:00 AM <span className={styles.tickerBullet}>•</span> RALLIES <span className={styles.tickerBullet}>•</span> CAR REVEALS <span className={styles.tickerBullet}>•</span> STUNTS&nbsp;&nbsp;
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {!isLoaded && (
          <div className={styles.loadingBar}>
            <div className={styles.loadingProgress} style={{ width: `${loadProgress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
