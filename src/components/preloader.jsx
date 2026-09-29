"use client";

import React, { useEffect, useRef, useState } from "react";

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const canvasRef = useRef(null);
  const outerRingRef = useRef(null);

  // -------------------------------------------------------------
  // 1. STARFIELD CANVAS ANIMATION
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width, height, centerX, centerY;
    const starCount = 180;
    const stars = [];

    const resizeCanvas = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      centerX = width / 2;
      centerY = height / 2;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    class Star {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = (Math.random() - 0.5) * width * 2;
        this.y = (Math.random() - 0.5) * height * 2;
        this.z = initial ? Math.random() * width : width;
        this.pz = this.z;
      }

      update(speed) {
        this.pz = this.z;
        this.z -= speed;

        if (this.z <= 1) {
          this.reset(false);
        }
      }

      draw() {
        const sx = (this.x / this.z) * (width * 0.5) + centerX;
        const sy = (this.y / this.z) * (height * 0.5) + centerY;

        const px = (this.x / this.pz) * (width * 0.5) + centerX;
        const py = (this.y / this.pz) * (height * 0.5) + centerY;

        if (sx < 0 || sx > width || sy < 0 || sy > height) return;

        const alpha = Math.min(1, (1 - this.z / width) * 1.5);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = Math.max(1, (1 - this.z / width) * 2.5);
        ctx.stroke();
      }
    }

    for (let i = 0; i < starCount; i++) {
      stars.push(new Star());
    }

    let prevVector = null;
    let currentSpeed = 0.8;

    const animateStarfield = () => {
      ctx.fillStyle = "rgba(3, 3, 3, 0.4)";
      ctx.fillRect(0, 0, width, height);

      let velocity = 0;

      if (outerRingRef.current) {
        const computedStyle = window.getComputedStyle(outerRingRef.current);
        const transform = computedStyle.transform || computedStyle.webkitTransform;

        if (transform && transform !== "none") {
          const matrixMatch = transform.match(/matrix(?:3d)?\((.+)\)/);
          if (matrixMatch) {
            const matrixValues = matrixMatch[1].split(",").map(parseFloat);

            let m11, m12, m21, m22;
            if (matrixValues.length === 16) {
              m11 = matrixValues[0];
              m12 = matrixValues[1];
              m21 = matrixValues[4];
              m22 = matrixValues[5];
            } else {
              m11 = matrixValues[0];
              m12 = matrixValues[1];
              m21 = matrixValues[2];
              m22 = matrixValues[3];
            }

            if (prevVector !== null) {
              const d1 = Math.abs(m11 - prevVector.m11);
              const d2 = Math.abs(m12 - prevVector.m12);
              const d3 = Math.abs(m21 - prevVector.m21);
              const d4 = Math.abs(m22 - prevVector.m22);
              velocity = (d1 + d2 + d3 + d4) * 0.25;
            }

            prevVector = { m11, m12, m21, m22 };
          }
        }
      }

      const targetSpeed = Math.max(0.6, velocity * 220);
      currentSpeed += (targetSpeed - currentSpeed) * 0.15;

      for (let i = 0; i < stars.length; i++) {
        stars[i].update(currentSpeed);
        stars[i].draw();
      }

      animationFrameId = requestAnimationFrame(animateStarfield);
    };

    animateStarfield();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // -------------------------------------------------------------
  // 2. COUNTER & LOADING SEQUENCE
  // -------------------------------------------------------------
  useEffect(() => {
    const duration = 4500;
    const intervalTime = 30;
    const incrementSteps = 100 / (duration / intervalTime);

    const loadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(loadInterval);
          setTimeout(() => {
            setIsLoaded(true);
            if (onComplete) onComplete();
          }, 400);
          return 100;
        }
        return prev + incrementSteps;
      });
    }, intervalTime);

    return () => clearInterval(loadInterval);
  }, [onComplete]);

  const formattedCounter = String(Math.floor(progress)).padStart(3, "0");

  return (
    <>
      {/* Dynamic Keyframes for 3D Gimbal Animations */}
      <style jsx global>{`
        @keyframes gimbalOuter {
          0% { transform: rotateZ(0deg) rotateX(0deg) rotateY(0deg); }
          30% { transform: rotateZ(360deg) rotateX(0deg) rotateY(0deg); }
          70% { transform: rotateZ(540deg) rotateX(65deg) rotateY(160deg); }
          100% { transform: rotateZ(720deg) rotateX(90deg) rotateY(0deg); }
        }
        @keyframes gimbalMiddle {
          0% { transform: rotateZ(0deg) rotateX(0deg) rotateY(0deg); }
          30% { transform: rotateZ(-540deg) rotateX(0deg) rotateY(0deg); }
          70% { transform: rotateZ(-360deg) rotateX(-75deg) rotateY(-130deg); }
          100% { transform: rotateZ(-180deg) rotateX(90deg) rotateY(0deg); }
        }
        @keyframes gimbalInner {
          0% { transform: rotateZ(0deg) rotateX(0deg) rotateY(0deg); }
          30% { transform: rotateZ(720deg) rotateX(0deg) rotateY(0deg); }
          70% { transform: rotateZ(1080deg) rotateX(110deg) rotateY(320deg); }
          100% { transform: rotateZ(1440deg) rotateX(90deg) rotateY(0deg); }
        }
        .animate-gimbal-outer {
          animation: gimbalOuter 4.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-gimbal-middle {
          animation: gimbalMiddle 4.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-gimbal-inner {
          animation: gimbalInner 4.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {/* PRELOADER WRAPPER */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#030303] transition-opacity duration-800 cubic-bezier(0.77,0,0.175,1) ${
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* STARFIELD CANVAS */}
        <canvas ref={canvasRef} className="absolute inset-0 z-[1] pointer-events-none w-full h-full" />

        {/* HUD CONTENT */}
        <div className="relative z-[2] flex items-center justify-center [perspective:1200px]">
          <div className="relative w-[600px] h-[600px] flex items-center justify-center [transform-style:preserve-3d]">
            
            {/* OUTER RING */}
            <div
              ref={outerRingRef}
              className="absolute w-[580px] h-[580px] flex items-center justify-center rounded-full [transform-style:preserve-3d] will-change-transform animate-gimbal-outer"
            >
              <svg viewBox="0 0 600 600" className="w-full h-full overflow-visible">
                <defs>
                  <path id="textPathOuter" d="M 300, 300 m -270, 0 a 270,270 0 1,1 540,0 a 270,270 0 1,1 -540,0" />
                </defs>
                <circle cx="300" cy="300" r="285" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <circle cx="300" cy="300" r="270" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <circle cx="300" cy="300" r="255" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="2, 6" />

                <line x1="300" y1="10" x2="300" y2="35" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                <line x1="300" y1="565" x2="300" y2="590" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                <line x1="10" y1="300" x2="35" y2="300" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                <line x1="565" y1="300" x2="590" y2="300" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

                <line x1="60" y1="60" x2="90" y2="90" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <line x1="540" y1="540" x2="510" y2="510" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

                <text fill="rgba(255,255,255,0.45)" fontSize="8.5" className="font-mono tracking-[3.5px]">
                  <textPath href="#textPathOuter">
                    GRAPHIC DESIGN &nbsp;&nbsp;•&nbsp;&nbsp; PERFORMANCE OPTIMIZATION &nbsp;&nbsp;•&nbsp;&nbsp; A/B TESTING &nbsp;&nbsp;•&nbsp;&nbsp; CMS INTEGRATION &nbsp;&nbsp;•&nbsp;&nbsp; APP DESIGN &nbsp;&nbsp;•&nbsp;&nbsp; ANIMATION &nbsp;&nbsp;•&nbsp;&nbsp; PRODUCT STRATEGY &nbsp;&nbsp;•&nbsp;&nbsp; USABILITY TESTING &nbsp;&nbsp;•&nbsp;&nbsp; UX &nbsp;&nbsp;•&nbsp;&nbsp; PROTOTYPING &nbsp;&nbsp;•&nbsp;&nbsp; VISUAL DESIGN &nbsp;&nbsp;•&nbsp;&nbsp; INFORMATION ARCHITECTURE &nbsp;&nbsp;•&nbsp;&nbsp; FRONT-END &nbsp;&nbsp;•&nbsp;&nbsp; BACK-END &nbsp;&nbsp;•&nbsp;&nbsp; BRAND IDENTITY &nbsp;&nbsp;•&nbsp;&nbsp; CROSS-BROWSER &nbsp;&nbsp;•&nbsp;&nbsp; UI &nbsp;&nbsp;•&nbsp;&nbsp; INTERACTIVE EXPERIENCE &nbsp;&nbsp;•&nbsp;&nbsp;
                  </textPath>
                </text>
              </svg>
            </div>

            {/* MIDDLE RING */}
            <div className="absolute w-[440px] h-[440px] flex items-center justify-center rounded-full [transform-style:preserve-3d] will-change-transform animate-gimbal-middle">
              <svg viewBox="0 0 440 440" className="w-full h-full overflow-visible">
                <circle cx="220" cy="220" r="215" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <circle cx="220" cy="220" r="200" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray="80, 260" />
                <circle cx="220" cy="220" r="185" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="120, 180" />

                <line x1="220" y1="5" x2="220" y2="30" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                <line x1="220" y1="410" x2="220" y2="435" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
              </svg>
            </div>

            {/* INNER RING */}
            <div className="absolute w-[320px] h-[320px] flex items-center justify-center rounded-full [transform-style:preserve-3d] will-change-transform animate-gimbal-inner">
              <svg viewBox="0 0 320 320" className="w-full h-full overflow-visible">
                <circle cx="160" cy="160" r="150" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                <circle cx="160" cy="160" r="135" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="160" cy="160" r="120" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="40, 40" />
                <circle cx="160" cy="160" r="105" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              </svg>
            </div>

            {/* DIGITAL COUNTER */}
            <div
              className={`absolute [transform:translateZ(60px)] pointer-events-none flex items-center justify-center transition-opacity duration-400 ${
                isLoaded ? "opacity-0" : "opacity-100"
              }`}
            >
              <span
                className="font-bold text-[6rem] tracking-[-2px] text-transparent"
                style={{
                  WebkitTextStroke: "1.5px rgba(255, 255, 255, 0.85)",
                  textShadow: "0 0 10px rgba(255, 255, 255, 0.1)",
                }}
              >
                {formattedCounter}
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}