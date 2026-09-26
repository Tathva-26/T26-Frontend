import Image from 'next/image'
import Footer from '@/components/Footer'
import { DotsBackground } from '@/components/AmbientBackground'
import ExpoPage from './expo/page'

export default function Home() {
  return (
    <>
      <style>{`
        main {
          height: auto !important;
          overflow: visible !important;
        }
      `}</style>
      <DotsBackground style={{ position: 'fixed' }} />
      <ExpoPage />
      <Footer />
    </>
  )
}
