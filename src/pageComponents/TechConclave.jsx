export default function TechConclave() {
  return (
    <div className="@container relative mx-auto aspect-[1413/753] w-full select-none overflow-hidden bg-[#0e0f0f]">
      <img
        className="absolute block top-[-2.3904%] left-[54.7%] h-[150.1992%] w-[56.6171%] object-fill [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_25%,black_100%)] [mask-image:linear-gradient(to_right,transparent_0%,black_25%,black_100%)]"
        src="/images/techconclave/conclaveright.png"
        alt=""
      />
      <img
        className="absolute block top-[1%] left-[1.557%] h-[84%] w-[69.9059%] object-contain object-left-bottom [-webkit-mask-image:linear-gradient(to_right,black_0%,black_75%,transparent_100%)] [mask-image:linear-gradient(to_right,black_0%,black_75%,transparent_100%)]"
        src="/images/techconclave/conclaveleft.png"
        alt=""
      />
      <img
        className="absolute block top-[3.4529%] left-[73.2484%] h-[22.0505%] w-[7.7849%] object-contain"
        src="/images/techconclave/greenplus.png"
        alt=""
      />

      {/* Middle Vertical Text Block: TECH CO NC LA VE */}
      <div className="absolute top-[8.8%] left-[33.2%] z-10 flex flex-col items-start gap-[0.12em]">
        <span className="font-(family-name:--font-bebas) mb-[0.05em] text-[clamp(28px,4.8cqw,72px)] leading-none font-bold tracking-[0.12em] text-white">
          TECH
        </span>
        {["CO", "NC", "LA", "VE"].map((t) => (
          <span
            key={t}
            className="font-(family-name:--font-vcr) text-[clamp(34px,5.8cqw,88px)] leading-none font-normal tracking-[0.02em] text-white"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Right Header: TECH CONCLAVE */}
      <div className="absolute top-[36.5%] left-[66%] z-10 flex items-center gap-[0.18em] whitespace-nowrap">
        <span className="font-(family-name:--font-bebas) text-[clamp(24px,4cqw,60px)] font-bold tracking-[0.02em] text-white">
          TECH
        </span>
        <span className="font-(family-name:--font-bebas) text-[clamp(24px,4cqw,60px)] font-normal tracking-[0.02em] text-[#00E564]">
          CONCLAVE
        </span>
      </div>

      {/* Right Paragraph in Space Grotesk */}
      <p className="font-(family-name:--font-space) absolute top-[48.5%] left-[66%] z-10 w-[29%] text-[clamp(12px,1.55cqw,24px)] leading-[1.38] font-normal tracking-[0.01em] text-white opacity-95">
        A space for inspiring personalities engaging conversations and unforgettable experiences
      </p>

      {/* Bottom Left Banner Text in Bebas Neue */}
      <div className="font-(family-name:--font-bebas) absolute top-[81%] left-[8%] z-10 text-[clamp(12px,1.85cqw,28px)] leading-none font-normal tracking-[0.05em] whitespace-nowrap text-[#00E564]">
        TALKS . SHOWS . CONVERSATIONS . EXPERIENCES.
      </div>

      {/* Date Block */}
      <div className="absolute top-[75%] left-[58.2%] z-10 flex items-center gap-[0.7em]">
        <span className="font-(family-name:--font-bebas) text-[clamp(32px,5.2cqw,78px)] leading-none text-[#00E564]">OCT</span>
        <span className="font-(family-name:--font-bebas) text-[clamp(22px,3.5cqw,52px)] leading-none font-bold text-[#00E564]">
          10-11
        </span>
      </div>
    </div>
  );
}
