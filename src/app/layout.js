import './globals.css'

export const metadata = {
  title: "Tech Conclave - Tathva '26",
  description: "Tech Conclave - Talks, Shows, Conversations, Experiences",
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='h-full antialiased'>
      <body className='min-h-full flex flex-col'>{children}</body>
    </html>
  )
}
