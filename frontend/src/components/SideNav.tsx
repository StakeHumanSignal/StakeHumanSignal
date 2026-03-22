'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ROUTES } from '@/lib/nav-routes'

const ROUTE_ICONS: Record<string, string> = {
  "/marketplace": "grid_view",
  "/submit": "work_outline",
  "/leaderboard": "leaderboard",
  "/agent-feed": "terminal",
  "/town-square": "hub",
  "/validate": "verified_user",
}

const ICONS: Record<string, React.ReactNode> = {
  grid_view: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  work_outline: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  leaderboard: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  terminal: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  hub: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
      <line x1="9.5" y1="10.5" x2="6.5" y2="7.5" />
      <line x1="14.5" y1="10.5" x2="17.5" y2="7.5" />
      <line x1="9.5" y1="13.5" x2="6.5" y2="16.5" />
      <line x1="14.5" y1="13.5" x2="17.5" y2="16.5" />
    </svg>
  ),
  verified_user: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
}

export function SideNav() {
  const pathname = usePathname()
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col z-[60] bg-[#131313] w-20 hover:w-64 transition-all duration-500 border-r border-white/5 font-[family-name:var(--font-mono)] text-xs overflow-hidden group">
      <div className="p-6 mb-8 flex items-center gap-4">
        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          <div className="text-[#00F0FF] font-black uppercase text-sm">SHS_TERMINAL</div>
          <div className="text-white/40 text-[10px]">v1.0.4-beta</div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {NAV_ROUTES.map((item) => {
          const active = isActive(item.href)
          const iconKey = ROUTE_ICONS[item.href]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 p-3 transition-all cursor-pointer ${
                active
                  ? "text-primary bg-primary/10 border-l-2 border-primary"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {(iconKey && ICONS[iconKey]) || <span className="w-5 h-5 shrink-0" />}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 space-y-4">
        <Link href="/submit" className="w-full block bg-primary/10 border border-primary/20 text-primary py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs uppercase font-bold text-center">
          Deploy Agent
        </Link>
      </div>
    </aside>
  )
}
