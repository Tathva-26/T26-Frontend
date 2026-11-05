import Certificates from '@/pageComponents/Certificates/Certificates'

export const metadata = {
  title: 'Certificates',
  description: "Download your Tathva '26 participation certificates.",
  robots: { index: false },
}

export default function CertificatesPage() {
  return <Certificates />
}
