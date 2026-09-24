/* eslint-disable @next/next/no-img-element */
const assetBaseUrl = "/images/ticket/";

const navigationItems = [
  {
    label: "WORKSHOPS",
    className:
      "absolute top-[116px] left-[172px] [font-family:'Orbitron',Helvetica] font-black text-black text-base tracking-[0.32px] leading-[normal]",
  },
  {
    label: "COMPETETIONS",
    className:
      "absolute top-[118px] left-[357px] [font-family:'Orbitron',Helvetica] font-black text-black text-base tracking-[0.32px] leading-[normal]",
  },
  {
    label: "PASSES",
    className:
      "absolute top-[118px] left-[550px] [font-family:'Orbitron',Helvetica] font-black text-black text-base tracking-[0.32px] leading-[normal]",
  },
  {
    label: "LECTURES",
    className:
      "absolute top-[116px] left-[673px] [font-family:'Orbitron',Helvetica] font-black text-black text-base tracking-[0.32px] leading-[normal]",
  },
  {
    label: "ACCOMODATION",
    className:
      "absolute top-[116px] left-[821px] [font-family:'Orbitron',Helvetica] font-black text-black text-base tracking-[0.32px] leading-[normal]",
  },
];

const navigationIcons = [
  "top-[115px] left-[315px]",
  "top-[113px] left-[518px]",
  "top-[115px] left-[641px]",
  "top-[115px] left-[789px]",
];

const decorativeAssets = [
  {
    className:
      "top-[212px] left-[926px] w-[83px] h-[99px] aspect-[0.84] absolute object-cover",
    src: "image-242@2x.png",
  },
  {
    className:
      "top-[502px] left-[342px] w-7 h-[33px] aspect-[0.84] absolute object-cover",
    src: "image-229@2x.png",
  },
  {
    className:
      "top-[464px] left-[378px] w-[83px] h-[99px] aspect-[0.84] absolute object-cover",
    src: "image-242@2x.png",
  },
  {
    className:
      "top-[329px] left-[217px] w-[51px] h-[60px] aspect-[0.84] absolute object-cover",
    src: "image-231@2x.png",
  },
  {
    className:
      "top-[471px] left-[273px] w-9 h-[43px] aspect-[0.84] absolute object-cover",
    src: "image-233@2x.png",
  },
  {
    className:
      "top-[489px] left-[304px] w-9 h-[43px] aspect-[0.84] absolute object-cover",
    src: "image-233@2x.png",
  },
  {
    className:
      "top-[484px] left-[182px] w-[50px] h-[60px] aspect-[0.84] absolute object-cover",
    src: "image-234@2x.png",
  },
  {
    className:
      "top-[414px] left-[242px] w-[41px] h-[49px] aspect-[0.84] absolute object-cover",
    src: "image-235@2x.png",
  },
  {
    className:
      "top-[389px] left-28 w-[140px] h-[100px] aspect-[1.4] absolute object-cover",
    src: "image-237@2x.png",
  },
  {
    className:
      "top-[505px] left-28 w-[60px] h-[58px] aspect-[1.03] absolute object-cover",
    src: "image-244@2x.png",
  },
  {
    className:
      "top-[439px] left-[330px] w-20 h-[45px] aspect-[1.78] absolute object-cover",
    src: "image-239@2x.png",
  },
  {
    className:
      "top-[148px] left-[957px] w-[122px] h-[85px] aspect-[1.44] absolute object-cover",
    src: "image-240@2x.png",
  },
  {
    className:
      "top-[489px] left-[967px] w-[63px] h-[59px] aspect-[1.08] absolute object-cover",
    src: "image-241@2x.png",
  },
  {
    className:
      "top-[137px] left-[125px] w-[83px] h-[99px] aspect-[0.84] absolute object-cover",
    src: "image-242@2x.png",
  },
  {
    className:
      "top-[214px] left-[38px] w-11 h-[52px] aspect-[0.84] absolute object-cover",
    src: "image-243@2x.png",
  },
  {
    className:
      "top-[204px] left-[109px] w-[60px] h-[58px] aspect-[1.03] absolute object-cover",
    src: "image-244@2x.png",
  },
  {
    className:
      "top-[159px] left-[66px] w-[43px] h-[42px] aspect-[1.03] absolute object-cover",
    src: "image-245@2x.png",
  },
  {
    className:
      "top-[113px] left-[87px] w-[73px] h-[29px] aspect-[2.77] absolute object-cover",
    src: "image-246@2x.png",
  },
  {
    className:
      "top-28 left-[987px] w-[72px] h-[26px] aspect-[2.77] absolute object-cover",
    src: "image-247@2x.png",
  },
  {
    className:
      "top-[430px] left-[87px] w-[26px] h-[72px] aspect-[2.77] absolute object-cover",
    src: "image-248@2x.png",
  },
];

