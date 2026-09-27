import UIUXPage from '@/pageComponents/Team/uiux/page'
import FrontendPage from '@/pageComponents/Team/frontend/page'
import BackendPage from '@/pageComponents/Team/backend/page'
import LeadPage from '@/pageComponents/Team/lead/page'
import Footer from '@/components/Footer'
import AmbientBackground from '@/components/AmbientBackground'
import glow from '@/components/glow'
import lightstate from '@/components/lightstate'

export default function Home() {
  return (
    <div className='relative flex min-h-screen flex-col justify-end overflow-hidden'>
    <glow />
      <div className='absolute inset-0 z-0'>
        <AmbientBackground />
      </div>
      <div className='relative z-10 w-full make'>
        <Footer />
      </div>
    </div>
  )
}
