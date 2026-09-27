"use client";
import { useState, useEffect } from "react";
import "./w1.css";

// Desktop Constants
const desktopAssetBase = "https://c.animaapp.com/Dp7bguVy/img";
const desktopCards = [
  {
    id: "workshops",
    number: "01",
    title: "WORKSHOPS",
    description: [""],
    frame: `${desktopAssetBase}/vector-29.png`,
    image: `${desktopAssetBase}/tathva-26-generate-the-same-image---ar-321487---edit-httpss-m-97@2x.png`,
    titleClass: "top-[140px] left-0 w-[204px] text-xl tracking-[5.00px]",
    descriptionClass: "top-[154px] left-0 w-[204px]",
    markerClass: "top-[45px] left-[77px]",
    iconClass: "top-[510px] left-[77px]",
  },
  {
    id: "competitions",
    number: "02",
    title: "COMPETITIONS",
    description: [""],
    frame: `${desktopAssetBase}/group-35.png`,
    titleClass: "top-[140px] left-px w-[204px] text-lg tracking-[4.50px]",
    descriptionClass: "top-[154px] left-px w-[204px]",
    markerClass: "top-[45px] left-[77px]",
    iconClass: "top-[510px] left-[77px]",
  },
  {
    id: "lectures",
    number: "03",
    title: "LECTURES",
    description: [""],
    frame: `${desktopAssetBase}/group-36.png`,
    titleClass: "top-[140px] left-[21px] w-[171px] text-xl tracking-[5.00px]",
    descriptionClass: "top-[158px] left-px w-[204px]",
    markerClass: "top-[45px] left-[77px]",
    iconClass: "top-[510px] left-[77px]",
  },
  {
    id: "hackathons",
    number: "04",
    title: "HACKATHONS",
    description: [""],
    frame: `${desktopAssetBase}/group-37.png`,
    titleClass: "top-[140px] left-px w-[204px] text-xl tracking-[5.00px]",
    descriptionClass: "top-[157px] left-px w-[204px]",
    markerClass: "top-[42px] left-[79px]",
    iconClass: "top-[510px] left-[79px]",
  },
];

const navigationItems = [
  { label: "PROSHOW", href: "#proshow" },
  { label: "WORKSHOPS", href: "#workshops" },
  { label: "CAMPUS AMBASADOR", href: "#campus-ambasador" },
  { label: "GALLERY", href: "#gallery" },
];

const markerDots = [0, 1, 2, 3, 4, 5, 6];

