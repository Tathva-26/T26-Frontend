import './globals.css'
import { UserProvider } from '@/context/UserContext'

export const metadata = {
  title: "Tech Conclave - Tathva '26",
  description: 'Tech Conclave - Talks, Shows, Conversations, Experiences',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='h-full antialiased'>
      <body className='min-h-full flex flex-col'>
        {/* One session for the whole app: every page reads it, and every 401
            from anywhere routes to the single handler inside. */}
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  )
}
