import { DotsBackground } from "../components/DotsBackground";
import { GlowLetters } from "../components/glow";

export default function Home() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background: "#1c1918",
        color: "white",
      }}
    >
      <DotsBackground />

      <section
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "380px" }}>
          <GlowLetters
            text="ASTERIA"
            textColor="#f3efe8"
            textFit={0.7}
            textY={0.52}
            fontFamily='"Inter", "Segoe UI", sans-serif'
            fontWeight={800}
            radius={170}
            orbit={90}
          />
        </div>
      </section>
    </main>
  );
}