const ticketAssets = [
  {
    className:
      "top-[65px] left-0 w-[1105px] h-[567px] aspect-[1.95] absolute object-cover",
    src: "image-221.png",
    alt: "Tathva event pass artwork",
  },
  {
    className:
      "top-[57px] left-[1103px] w-52 h-[596px] aspect-[0.35] absolute object-cover",
    src: "image-222.png",
    alt: "Event pass barcode panel",
  },
  {
    className:
      "top-[155px] left-[1169px] w-[76px] h-[388px] aspect-[0.2] absolute object-cover",
    src: "image-223@2x.png",
    alt: "Event pass barcode",
  },
];

export const Frame = () => {
  return (
    
    <main
      className="bg-black w-full min-w-[1413px] min-h-[697px] relative"
      data-model-id="1282:1159"
    >
      {ticketAssets.map((asset) => (
        <img
          key={asset.src}
          className={asset.className}
          alt={asset.alt}
          src={`${assetBaseUrl}${asset.src}`}
        />
      ))}

      <nav aria-label="Event sections">
        {navigationItems.map((item) => (
          <a
            key={item.label}
            className={item.className}
            href={`#${item.label.toLowerCase()}`}
          >
            {item.label}
          </a>
        ))}
      </nav>
      {navigationIcons.map((position, index) => (
        <img
          key={`${position}-${index}`}
          className={`${position} w-[21px] h-[25px] aspect-[0.84] absolute object-cover`}
          alt=""
          aria-hidden="true"
          src={`${assetBaseUrl}image-227@2x.png`}
        />
      ))}

      {decorativeAssets.map((asset, index) => (
        <img
          key={`${asset.src}-${index}`}
          className={asset.className}
          alt=""
          aria-hidden="true"
          src={`${assetBaseUrl}${asset.src}`}
        />
      ))}

      <h1 className="top-[126px] left-[229px] w-[962px] [font-family:'Squada_One',Helvetica] text-9xl tracking-[6.40px] absolute font-normal text-black leading-[normal] whitespace-nowrap">
        TATHVA PASS
      </h1>
      <h2 className="absolute top-[307px] left-[641px] [font-family:'Squada_One',Helvetica] font-normal text-black text-9xl tracking-[6.40px] leading-[normal] whitespace-nowrap">
        DAY 3
      </h2>
      <p className="absolute top-[262px] left-[266px] [font-family:'Orbitron',Helvetica] font-black text-black text-xl tracking-[1.00px] leading-[normal]">
        ONE PASS. EVERY MOMENT OF TATHVA
      </p>
      <img
        className="absolute top-[273px] left-[782px] w-[113px] h-1"
        alt=""
        aria-hidden="true"
        src={`${assetBaseUrl}line-81.svg`}
      />
      <div className="top-[323px] left-[283px] w-[311px] [font-family:'Alatsi',Helvetica] text-5xl tracking-[2.40px] absolute font-normal text-black leading-[normal] whitespace-nowrap">
        TATHVA 2026
      </div>
      <div className="absolute top-[380px] left-[283px] [font-family:'Alatsi',Helvetica] font-normal text-black text-[32px] tracking-[1.60px] leading-[normal]">
        ADMIT ONE
      </div>
      <img
        className="top-[401px] left-[463px] w-[105px] h-[111px] aspect-[0.94] absolute object-cover"
        alt="Pass QR code"
        src={`${assetBaseUrl}image-236@2x.png`}
      />
      <div className="absolute top-[421px] left-[629px] [font-family:'Squada_One',Helvetica] font-normal text-black text-[64px] tracking-[3.20px] leading-[normal] whitespace-nowrap">
        OCT 11 2026
      </div>
      <p className="absolute top-[482px] left-[594px] [font-family:'Orbitron',Helvetica] font-black text-black text-base tracking-[0.80px] leading-[normal]">
        COMPETETIONS | EVENTS | CONCLAVE
      </p>
      <div className="absolute top-[514px] left-[659px] [font-family:'Orbitron',Helvetica] font-black text-black text-xl tracking-[1.00px] leading-[normal]">
        REGISTER |&nbsp;&nbsp;Rs. 1399/-
      </div>
      <div className="absolute top-[126px] left-[223px] w-[962px] [font-family:'Squada_One',Helvetica] font-normal text-black text-9xl tracking-[6.40px] leading-[normal] whitespace-nowrap">
        TATHVA PASS
      </div>
      <img
        className="top-[263px] left-[66px] w-[999px] h-[324px] aspect-[3.08] absolute object-cover"
        alt="Illustrated Tathva event pass details"
        src={`${assetBaseUrl}image-249.png`}
      />
      <img
        className="top-[294px] left-[588px] w-[456px] h-[275px] aspect-[1.66] absolute object-cover"
        alt="Illustrated event information panel"
        src={`${assetBaseUrl}image-250@2x.png`}
      />
    </main>
  );
};
