import { Suspense } from 'react'
import AuthCallback from '@/pageComponents/AuthCallback/AuthCallback'

export const metadata = {
  title: "Signing in - Tathva '26",
}

export default function AuthCallbackPage() {
  // useSearchParams needs a Suspense boundary to stay out of the static shell.
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#06070d] text-slate-100">
          <p className="text-sm text-slate-400">One moment.</p>
        </main>
      }
    >
      <AuthCallback />
    </Suspense>
  )
}
