'use client'
import Link from 'next/link'
import { WalletDisplay } from './WalletDisplay'

const TOP_NAV = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/submit', label: 'Submission' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export function TopBar() {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.05)]">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold tracking-tighter text-[#00F0FF] font-[family-name:var(--font-headline)] uppercase">
          StakeHumanSignal
        </Link>
        <div className="hidden md:flex items-center gap-6 font-[family-name:var(--font-headline)] tracking-tight text-sm uppercase">
          {TOP_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-white/60 hover:text-white transition-colors"
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
      </div>
    </nav>
  )
}
