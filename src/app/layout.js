import { Geist, Geist_Mono, Instrument_Serif, Cinzel, Archivo_Black } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Figma: "Instrument Serif" (exact match) — used for badge text
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

// Figma: "Calm Serif" — used for the main serif headline
const calmSerif = localFont({
  src: "../../public/fonts/calm-serif-demo.otf",
  variable: "--font-calm-serif-local",
  display: "swap",
});

// Figma: "Alata" — used for date, arena specs, prize text
const alata = localFont({
  src: "../../public/fonts/alata-regular.ttf",
  variable: "--font-alata-local",
  display: "swap",
});

// Figma: "Akira Expanded" — used for the bold expanded headline
const akiraExpanded = localFont({
  src: "../../public/fonts/akira-expanded-demo.otf",
  variable: "--font-akira-expanded-local",
  display: "swap",
});

// Fallback for Calm Serif if the local file fails to load
const cinzel = Cinzel({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-cinzel",
});

// Fallback for Akira Expanded if the local file fails to load
const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
});

export const metadata = {
  title: "Tathva '26",
  description: "Official website for Tathva '26",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${calmSerif.variable} ${alata.variable} ${akiraExpanded.variable} ${cinzel.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
