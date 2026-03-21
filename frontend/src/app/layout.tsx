import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { TopBar } from "@/components/TopBar";
import { SideNav } from "@/components/SideNav";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "StakeHumanSignal | Autonomous Subjectivity Oracle",
  description: "Staked human feedback marketplace on Base. ERC-8183 + ERC-8004 + x402.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="min-h-screen bg-background text-on-surface font-[family-name:var(--font-body)]">
        <Providers>
        {/* TopAppBar */}
        <TopBar />

        {/* SideNavBar */}
        <SideNav />

        {/* Main Content */}
        <main className="pt-16 pb-12 md:pl-20 min-h-screen">
          {children}
        </main>

        {/* Bottom Terminal Bar */}
        <footer className="fixed bottom-0 w-full z-50 flex items-center px-4 h-8 bg-[#000000] border-t border-[#00F0FF]/20 overflow-hidden font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest cursor-pointer">
          <div className="flex items-center gap-3 text-tertiary animate-pulse">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Live Network Feed: x402 Payments &amp; ERC-8004 Mints [Active]</span>
          </div>
          <div className="ml-auto flex items-center gap-6 text-white/40">
            <span>Base Mainnet</span>
            <span className="hidden md:block">ERC-8183 + x402</span>
          </div>
        </footer>
        </Providers>
      </body>
    </html>
  );
}

