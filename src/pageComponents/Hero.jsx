"use client";

import { useState } from "react";

const assetBase = "/images/Hero/";

const navigationItems = [
    {
        label: "PROSHOW",
        href: "#proshow",
        arrow: "line-58-1.svg",
        textClass: "w-[62px]",
    },
    {
        label: "WORKSHOPS",
        href: "#workshops",
        arrow: "line-58-1.svg",
        textClass: "w-[72px]",
    },
    {
        label: "CAMPUS AMBASADOR",
        href: "#campus-ambasador",
        arrow: "line-59.svg",
        textClass: "w-[118px]",
    },
    { label: "GALLERY", href: "#gallery", textClass: "w-[51px]" },
];

export const Hero = ({ onEnter }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);

    const handleEnter = () => {
        setHasEntered(true);

        if (typeof onEnter === "function") {
            onEnter();
        }
    };

    return (
        <main
            className="bg-[#080808] min-w-353.25 w-353.25 min-h-196.25 relative overflow-hidden"
            data-model-id="10:78"
            aria-label="Tathva 26 Asteria"
        >
            <img
                className="absolute top-84.75 left-0 w-309.5 h-59.25"
                alt=""
                aria-hidden="true"
                src={`${assetBase}group-24.png`}
            />
            <img
                className="absolute top-6.5 left-143.25 w-135 h-189.75 aspect-[0.56] object-cover"
                alt="Floating fantasy island"
                src={`${assetBase}583f875342da20005f7c1f430f8a569f-1.png`}
            />
            <img
                className="absolute w-full top-0 left-0 h-196.25 aspect-[1.53]"
                alt=""
                aria-hidden="true"
                src={`${assetBase}8615fcb622ab467f5acdde07050ae12f-1.png`}
            />
            <img
                className="absolute top-123.5 left-145 w-36.5 h-60.75 object-cover"
                alt="Figure beneath a celestial sky"
                src={`${assetBase}rectangle-22@2x.png`}
            />
            <img
                className="absolute top-21.25 left-124.25 w-192.75 h-121"
                alt="Orbiting light trails surrounding the floating island"
                src={`${assetBase}group-26.svg`}
            />
            <button
                type="button"
                onClick={handleEnter}
                className="absolute top-158.5 left-27.25 w-44.25 h-12.25 bg-[#00000099] rounded-[10.97px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Enter Tathva 26"
            >
                <span
                    className="left-0.5 absolute -top-0.75 font-['Instrument_Serif',Helvetica] font-normal text-white text-[41.3px] text-center tracking-normal leading-[normal]"
                    aria-hidden="true"
                >

                </span>
                <span
                    className="left-39.25 -rotate-180 absolute -top-0.75 font-['Instrument_Serif',Helvetica] font-normal text-white text-[41.3px] text-center tracking-normal leading-[normal]"
                    aria-hidden="true"
                >

                </span>
                <span className="absolute top-2.25 left-11.75 font-['Intel_One_Mono',Helvetica] text-[22.7px] text-center font-normal text-white tracking-normal leading-[normal]">
                    Enter
                </span>
                <img
                    className="absolute top-3.75 left-28.75 w-5.75 h-5.75"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}arrow-right.svg`}
                />
            </button>
            <a
                href="#home"
                className="absolute top-5.5 left-9.25 w-13.75 h-11.5 bg-cover bg-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ backgroundImage: `url(${assetBase}tathvawhitelogo-1.svg)` }}
                aria-label="Tathva home"
            />
            <a
                href="#register"
                className="absolute top-6 left-336 w-13.25 h-13.25 bg-size-[100%_100%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ backgroundImage: `url(${assetBase}akar-icons-arrow-down-right.svg)` }}
                aria-label="Register for Tathva 26"
            />
            <button
                type="button"
                className="absolute top-8.5 left-32 w-6.75 h-4.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                aria-label="Toggle navigation menu"
                aria-expanded={isMenuOpen}
                aria-controls="primary-navigation"
            >
                <img
                    className="absolute w-[81.48%] h-[88.89%] top-[11.11%] left-[18.52%]"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}line-55.svg`}
                />
                <img
                    className="absolute w-full h-[55.56%] top-[44.44%] left-0"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}line-54.svg`}
                />
                <img
                    className="absolute w-[81.48%] h-[16.67%] top-[83.33%] left-[18.52%]"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}line-55.svg`}
                />
            </button>
            <a
                href="#register"
                className="absolute top-8 left-291.75 w-43.25 h-7 flex gap-2.25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Register for Tathva 26"
            >
                <img
                    className="mt-2.75 w-[101.01px] h-0.5 object-cover"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}line-56.svg`}
                />
                <span className="w-15.25 h-7 font-['Instrument_Serif',Helvetica] italic text-[21.5px] font-normal text-white tracking-normal leading-[normal]">
                    Register
                </span>
            </a>
            <aside
                className="absolute top-33.75 left-330.25 w-11.25 h-50 flex flex-col gap-[72.1px]"
                aria-label="Event identity"
            >
                <div className="ml-[-50.5px] w-39.75 h-[10.8px] mt-[72.1px] flex rotate-90">
                    <span className="mt-[0.5px] w-[59.95px] h-[9.72px] ml-0 font-['Hammersmith_One',Helvetica] font-normal text-white text-[11.6px] tracking-normal leading-[normal] whitespace-nowrap">
                        TATHVA 26
                    </span>
                    <img
                        className="mt-1 w-[8.4px] h-[5.85px] ml-[19.8px] -rotate-90"
                        alt=""
                        aria-hidden="true"
                        src={`${assetBase}line-57.svg`}
                    />
                    <span className="mt-0 w-[49.69px] h-[9.72px] ml-[17.2px] font-['Hammersmith_One',Helvetica] font-normal text-white text-[11.6px] tracking-normal leading-[normal] whitespace-nowrap">
                        ASTERIA
                    </span>
                </div>
                <img
                    className="w-11.25 h-11.25 aspect-[1] object-cover"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}f976fdb645ffe30426c2c5ae0ce7bf9a-removebg-preview-1@2x.png`}
                />
            </aside>
            <section
                className="absolute top-24.5 left-13 w-44.5 h-37"
                aria-labelledby="hero-theme-title"
            >
                <img
                    className="absolute top-0 left-px w-px h-37"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}line-58.svg`}
                />
                <h1
                    id="hero-theme-title"
                    className="absolute top-8.75 left-5.75 w-37.75 font-['Hammersmith_One',Helvetica] font-normal text-[#ffffff99] text-[16.6px] tracking-normal leading-[normal]"
                >
                    DIFFERENT REALITIES.
                    <br />
                    ONE EXHIBITION
                </h1>
                <p className="absolute top-25.75 left-5.75 w-27.25 font-['Hammersmith_One',Helvetica] font-normal text-[#ffffff99] text-[7.1px] tracking-normal leading-[normal]">
                    A journey through technologies , cultures and possibilities beyond our
                    own
                </p>
                <img
                    className="absolute top-4 left-23 w-18 h-18 aspect-[1] object-cover"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}5c08252bd438d0b5cfb303ee8aa738ca-removebg-preview-1@2x.png`}
                />
            </section>
            <nav
                id="primary-navigation"
                className="absolute top-9.5 left-47.75 w-100.75 h-3 flex"
                aria-label="Primary navigation"
                hidden={isMenuOpen}
            >
                {navigationItems.map((item, index) => (
                    <div key={item.label} className={`flex ${index === 0 ? "" : ""}`}>
                        <a
                            href={item.href}
                            className={`${index === 1 ? "mt-px" : "mt-0"} ${item.textClass} h-2.5 ${index === 0
                                ? "ml-0"
                                : index === 1
                                    ? "ml-[12.7px]"
                                    : index === 2
                                        ? "ml-[9.7px]"
                                        : "ml-[10.2px]"
                                } font-['Hammersmith_One',Helvetica] font-normal text-white text-[11.6px] tracking-normal leading-[normal] whitespace-nowrap focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white`}
                        >
                            {item.label}
                        </a>
                        {item.arrow ? (
                            <img
                                className={
                                    index === 0
                                        ? "mt-0.75 w-[5.95px] h-[8.4px] ml-[12.4px]"
                                        : index === 1
                                            ? "mt-1 w-[5.95px] h-[8.4px] ml-[14.3px]"
                                            : "mt-[3.9px] w-[5.95px] h-[8.4px] ml-[14.8px]"
                                }
                                alt=""
                                aria-hidden="true"
                                src={`${assetBase}${item.arrow}`}
                            />
                        ) : null}
                    </div>
                ))}
            </nav>
            {isMenuOpen ? (
                <nav
                    className="absolute top-17 left-32 z-10 flex w-46.25 flex-col gap-3 bg-[#080808]/95 p-4 font-['Hammersmith_One',Helvetica] text-[11.6px] text-white"
                    aria-label="Expanded navigation menu"
                >
                    {navigationItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>
            ) : null}

            <section
                className="absolute top-151.25 left-306.75 w-35.5 h-31.5"
                aria-label="Event experiences"
            >
                <div className="absolute top-2.5 left-2.5 w-33.5 h-29 flex gap-[16.4px]">
                    <img
                        className="w-px h-29"
                        alt=""
                        aria-hidden="true"
                        src={`${assetBase}line-58-2.svg`}
                    />
                    <p className="mt-[27.4px] w-[114.55px] h-[72.11px] font-['Hammersmith_One',Helvetica] font-normal text-[#ffffff99] text-[16.6px] tracking-normal leading-[normal]">
                        EXHIBITS
                        <br />
                        WORLDS
                        <br />
                        EXPERIENCES <br />
                        CONNECT
                    </p>
                </div>
                <img
                    className="absolute top-0 left-0 w-5.25 h-5"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}vector-22.svg`}
                />
            </section>
            <aside
                className="absolute top-89.25 left-329.5 w-13.5 h-19"
                aria-label="Location 11.321973 degrees north, 75.935386 degrees east"
            >
                <div className="absolute top-0 left-0 w-12.75 h-12.25 rounded-[25.5px/24.5px] border border-solid border-white" />
                <img
                    className="absolute top-4.75 left-5 w-3 h-3"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}vector-22-1.svg`}
                />
                <p className="absolute top-14 left-0 w-13 font-['Hammersmith_One',Helvetica] font-normal text-white text-[7.6px] text-center tracking-normal leading-[normal]">
                    11.321973° N <br />
                    75.935386° E
                </p>
            </aside>
            <img
                className="absolute top-143.5 left-56.75 w-252.5 h-52.75 aspect-[4.09] object-cover"
                alt="Rocky terrain beneath the Tathva exhibition"
                src={`${assetBase}untitled-design--3--removebg-preview-1.png`}
            />
            <img
                className="absolute top-13.5 left-247.25 w-44.5 h-29.75 aspect-[1.5] object-cover"
                alt="Blue celestial illustration"
                src={`${assetBase}image-86@2x.png`}
            />
            <span className="sr-only" role="status" aria-live="polite">
                {hasEntered ? "Entering Tathva 26" : ""}
            </span>
        </main>
    );
};
