'use client';
import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import TopoBackground from "@/components/TopoBackground";
import TathvaMenu from "@/components/TathvaMenu/TathvaMenu";
import layouts from "@/lib/certificates/layouts.json";

/**
 * Certificates – Tathva 2026 (also served at certificates.tathva.org)
 *
 * Google sign-in runs in a popup (Google Identity Services token client); the
 * /api/certificates/session route checks the token with Google and returns the
 * visitor's certificates. Each PDF is drawn here in the browser from design
 * files that /api/certificates/asset only hands to signed-in visitors.
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function Certificates() {
  const [view, setView] = useState("signin"); // signin | busy | list
  const [email, setEmail] = useState("");
  const [certs, setCerts] = useState([]);
  const [message, setMessage] = useState(null);
  const [preparing, setPreparing] = useState(null);
  const [gisReady, setGisReady] = useState(false);
  const sessionRef = useRef(null);
  const tokenClientRef = useRef(null);

  // Only uses state setters and a ref, so it never changes between renders.
  const loadCertificates = useCallback(async (token) => {
    setView("busy");
    try {
      const res = await fetch("/api/certificates/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      sessionRef.current = data.s;
      setEmail(data.e);
      setCerts(data.c);
      setView("list");
    } catch {
      setView("signin");
      setMessage("We couldn't sign you in. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (!gisReady || !CLIENT_ID) return;
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "openid email",
      callback: (response) => {
        if (response.error || !response.access_token) {
          setView("signin");
          setMessage("Sign-in was cancelled. Please try again.");
          return;
        }
        loadCertificates(response.access_token);
      },
      error_callback: () => {
        setView("signin");
        setMessage("The Google sign-in window was closed.");
      },
    });
  }, [gisReady, loadCertificates]);

  const signIn = () => {
    setMessage(null);
    if (!tokenClientRef.current) {
      setMessage("Google sign-in is still loading. Try again in a moment.");
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
  };

  const download = async (cert, index) => {
    const [name, event, activity, team, role, layout] = cert;
    setPreparing(index);
    setMessage(null);
    try {
      const { drawCertificate, certificateFileName, titleCaseName } = await import(
        "@/lib/certificates/certificateCore"
      );
      const recipient = { name, event, activity, team, role };
      const pdf = await drawCertificate(recipient, layouts[layout], (id) => loadDesign(id, sessionRef.current));
      const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = certificateFileName({ ...recipient, name: titleCaseName(name) }, "Tathva '26 - {{event}} - {{name}}.pdf");
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      if (err.expired) {
        setView("signin");
        setMessage("Your session expired. Please sign in again.");
      } else {
        setMessage("Couldn't prepare that certificate. Please try again.");
      }
    } finally {
      setPreparing(null);
    }
  };

  return (
    <main className="cv-page">
      <style>{css}</style>
      <TathvaMenu />
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setGisReady(true)} />

      <TopoBackground fixed={false} background="#07030f" lineColor="138, 111, 174" lineOpacity={0.3} />

      <div className="cv-card-outer">
        <section className="cv-card" aria-labelledby="cv-title">
          <div className="cv-crest">
            <span className="cv-border-box">
              <Image src="https://cdn-next-main.tathva.org/images/menu/border_left.png" alt="" className="cv-border" width={64} height={360} />
            </span>
            <span className="cv-crest-text" aria-hidden="true">TATHVA 2026</span>
            <span className="cv-border-box">
              <Image src="https://cdn-next-main.tathva.org/images/menu/border_right.png" alt="" className="cv-border" width={64} height={360} />
            </span>
          </div>

          <h1 id="cv-title" className="cv-title">CERTIFICATES</h1>

          {view === "signin" && (
            <div className="cv-body">
              <p className="cv-note">
                Sign in with the Google account of the email you registered with.
              </p>
              <button type="button" className="cv-google" onClick={signIn}>
                <GoogleIcon />
                Continue with Google
              </button>
              <p className="cv-small">
                Registered with an email that isn&apos;t a Google account? Contact the Tathva team.
              </p>
            </div>
          )}

          {view === "busy" && (
            <div className="cv-body">
              <p className="cv-note">Looking up your certificates…</p>
            </div>
          )}

          {view === "list" && (
            <div className="cv-body">
              <p className="cv-who">{email}</p>
              {certs.length === 0 ? (
                <p className="cv-note">
                  No certificates found for this email. Make sure you&apos;re signed in with the email you registered with.
                </p>
              ) : (
                <ul className="cv-list">
                  {certs.map((cert, i) => {
                    const [name, event, , team, role] = cert;
                    // Team leaders get every teammate's certificate, so each row names the person.
                    const sub = [name, role === "Finalist" && "Finalist", team && `Team ${team}`].filter(Boolean).join(" · ");
                    return (
                      <li key={i} className="cv-item">
                        <div className="cv-item-text">
                          <span className="cv-event">{event}</span>
                          <span className="cv-sub">{sub}</span>
                        </div>
                        <button
                          type="button"
                          className="cv-download"
                          onClick={() => download(cert, i)}
                          disabled={preparing !== null}
                        >
                          {preparing === i ? "PREPARING…" : "DOWNLOAD"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button type="button" className="cv-back" onClick={() => { setView("signin"); setMessage(null); }}>
                Use a different account
              </button>
            </div>
          )}

          {message && (
            <p className="cv-error" role="alert">
              {message}
            </p>
          )}
        </section>

        <svg className="cv-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="cv-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b79cff" />
              <stop offset="0.5" stopColor="#6d4bd1" />
              <stop offset="1" stopColor="#b79cff" />
            </linearGradient>
          </defs>
          <polygon
            points="50,0 100,4 100,96 50,100 0,96 0,4"
            fill="none"
            stroke="url(#cv-grad)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </main>
  );
}

// Design files come scrambled per session; reverse it with the same derivation
// the API used (SHA-256 of "<session>:<id>").
async function loadDesign(id, session) {
  const res = await fetch(`/api/certificates/asset?k=${encodeURIComponent(id)}`, { headers: { "X-S": session } });
  if (res.status === 401) throw Object.assign(new Error("expired"), { expired: true });
  if (!res.ok) throw new Error(`design ${res.status}`);
  const key = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${session}:${id}`)));
  const bytes = new Uint8Array(await res.arrayBuffer());
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= key[i % key.length] ^ ((i * 151) & 255);
  return bytes;
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
.cv-page{
  position:relative; isolation:isolate; overflow:hidden;
  min-height:100vh; display:flex; align-items:center; justify-content:center;
  padding:110px 16px 64px; box-sizing:border-box; color:#fff;
  font-family:var(--font-bebas), "Bebas Neue", var(--font-oswald), Impact, sans-serif;
  background:#07030f;
}

.cv-card-outer{ position:relative; width:min(560px, 100%); }
.cv-card{
  position:relative; box-sizing:border-box; background:#03020a;
  clip-path:polygon(50% 0, 100% 4%, 100% 96%, 50% 100%, 0 96%, 0 4%);
  padding:72px 40px 88px; text-align:center;
}
.cv-outline{ position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }

.cv-crest{ display:flex; flex-direction:column; align-items:center; margin:0 auto 20px; width:fit-content; }
.cv-crest-text{ font-size:22px; letter-spacing:.3em; padding-left:.3em; color:#d9ccff; }
.cv-border-box{ position:relative; display:block; width:360px; height:64px; margin:-10px 0; }
.cv-border{
  position:absolute; top:50%; left:50%; width:64px; height:360px; object-fit:contain;
  transform:translate(-50%,-50%) rotate(90deg);
}

.cv-title{ font-size:34px; font-weight:400; letter-spacing:.3em; margin:0 0 24px; padding-left:.3em; }
.cv-body{ display:flex; flex-direction:column; align-items:center; gap:14px; }

.cv-note, .cv-small, .cv-who, .cv-sub, .cv-error{
  font-family:var(--font-oswald), "Oswald", sans-serif; letter-spacing:.04em; margin:0;
}
.cv-note{ font-size:16px; color:#d9ccff; max-width:380px; line-height:1.45; }
.cv-small{ font-size:13px; color:#8f84a8; max-width:340px; line-height:1.45; }
.cv-who{ font-size:14px; color:#8f84a8; overflow-wrap:anywhere; }
.cv-error{ font-size:15px; color:#f0a3a3; max-width:340px; margin-top:16px; }

.cv-google{
  display:inline-flex; align-items:center; justify-content:center; gap:12px;
  width:100%; max-width:290px; padding:12px 18px; cursor:pointer;
  font-family:inherit; font-size:20px; letter-spacing:.14em;
  color:#0b0618; background:#fff; border:1px solid #fff; border-radius:2px;
}
.cv-google:hover{ background:#efe8ff; }
.cv-google:focus-visible{ outline:2px solid #c9b6ff; outline-offset:3px; }

.cv-list{
  list-style:none; margin:0; padding:0; width:100%;
  border-top:1px solid rgba(183,156,255,.22); text-align:left;
}
.cv-item{
  display:flex; align-items:center; justify-content:space-between; gap:14px;
  padding:14px 4px; border-bottom:1px solid rgba(183,156,255,.22);
}
.cv-item-text{ display:grid; gap:2px; min-width:0; }
.cv-event{ font-size:21px; letter-spacing:.08em; line-height:1.15; overflow-wrap:anywhere; }
.cv-sub{ font-size:14px; color:#a99cc7; overflow-wrap:anywhere; }
.cv-download{
  flex:none; cursor:pointer; padding:8px 14px;
  font-family:inherit; font-size:17px; letter-spacing:.14em;
  color:#fff; background:transparent; border:1px solid #b79cff; border-radius:2px;
}
.cv-download:hover:not(:disabled){ background:#b79cff; color:#0b0618; }
.cv-download:disabled{ opacity:.5; cursor:progress; }
.cv-download:focus-visible{ outline:2px solid #c9b6ff; outline-offset:3px; }

.cv-back{
  margin-top:8px; padding:0; cursor:pointer; background:none; border:0;
  font-family:inherit; font-size:18px; letter-spacing:.14em; color:#d9ccff;
}
.cv-back:hover{ text-decoration:underline; text-underline-offset:5px; }
.cv-back:focus-visible{ outline:2px solid #c9b6ff; outline-offset:4px; }

@media (max-width:480px){
  .cv-card{ padding:64px 18px 80px; }
  .cv-border-box{ width:260px; height:48px; margin:-8px 0; }
  .cv-border{ width:48px; height:260px; }
  .cv-item{ flex-direction:column; align-items:flex-start; }
  .cv-download{ align-self:stretch; }
}
`;
