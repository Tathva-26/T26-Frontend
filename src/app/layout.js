import { Geist, Geist_Mono, Instrument_Serif, Alata, Cinzel, Archivo_Black } from "next/font/google";
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

// Figma: "Alata" (exact match) — used for date, arena specs, prize value
const alata = Alata({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alata",
});

// Figma: "Calm Serif" → closest Google Font substitute: Cinzel
const cinzel = Cinzel({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-cinzel",
});

// Figma: "Akira Expanded" → closest Google Font substitute: Archivo Black
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${alata.variable} ${cinzel.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
