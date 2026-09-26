import Image from 'next/image'

export default function Home() {
  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: '#1c1918',
        color: 'white',
      }}
    >
      <DotsBackground />
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      ></section>
      <Expo />;
      <Footer />
    </main>
  )
}
