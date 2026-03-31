import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { InventraXWordmark } from '../ui/InventraXWordmark'
import { authHeroUrls } from './authHero'

function HeroPanel({ mode }: { mode: 'login' | 'signup' }) {
  const src = useMemo(() => {
    const [loginHero, signupHero] = authHeroUrls()
    return mode === 'login' ? loginHero : signupHero
  }, [mode])

  return (
    <div className="relative min-h-[220px] overflow-hidden bg-slate-900 sm:min-h-[280px] lg:min-h-[640px]">
      <img
        key={src}
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        fetchPriority="high"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/45"
        aria-hidden
      />

      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium tracking-wide text-white/90">
            Smart inventory
          </p>
          <div className="flex flex-wrap items-center justify-end">
            {mode === 'login' ? (
              <Link
                to="/signup"
                className="text-sm font-semibold text-white transition hover:text-white/90"
              >
                Sign up
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-sm font-semibold text-white transition hover:text-white/90"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-sm font-bold text-white backdrop-blur-sm"
            aria-hidden
          >
            IX
          </div>
          <div>
            <p className="font-semibold text-white">InventraX</p>
            <p className="text-sm text-white/75">Logistics &amp; orders</p>
          </div>
        </div>
      </div>
    </div>
  )
}

type Props = {
  children: ReactNode
  /** login = hero prompts sign up; signup = hero prompts sign in */
  mode: 'login' | 'signup'
}

export function AuthLayout({ children, mode }: Props) {
  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-5 sm:py-10 md:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-white shadow-[0_25px_80px_-20px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/80 md:rounded-[3rem]">
        <div className="grid lg:grid-cols-2">
          <HeroPanel mode={mode} />
          <div className="flex flex-col px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <div className="mb-8 sm:mb-10">
              <Link to="/login" className="transition hover:opacity-90">
                <InventraXWordmark size="lg" />
              </Link>
            </div>
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
