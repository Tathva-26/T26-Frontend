import './globals.css'

export const metadata = {
  title: "Tathva '26",
  description: "Official website for Tathva '26",
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='h-full antialiased'>
      <body className='min-h-full flex flex-col'>{children}</body>
    </html>
  )
}
