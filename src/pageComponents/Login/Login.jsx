'use client';
import React from "react";
import Link from "next/link";
import Image from "next/image";
import TopoBackground from "@/components/TopoBackground";

/**
 * Login / Sign up – Tathva 2026
 * Props:
 *  - onGoogleSignup: () => void   (trigger your g-auth flow)
 *  - homeHref: string             (route of the hero page, default "/")
 *  - loading: boolean
 *  - message: string | null       (sign-in failure to display, if any)
 */
export default function SignupPage({
  onGoogleSignup = () => {},
  homeHref = "/",
  loading = false,
  message = null,
}) {

  return (
   <main className="tv-page">
      <style>{css}</style>

      {/* CHANGE 1: topo background, scoped to this page (fixed={false}) */}
      <TopoBackground
        fixed={false}
        background="#07030f"
        lineColor="138, 111, 174"
        lineOpacity={0.3}
      />

      <div className="tv-card-outer">
        <section className="tv-card" aria-labelledby="signup-title">
          <div className="tv-crest">
            <span className="tv-border-box">
              <Image src="https://cdn-next-main.tathva.org/images/menu/border_left.png" alt="" className="tv-border" width={64} height={360} />
            </span>
            <span className="tv-crest-text" aria-hidden="true">TATHVA 2026</span>
            <span className="tv-border-box">
              <Image src="https://cdn-next-main.tathva.org/images/menu/border_right.png" alt="" className="tv-border" width={64} height={360} />
            </span>
          </div>

          <h1 id="signup-title" className="tv-title">LOGIN/SIGN UP</h1>

          <div className="tv-body">
            <button
              type="button"
              className="tv-google"
              onClick={onGoogleSignup}
              disabled={loading}
            >
              <GoogleIcon />
              {loading ? "Connecting…" : "Continue with Google"}
            </button>

            {message && (
              <p className="tv-error" role="alert">
                {message}
              </p>
            )}

            <Link
              href={homeHref}
              className="tv-back"
              onClick={(event) => {
                event.preventDefault();
                window.location.assign(homeHref);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              Back to home
            </Link>
          </div>
        </section>

        {/* even-thickness outline */}
        <svg className="tv-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="tv-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b79cff" />
              <stop offset="0.5" stopColor="#6d4bd1" />
              <stop offset="1" stopColor="#b79cff" />
            </linearGradient>
          </defs>
          <polygon
            points="50,0 100,7 100,93 50,100 0,93 0,7"
            fill="none"
            stroke="url(#tv-grad)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/>
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
    </svg>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;500&display=swap');

.main-scroll:has(.tv-page[data-signup-visible="true"]) .nb,
.main-scroll:has(.tv-page[data-signup-visible="true"]) .nb-mobile{
  display:none !important;
}

/* CHANGE 2: isolation + overflow keep the topo canvas inside this page */
.tv-page{
  position:relative; isolation:isolate; overflow:hidden;
  min-height:100vh; display:flex; align-items:center; justify-content:center;
  padding:32px 16px; box-sizing:border-box; color:#fff;
  font-family:"Bebas Neue", "Oswald", Impact, sans-serif;
  background:#07030f;
}

/* back button: plain text link inside the card */
.tv-back{
  display:inline-flex; align-items:center; gap:6px; margin-top:6px;
  font-size:18px; letter-spacing:.14em; color:#d9ccff; text-decoration:none;
}
.tv-back:hover{ text-decoration:underline; text-underline-offset:5px; }
.tv-back:focus-visible{ outline:2px solid #c9b6ff; outline-offset:4px; }

/* card */
.tv-card-outer{
  position:relative;
  width:min(460px, 100%);
}
.tv-card{
  position:relative; box-sizing:border-box; background:#03020a;
  clip-path:polygon(50% 0, 100% 7%, 100% 93%, 50% 100%, 0 93%, 0 7%);
  padding:80px 40px 100px; text-align:center;
}
.tv-outline{
  position:absolute; inset:0; width:100%; height:100%;
  overflow:visible; pointer-events:none;
}

/* TATHVA 2026 with borders above and below */
.tv-crest{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:0; margin:0 auto 20px; width:fit-content;
}
.tv-crest-text{ font-size:22px; letter-spacing:.3em; padding-left:.3em; color:#d9ccff; }

/* box = size AFTER rotation. Gap to the text is controlled by the negative margin. */
.tv-border-box{
  position:relative; display:block;
  width:360px;
  height:64px;
  margin:-10px 0;
}
/* image = same numbers swapped, rotated around its center */
.tv-border{
  position:absolute; top:50%; left:50%;
  width:64px; height:360px; object-fit:contain;
  transform:translate(-50%,-50%) rotate(90deg);
}

.tv-title{
  font-size:34px; font-weight:400; letter-spacing:.3em; margin:0 0 28px; padding-left:.3em;
}
.tv-body{ display:flex; flex-direction:column; align-items:center; gap:14px; }
.tv-error{
  margin:0; max-width:290px;
  font-family:"Oswald", sans-serif; font-size:15px; letter-spacing:.06em;
  color:#f0a3a3; text-align:center;
}
.tv-google{
  display:inline-flex; align-items:center; justify-content:center; gap:12px;
  width:100%; max-width:290px; padding:12px 18px; cursor:pointer;
  font-family:inherit; font-size:20px; letter-spacing:.14em;
  color:#0b0618; background:#fff; border:1px solid #fff; border-radius:2px;
}
.tv-google:hover{ background:#efe8ff; }
.tv-google:disabled{ opacity:.6; cursor:not-allowed; }
.tv-google:focus-visible{ outline:2px solid #c9b6ff; outline-offset:3px; }

@media (max-width:480px){
  .tv-card{ padding:72px 16px 96px; }
  .tv-border-box{ width:260px; height:48px; margin:-8px 0; }
  .tv-border{ width:48px; height:260px; }
}
`;