import './globals.css'
import { UserProvider } from '@/context/UserContext'
import ReferralCapture from '@/components/ReferralCapture'

export const metadata = {
  metadataBase: new URL('https://tathva.org'),

  title: {
    default: "Tathva '26 | NIT Calicut",
    template: "%s | Tathva '26",
  },

  description:
    "Tathva '26 is the annual techno-management festival of NIT Calicut. Explore technical competitions, workshops, talks, exhibitions, and unforgettable experiences.",

  applicationName: "Tathva '26",

  keywords: [
    'Tathva 2026',
    'Tathva',
    'Tathva NIT Calicut',
    'NIT Calicut Tech Fest',
    'NITC',
    'Tech Fest Kerala',
    'National Level Tech Fest',
    'Techno Management Festival',
    'Tathva Events',
    'Tathva Competitions',
    'Tathva Workshops',
    'Tathva Tech Conclave',
  ],

  authors: [{ name: 'Tathva, NIT Calicut' }],
  creator: 'Tathva, NIT Calicut',
  publisher: 'National Institute of Technology Calicut',

  alternates: {
    canonical: '/',
  },

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://tathva.org',
    siteName: "Tathva '26",
    title: "Tathva '26 | National Level Techno-Management Fest",
    description:
      "Innovation meets imagination. Experience technical competitions, workshops, talks, shows, and unforgettable experiences at Tathva '26, NIT Calicut.",
  },

  twitter: {
    card: 'summary',
    title: "Tathva '26 | NIT Calicut",
    description:
      "Explore competitions, workshops, talks, shows, and experiences at Tathva '26.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  category: 'technology',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='h-full antialiased'>
      <body className='min-h-full flex flex-col'>
        {/* One session for the whole app: every page reads it, and every 401
from anywhere routes to the single handler inside. */}
        <UserProvider>
          <ReferralCapture />
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
