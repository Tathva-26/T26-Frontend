/**
 * next/image refuses any remote host that is not listed here and answers
 * 400 on the image itself — which looks like a broken file rather than a
 * config error, so a missing host here is expensive to debug.
 *
 * `cdn.tathva.org` must match the backend's `R2_PUBLIC_URL` host. If R2 is
 * ever fronted by a new hostname, this list has to change in the same
 * release, or every event cover and avatar breaks at once.
 */
const imageHost = process.env.NEXT_PUBLIC_IMAGE_HOST || 'cdn.tathva.org'

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  images: {
    // Serve images straight from the CDNs below instead of through Vercel's
    // image optimiser: the plan's optimisation quota ran out and /_next/image
    // started answering 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED).
    unoptimized: true,
    remotePatterns: [
      // Event covers and profile pictures, served from R2.
      { protocol: 'https', hostname: imageHost },
      // Static assets moved out of public/.
      { protocol: 'https', hostname: 'cdn-next.tathva.org' },
      { protocol: 'https', hostname: 'cdn-next-main.tathva.org' },
      // Google avatars, used until a user uploads their own picture.
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // The certificates API reads its (encrypted) data from disk at runtime, which
  // file tracing can't see on its own.
  outputFileTracingIncludes: {
    '/api/certificates/*': ['./certificates-data/**/*'],
  },
}

export default nextConfig