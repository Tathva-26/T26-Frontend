import Image from 'next/image'
import Footer from '@/components/Footer'
import { DotsBackground } from '@/components/AmbientBackground'
import ExpoPage from './expo/page'

export default function Home() {
  return (
    <>
      <DotsBackground />
      <ExpoPage />;
      <Footer />
    </>
  )
}
