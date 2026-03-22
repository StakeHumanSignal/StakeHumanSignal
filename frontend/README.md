# frontend/ — Next.js Dashboard

**Track:** Open Track (all tracks) | **Live:** [stakehumansignal.vercel.app](https://stakehumansignal.vercel.app)

## What This Does

Dark, crypto-native dashboard built with Next.js 16, Tailwind CSS 4, and RainbowKit. 7 pages displaying real marketplace data from the Railway API. Follows the design spec in `docs/design.md` — Space Grotesk + JetBrains Mono typography, teal-cyan + amber palette, high information density.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero with live stats, protocol architecture bento grid, ticker |
| `/marketplace` | Marketplace | Review list with rubric bars, live agent feed sidebar |
| `/submit` | Submit Review | Evaluation form with rubric sliders, stake amount, wallet connect |
| `/leaderboard` | Leaderboard | Top validators with holographic hero profile, data table |
| `/agent-feed` | Agent Feed | Terminal-style log viewer with auto-refresh (10s) |
| `/validate` | Validate | Blind A/B comparison — pick output, settle session |
| `/town-square` | Town Square | Canvas visualization of agent-reviewer-protocol interactions |

## How to Run

```bash
cd frontend
bun install
bun dev
# → http://localhost:3000
```

## How to Build

```bash
bun run build   # 0 errors, 10 static pages
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://stakesignal-api-production.up.railway.app` | Backend API |

## Stack

- **Next.js 16** with Turbopack
- **Tailwind CSS 4** with `@theme inline` custom tokens
- **RainbowKit + wagmi + viem** for wallet connection
- **Space Grotesk** (headings) + **JetBrains Mono** (data) + **Inter** (body)
- **lucide-react** icons

## Key Files

- `src/app/page.tsx` — Landing page with live stats
- `src/app/marketplace/page.tsx` — Review marketplace with live feed
- `src/app/submit/page.tsx` — Review submission form
- `src/app/town-square/page.tsx` — Canvas network visualization
- `src/lib/api.ts` — API client
- `src/lib/wagmi.ts` — Wallet config
- `src/app/globals.css` — Design tokens, glass effects, animations
