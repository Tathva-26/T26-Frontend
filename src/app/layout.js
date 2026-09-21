import localFont from "next/font/local";
import "./globals.css";

// Figma: "Instrument Serif" (exact match) — used for badge text
const instrumentSerif = localFont({
  src: "../../public/fonts/instrument-serif-regular.ttf",
  variable: "--font-instrument-serif",
  display: "swap",
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

export const metadata = {
  title: "Tathva '26",
  description: "Official website for Tathva '26",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${calmSerif.variable} ${alata.variable} ${akiraExpanded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
