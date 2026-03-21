import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Github } from "lucide-react";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StakeHumanSignal",
  description: "Staked human feedback marketplace on Base",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/submit", label: "Submit Review" },
  { href: "/agent-feed", label: "Agent Feed" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen flex bg-[#0A0A0F] text-[#F9FAFB]">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-r border-[#1F2937] bg-[#0A0A0F] sticky top-0 h-screen flex flex-col">
          <div className="p-5 border-b border-[#1F2937]">
            <Link href="/" className="text-lg font-bold text-white">
              StakeHuman<span className="text-[#00D4AA]">Signal</span>
            </Link>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="block px-3 py-2 rounded-lg text-sm text-[#6B7280] hover:text-white hover:bg-[#111118] transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-[#1F2937] flex items-center justify-between">
            <span className="text-xs text-[#00D4AA] bg-[#111118] px-2 py-1 rounded font-mono">
              Base Sepolia
            </span>
            <a
              href="https://github.com/StakeHumanSignal/StakeHumanSignal"
              target="_blank"
              rel="noreferrer"
              className="text-[#6B7280] hover:text-white"
            >
              <Github size={16} />
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