// Mobile Constants
const mobileCards = [
  {
    number: "01",
    title: "WORKSHOPS",
    description: (
      <>
        HANDS ON
        <br />
        MINDS ON
        <br />
        REAL WORLD
      </>
    ),
    image: "https://c.animaapp.com/UqxAlqQL/img/group-34@2x.png",
    position: "absolute top-0 left-px w-[143px] h-[401px]",
    titleClass:
      "absolute top-[76px] left-0 w-[139px] [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-[13.6px] text-center tracking-[3.40px] leading-[normal]",
    descriptionClass:
      "absolute top-[105px] left-0 w-[139px] [font-family:'Instrument_Serif',Helvetica] font-normal text-white text-[10.9px] text-center tracking-[3.04px] leading-[normal]",
    numberPosition: "top-[31px] left-[52px]",
    iconPosition: "top-[347px] left-[52px]",
  },
  {
    number: "02",
    title: "COMPETITIONS",
    description: (
      <>
        THINK
        <br />
        SOLVE
        <br />
        BUILD
      </>
    ),
    image: "https://c.animaapp.com/UqxAlqQL/img/group-35@2x.png",
    position: "absolute top-px left-[174px] w-[143px] h-[401px]",
    titleClass:
      "left-px w-[139px] text-[12.2px] tracking-[3.06px] absolute top-[76px] [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-center leading-[normal]",
    descriptionClass:
      "absolute top-[105px] left-px w-[139px] [font-family:'Instrument_Serif',Helvetica] font-normal text-white text-[10.9px] text-center tracking-[3.04px] leading-[normal]",
    numberPosition: "top-[31px] left-[52px]",
    iconPosition: "top-[347px] left-[52px]",
  },
  {
    number: "03",
    title: "LECTURES",
    description: (
      <>
        LEARN
        <br />
        GAIN PERSPECTIVE
        <br />
        GROW
      </>
    ),
    image: "https://c.animaapp.com/UqxAlqQL/img/group-36@2x.png",
    position: "absolute top-[419px] left-0 w-[143px] h-[401px]",
    titleClass:
      "left-3.5 w-[116px] text-[13.6px] tracking-[3.40px] absolute top-[76px] [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-center leading-[normal]",
    descriptionClass:
      "absolute top-[107px] left-0 w-[139px] [font-family:'Instrument_Serif',Helvetica] font-normal text-white text-[10.9px] text-center tracking-[3.04px] leading-[normal]",
    numberPosition: "top-[31px] left-[52px]",
    iconPosition: "top-[347px] left-[52px]",
  },
  {
    number: "04",
    title: "HACKATHONS",
    description: (
      <>
        CODE
        <br />
        COLLABORATE
        <br />
        CREATE
      </>
    ),
    image: "https://c.animaapp.com/UqxAlqQL/img/group-37@2x.png",
    position: "absolute top-[419px] left-[174px] w-[143px] h-[401px]",
    titleClass:
      "absolute top-[76px] left-0 w-[139px] [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-[13.6px] text-center tracking-[3.40px] leading-[normal]",
    descriptionClass:
      "absolute top-[107px] left-0 w-[139px] [font-family:'Instrument_Serif',Helvetica] font-normal text-white text-[10.9px] text-center tracking-[3.04px] leading-[normal]",
    numberPosition: "top-[29px] left-[54px]",
    iconPosition: "top-[347px] left-[54px]",
  },
];

const cardIcon = "https://c.animaapp.com/UqxAlqQL/img/3ef01d988cdc695be23d44d3ff250f97-removebg-preview-4@2x.png";

function ActivityCard({ card, onSelect, selected, index, anySelected }) {
  return (
    <article
      className={`${card.position} animate-float transition-all duration-500 cursor-pointer ${
        anySelected
          ? selected
            ? "scale-105 z-20"
            : "opacity-70 blur-[2px] grayscale-[20%] z-0"
          : "scale-100 opacity-100 blur-0 grayscale-0 z-10"
      }`}
      style={{ animationDelay: `${index * 0.15}s` }}
      aria-label={`${card.title}`}
      aria-current={selected ? "true" : undefined}
      data-card-number={card.number}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(card.number);
      }}
    >
      <div className="w-full h-full relative">
        <img className="absolute top-0 left-0 w-[139px] h-[402px]" alt="" aria-hidden="true" src={card.image} />
        <h2 className={card.titleClass}>{card.title}</h2>
        <p className={card.descriptionClass}>{card.description}</p>
        <div
          className={`absolute w-[33px] h-[34px] ${card.numberPosition} bg-[url(https://c.animaapp.com/UqxAlqQL/img/22e6ef5def6cb45e16f88405d9a1a8e5-removebg-preview-1-3@2x.png)] bg-cover bg-[50%_50%]`}
          aria-hidden="true"
        >
          <span className="absolute w-full h-[36.00%] top-[32.00%] left-0 [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-[10.9px] text-center tracking-[3.04px] leading-[normal] whitespace-nowrap">
            {card.number}
          </span>
        </div>
        <img
          className={`absolute ${card.iconPosition} w-[35px] h-[35px] aspect-[1] object-cover`}
          alt=""
          aria-hidden="true"
          src={cardIcon}
        />
      </div>
    </article>
  );
}

