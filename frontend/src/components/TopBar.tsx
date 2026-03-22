'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { WalletDisplay } from './WalletDisplay'
import { NAV_ROUTES } from '@/lib/nav-routes'

export function TopBar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <>
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.05)]">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter text-[#00F0FF] font-[family-name:var(--font-headline)] uppercase">
            StakeHumanSignal
          </Link>
          <div className="hidden md:flex items-center gap-6 font-[family-name:var(--font-headline)] tracking-tight text-sm uppercase">
            {NAV_ROUTES.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`transition-colors ${
                  isActive(n.href) ? 'text-primary' : 'text-white/60 hover:text-white'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-white/5">
            <span className="text-[10px] text-white/40 font-[family-name:var(--font-mono)]">STAKED:</span>
            <span className="text-xs font-[family-name:var(--font-mono)] text-primary">0.00 wstETH</span>
          </div>
          <WalletDisplay />
          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white/60 hover:text-white p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full z-40 bg-[#131313] border-b border-white/10 py-4 px-6 space-y-2">
          {NAV_ROUTES.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMobileOpen(false)}
              className={`block py-3 px-4 font-[family-name:var(--font-headline)] text-sm uppercase tracking-tight transition-colors ${
                isActive(n.href) ? 'text-primary bg-primary/10' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
