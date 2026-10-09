"use client";

import { useEffect, useRef } from "react";
import { DRAGON_FRAMES, DRAGON_FPS, DRAGON_SIZE } from "@/pageComponents/GPC/gpcConfig";

// Reports whether `element` is in the viewport, not hidden by CSS, and the tab is showing.
function watchVisible(element, onChange) {
  let inViewport = false;
  let visible = null;
  let timer = 0;

  const shownByCss = () =>
    typeof element.checkVisibility !== "function" ||
    element.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true });

  const check = () => {
    const now = inViewport && !document.hidden && shownByCss();
    if (now === visible) return;
    visible = now;
    onChange(now);
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      inViewport = entry.isIntersecting;
      window.clearInterval(timer);
      if (inViewport) timer = window.setInterval(check, 300);
      check();
    },
    { rootMargin: "10% 0px 10% 0px" }
  );
  observer.observe(element);
  document.addEventListener("visibilitychange", check);

  return () => {
    observer.disconnect();
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", check);
  };
}

// Plays a sequence of frame images on a canvas as a loop.
function startDragon(canvas, { frames, fps = 60 }) {
  let active = true;
  let animationId = 0;
  let stopWatching = null;

  const loadImage = (src) =>
    new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        image.decode?.().catch(() => {});
        resolve(image);
      };
      image.onerror = () => resolve(image);
      image.src = src;
    });

  Promise.all(frames.map(loadImage)).then((loaded) => {
    if (!active) return;
    const context = canvas.getContext("2d");
    // A frame that failed to load can't be drawn (drawImage throws on it, which would stop the
    // loop for good), so its place is taken by the frame before it and the loop keeps its length.
    const arrived = (image) => image.naturalWidth > 0;
    let standIn = loaded.find(arrived);
    if (!context || !standIn) return;
    const images = [];
    for (const image of loaded) {
      if (arrived(image)) standIn = image;
      images.push(standIn);
    }

    let frameIndex = 0;
    let lastTime = 0;
    let elapsed = 0;
    const frameDuration = 1000 / fps;

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(images[frameIndex], 0, 0, canvas.width, canvas.height);
    };

    const animate = (now) => {
      if (!active) return;
      if (lastTime === 0) lastTime = now;
      elapsed += now - lastTime;
      lastTime = now;

      const framesToAdvance = Math.floor(elapsed / frameDuration);
      if (framesToAdvance > 0) {
        frameIndex = (frameIndex + framesToAdvance) % images.length;
        elapsed -= framesToAdvance * frameDuration;
        draw();
      }

      animationId = requestAnimationFrame(animate);
    };

    draw();
    // Only burn CPU while the canvas can actually be seen.
    stopWatching = watchVisible(canvas, (visible) => {
      cancelAnimationFrame(animationId);
      animationId = 0;
      if (!visible) return;
      lastTime = 0;
      animationId = requestAnimationFrame(animate);
    });
  });

  return function stop() {
    active = false;
    stopWatching?.();
    cancelAnimationFrame(animationId);
  };
}

/**
 * The dragon: loops DRAGON_FRAMES at DRAGON_FPS using a highly optimized canvas flipbook. 
 * The canvas maintains the image's own proportions.
 */
export default function DragonLoop({ className = "", style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || DRAGON_FRAMES.length < 2) return undefined;

    // Starts the canvas loop and returns a cleanup function
    const stopAnimation = startDragon(canvas, { 
      frames: DRAGON_FRAMES, 
      fps: DRAGON_FPS || 60 
    });

    // Cleanup: stops the animation and observers when the component unmounts
    return () => {
      stopAnimation();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      // Preserve the aspect ratio and existing style props
      style={{ aspectRatio: `${DRAGON_SIZE.width} / ${DRAGON_SIZE.height}`, ...style }}
      // Sets the internal drawing resolution of the canvas
      width={DRAGON_SIZE.width}
      height={DRAGON_SIZE.height}
    />
  );
}