function MobileView() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [scale, setScale] = useState(1);
  const [viewportHeight, setViewportHeight] = useState(917);

  useEffect(() => {
    const handleResize = () => {
      setScale(window.innerWidth / 412);
      setViewportHeight(window.innerHeight);
    };
    handleResize(); // Initial calculate
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main
      className="block min-[1285px]:hidden bg-[url(https://c.animaapp.com/UqxAlqQL/img/android-compact---16.png)] bg-cover bg-[50%_50%] w-full relative overflow-hidden"
      style={{ minHeight: `${Math.max(917 * scale, viewportHeight)}px` }}
      onClick={() => setSelectedCard(null)}
    >
      <div
        className="w-[412px] h-[917px] absolute left-1/2 origin-top"
        style={{
          top: `${Math.max((viewportHeight - 917 * scale) / 2, 0)}px`,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <div 
          className={`absolute inset-0 bg-black/60 transition-opacity duration-500 z-10 ${
            selectedCard ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCard(null);
          }}
        ></div>
        <header aria-label="Tathva navigation" className="relative z-30">
          <div
            className="absolute top-5 left-5 w-[55px] h-[46px] bg-[url(https://c.animaapp.com/UqxAlqQL/img/tathvawhitelogo-1@2x.png)] bg-cover bg-[50%_50%]"
            role="img"
            aria-label="Tathva"
          />
          <button
            type="button"
            className="absolute top-[32px] left-[359px] w-[27px] h-[16px] cursor-pointer flex flex-col justify-between items-center"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((isOpen) => !isOpen);
            }}
          >
            <span className="w-[60%] h-[2.5px] bg-white rounded-full"></span>
            <span className="w-full h-[2.5px] bg-white rounded-full"></span>
            <span className="w-[60%] h-[2.5px] bg-white rounded-full"></span>
          </button>
          {menuOpen && (
            <nav className="absolute top-[58px] left-[300px] w-[90px] bg-black/70 p-2 text-center text-white backdrop-blur-md rounded-md">
              <a className="block py-1 text-xs" href="#activities">Activities</a>
            </nav>
          )}
        </header>
        <div
          className="absolute -top-px left-[163px] w-[99px] h-[33px] z-30"
          aria-label="Tathva 2026"
          role="img"
        >
          <img
            className="absolute w-full h-full top-0 left-0"
            alt=""
            aria-hidden="true"
            src="https://c.animaapp.com/UqxAlqQL/img/vector-26.svg"
          />
          <img
            className="absolute w-[66.94%] h-[17.37%] top-[73.13%] left-[17.04%]"
            alt=""
            aria-hidden="true"
            src="https://c.animaapp.com/UqxAlqQL/img/vector-27.svg"
          />
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={index}
              className="absolute w-[2.07%] h-[16.12%] top-[65.08%] bg-[#d9d9d9] rounded-[0.56px]"
              style={{ left: `${36.36 + index * 4.96}%` }}
              aria-hidden="true"
            />
          ))}
          <span className="left-[28.31%] absolute w-[47.73%] h-[39.23%] top-[17.36%] [font-family:'Bebas_Neue',Helvetica] font-normal text-white text-[11.7px] tracking-[0] leading-[normal] whitespace-nowrap">
            TATHVA 2026
          </span>
          <img
            className="absolute w-[95.04%] h-[56.72%] top-[8.06%] left-[3.10%]"
            alt=""
            aria-hidden="true"
            src="https://c.animaapp.com/UqxAlqQL/img/vector-28.svg"
          />
        </div>
        <section
          id="activities"
          className="absolute w-[313px] h-[820px] top-[82px] left-[53px]"
          aria-label="Tathva activities"
        >
          {mobileCards.map((card, index) => (
            <ActivityCard
              key={card.number}
              card={card}
              index={index}
              anySelected={selectedCard !== null}
              selected={selectedCard === card.number}
              onSelect={setSelectedCard}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function DesktopView() {
  return (
    <main
      className="hidden min-[1285px]:flex events-container bg-[url(https://c.animaapp.com/Dp7bguVy/img/frame-48.png)] bg-cover bg-[50%_50%] w-full h-[max(697px,100svh)] relative items-center justify-center overflow-hidden"
      data-model-id="998:1701"
    >
      <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-500 pointer-events-none z-10 page-overlay"></div>
      <img src="/images/menu/border_left.png" alt="" className="absolute left-[30px] top-1/2 -translate-y-1/2 h-[50%] max-h-[350px] w-auto pointer-events-none z-50" />
      <img src="/images/menu/border_right.png" alt="" className="absolute right-[30px] top-1/2 -translate-y-1/2 h-[50%] max-h-[350px] w-auto pointer-events-none z-50" />
      <div className="w-[1413px] h-full relative mx-auto flex shrink-0 items-center justify-center">
        <section
          className="relative w-[988px] h-[590px] flex shrink-0"
          aria-label="Tathva events"
        >
          {desktopCards.map((card, index) => (
            <article
              id={card.id}
              key={card.id}
              className={`w-[207.79px] h-[590.5px] relative animate-float event-card ${
                index === 0 ? "" : index === 2 ? "ml-[44.9px]" : "ml-[57.9px]"
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="w-full h-full relative event-card-inner cursor-pointer">
                <img
                  className="absolute top-0 left-0 w-[205px] h-[592px]"
                  alt=""
                  aria-hidden="true"
                  src={card.frame}
                />
                {card.image && (
                  <img
                    className="absolute top-[251px] left-5 w-[164px] h-[249px] aspect-[0.66] object-cover"
                    alt="Workshop artwork"
                    src={card.image}
                  />
                )}
                <h2
                  className={`absolute [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-center leading-[normal] ${card.titleClass}`}
                >
                  {card.title}
                </h2>
                <p
                  className={`absolute [font-family:'Instrument_Serif',Helvetica] font-normal text-white text-base text-center tracking-[4.48px] leading-[normal] ${card.descriptionClass}`}
                >
                  {card.description.map((line) => (
                    <span className="block" key={line}>
                      {line}
                    </span>
                  ))}
                </p>
                <div
                  className={`absolute w-[49px] h-[50px] bg-[url(https://c.animaapp.com/Dp7bguVy/img/22e6ef5def6cb45e16f88405d9a1a8e5-removebg-preview-1-3@2x.png)] bg-cover bg-[50%_50%] ${card.markerClass}`}
                  aria-label={`${card.number}: ${card.title}`}
                >
                  <span className="absolute w-full h-[36.00%] top-[32.00%] left-0 [font-family:'Hammersmith_One',Helvetica] font-normal text-white text-base text-center tracking-[4.48px] leading-[normal] whitespace-nowrap">
                    {card.number}
                  </span>
                </div>
                <img
                  className={`absolute w-[52px] h-[52px] aspect-[1] object-cover ${card.iconClass}`}
                  alt=""
                  aria-hidden="true"
                  src={`${desktopAssetBase}/3ef01d988cdc695be23d44d3ff250f97-removebg-preview-4@2x.png`}
                />
              </div>
            </article>
          ))}
        </section>
        <header aria-label="Main navigation">
          <div className="absolute top-0 left-0 w-full h-0 z-50 min-[1400px]:fixed min-[1400px]:left-0 min-[1400px]:top-0 pointer-events-none">
            <a href="#top" aria-label="Tathva home" className="absolute top-[22px] left-[41px] max-[1400px]:left-[84px] transition-all duration-300 pointer-events-auto">
              <img
                className="w-[55px] h-[46px] aspect-[1.22] object-cover"
                alt="Tathva"
                src={`${desktopAssetBase}/tathvawhitelogo-1@2x.png`}
              />
            </a>
            <button
              type="button"
              className="absolute top-[38px] left-[132px] max-[1400px]:left-[149px] transition-all duration-300 w-[27px] cursor-pointer flex flex-col items-center gap-[5px] pointer-events-auto"
              aria-label="Open navigation menu"
            >
              <span className="w-[60%] h-[2.5px] bg-white rounded-full"></span>
              <span className="w-full h-[2.5px] bg-white rounded-full"></span>
              <span className="w-[60%] h-[2.5px] bg-white rounded-full"></span>
            </button>
            <nav className="absolute top-[38px] left-[195px] w-[403px] h-3 flex origin-left scale-[1.1] pointer-events-auto">
              {navigationItems.map((item, index) => (
                <span
                key={item.label}
                className={`flex items-start ${
                  index === 0
                    ? "mt-0 w-[62px] h-2.5 ml-0"
                    : index === 1
                      ? "mt-[1.0px] w-[72px] h-2.5 ml-[12.7px]"
                      : index === 2
                        ? "mt-0 w-[118px] h-2.5 ml-[9.7px]"
                        : "mt-0 w-[51px] h-2.5 ml-[10.2px]"
                }`}
              >
                <a
                  href={item.href}
                  className="[font-family:'Hammersmith_One',Helvetica] font-normal text-white text-[11.6px] tracking-[0] leading-[normal] whitespace-nowrap"
                >
                  {item.label}
                </a>
                {index < navigationItems.length - 1 && (
                  <img
                    className={`${
                      index === 0
                        ? "mt-[3px] w-[5.96px] h-[8.4px] ml-[12.4px]"
                        : index === 1
                          ? "mt-1 w-[5.96px] h-[8.4px] ml-[14.3px]"
                          : "mt-[3.9px] w-[5.95px] h-[8.4px] ml-[14.8px]"
                    }`}
                    alt=""
                    aria-hidden="true"
                    src={`${desktopAssetBase}/${index === 2 ? "line-59.svg" : "line-58.svg"}`}
                  />
                )}
              </span>
            ))}
            </nav>
          </div>
          <div
            id="top"
            className="absolute top-0 left-[653px] w-[99px] h-[33px] bg-[url(https://c.animaapp.com/Dp7bguVy/img/vector-26.svg)] bg-[100%_100%]"
            aria-label="Tathva 2026"
          >
            <img
              className="absolute w-[66.94%] h-[17.37%] top-[73.13%] left-[17.04%]"
              alt=""
              aria-hidden="true"
              src={`${desktopAssetBase}/vector-27.svg`}
            />
            {markerDots.map((dot) => (
              <span
                key={dot}
                className="absolute w-[2.07%] h-[16.12%] top-[65.08%] bg-[#d9d9d9] rounded-[0.56px]"
                style={{ left: `${36.36 + dot * 4.96}%` }}
                aria-hidden="true"
              />
            ))}
            <span className="absolute w-[47.73%] h-[39.23%] top-[17.36%] left-[28.31%] [font-family:'Bebas_Neue',Helvetica] font-normal text-white text-[11.7px] tracking-[0] leading-[normal] whitespace-nowrap">
              TATHVA 2026
            </span>
            <img
              className="absolute w-[95.04%] h-[56.72%] top-[8.06%] left-[3.10%]"
              alt=""
              aria-hidden="true"
              src={`${desktopAssetBase}/vector-28.svg`}
            />
          </div>
        </header>
      </div>
    </main>
  );
}

export const Frame = () => {
  return (
    <>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0); }
          100% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 2s ease-in-out infinite alternate;
        }
        .events-container:has(.event-card:hover) .event-card:not(:hover) {
          opacity: 0.7;
          filter: grayscale(20%) blur(1px);
        }
        .events-container:has(.event-card:hover) .page-overlay {
          opacity: 1;
        }
        .event-card {
          transition: opacity 0.5s ease, filter 0.5s ease;
          z-index: 20;
        }
        .event-card-inner {
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .event-card:hover .event-card-inner {
          transform: scale(1.08);
        }
      `}</style>
      <DesktopView />
      <MobileView />
    </>
  );
};
