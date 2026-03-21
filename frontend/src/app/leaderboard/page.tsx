"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Reviewer {
  reviewer_address: string;
  wins: number;
  total_jobs: number;
  win_rate: number;
  score: number;
  total_stake?: number;
}

export default function Leaderboard() {
  const [data, setData] = useState<Reviewer[]>([]);
  const [timeFilter, setTimeFilter] = useState("24h");

  useEffect(() => {
    api.getLeaderboard().then(setData);
  }, []);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const topValidator = data.length > 0 ? data[0] : null;

  return (
    <div className="max-w-6xl mx-auto px-8 pt-8 pb-12 min-h-screen mesh-shimmer">
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-4xl lg:text-5xl font-[family-name:var(--font-headline)] font-bold text-primary tracking-tighter uppercase mb-2">
          Network Authority
        </h1>
        <p className="text-on-surface-variant text-lg italic opacity-80">
          Climb the only leaderboard where being right about AI prints yield.
        </p>
      </div>

      {/* Top Entry: Holographic Hero Profile */}
      {topValidator && (
        <section className="mb-16">
          <div className="holographic-glow rounded-xl p-8 flex flex-col md:flex-row gap-10 items-center overflow-hidden relative group">
            {/* Rank Badge */}
            <div className="absolute top-4 right-4 bg-primary/20 border border-primary/40 px-3 py-1 text-primary font-[family-name:var(--font-mono)] text-sm tracking-tighter">
              RANK #1 // GLOBAL_VALIDATOR
            </div>

            {/* Avatar */}
            <div className="relative">
              <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-primary/50 relative z-10 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <svg className="w-20 h-20 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-tertiary rounded-full pulse-tertiary border-4 border-surface-container flex items-center justify-center">
                <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-3xl font-[family-name:var(--font-headline)] font-bold text-white mb-1">
                  {truncate(topValidator.reviewer_address)}
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-xs text-secondary tracking-widest uppercase">
                  ID: {topValidator.reviewer_address}
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant font-[family-name:var(--font-mono)] uppercase">Signal Accuracy</p>
                  <p className="text-3xl font-[family-name:var(--font-headline)] font-bold text-primary tracking-tighter">
                    {(topValidator.win_rate * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant font-[family-name:var(--font-mono)] uppercase">Score</p>
                  <p className="text-3xl font-[family-name:var(--font-headline)] font-bold text-tertiary tracking-tighter">
                    {topValidator.score.toFixed(1)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant font-[family-name:var(--font-mono)] uppercase">Evaluations</p>
                  <p className="text-3xl font-[family-name:var(--font-headline)] font-bold text-white tracking-tighter">
                    {topValidator.total_jobs.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant font-[family-name:var(--font-mono)] uppercase">Wins</p>
                  <p className="text-3xl font-[family-name:var(--font-headline)] font-bold text-secondary tracking-tighter">
                    {topValidator.wins}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button className="bg-surface-container-highest border border-primary/20 hover:border-primary/60 text-primary-fixed px-6 py-2 text-xs font-[family-name:var(--font-headline)] font-bold uppercase tracking-widest transition-all">
                  View Full On-Chain Reputation
                </button>
                <button className="bg-white/5 hover:bg-white/10 text-white/60 px-6 py-2 text-xs font-[family-name:var(--font-headline)] font-bold uppercase tracking-widest transition-all">
                  Share Profile
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard Table Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-surface-container-low rounded-lg overflow-hidden">
            <div className="p-6 border-b border-outline-variant/15 flex justify-between items-center">
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg uppercase tracking-tight">Active Validators</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeFilter("24h")}
                  className={`text-[10px] font-[family-name:var(--font-mono)] px-2 py-1 rounded ${
                    timeFilter === "24h" ? "bg-primary/10 text-primary" : "text-on-surface-variant"
                  }`}
                >
                  24H
                </button>
                <button
                  onClick={() => setTimeFilter("all")}
                  className={`text-[10px] font-[family-name:var(--font-mono)] px-2 py-1 ${
                    timeFilter === "all" ? "bg-primary/10 text-primary" : "text-on-surface-variant"
                  }`}
                >
                  ALL TIME
                </button>
              </div>
            </div>

            {data.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-[family-name:var(--font-mono)] text-sm">
                No reputation data yet. Submit reviews and run the buyer agent to see scores.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] text-on-surface-variant font-[family-name:var(--font-mono)] uppercase tracking-widest border-b border-outline-variant/15">
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Validator</th>
                      <th className="px-6 py-4 text-right">Accuracy</th>
                      <th className="px-6 py-4 text-right">Score</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {data.slice(1).map((r, i) => (
                      <tr key={r.reviewer_address} className="hover:bg-surface-bright/5 transition-colors group">
                        <td className="px-6 py-4 font-[family-name:var(--font-mono)] text-primary">#{String(i + 2).padStart(2, "0")}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-secondary/40 to-primary/40 p-[1px]">
                              <div className="bg-background w-full h-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                                </svg>
                              </div>
                            </div>
                            <a
                              href={`https://basescan.org/address/${r.reviewer_address}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-[family-name:var(--font-headline)] font-medium group-hover:text-primary transition-colors"
                            >
                              {truncate(r.reviewer_address)}
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-[family-name:var(--font-mono)] text-on-surface">
                          {(r.win_rate * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-right font-[family-name:var(--font-mono)] text-tertiary">
                          {r.score.toFixed(1)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${r.wins > 0 ? "bg-tertiary pulse-tertiary" : "bg-on-surface-variant"}`} />
                            <span className={`text-[10px] font-[family-name:var(--font-mono)] uppercase ${r.wins > 0 ? "text-tertiary" : "text-on-surface-variant"}`}>
                              {r.wins > 0 ? "Active" : "Idle"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button className="w-full py-4 text-xs font-[family-name:var(--font-mono)] text-on-surface-variant hover:text-white transition-colors bg-surface-container-high/50">
              LOAD_MORE_RECORDS_V1.0
            </button>
          </div>
        </div>

        {/* Reputation Profile Sidebar */}
        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-lg p-6">
            <h4 className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-widest text-primary mb-6">
              Protocol Info
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-md border-l-2 border-secondary">
                <div className="w-10 h-10 bg-secondary/20 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-[family-name:var(--font-headline)] font-bold">ERC-8183 Jobs</p>
                  <p className="text-[10px] font-[family-name:var(--font-mono)] text-on-surface-variant">Agentic Commerce Lifecycle</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-md border-l-2 border-primary">
                <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-[family-name:var(--font-headline)] font-bold">ERC-8004 Receipts</p>
                  <p className="text-[10px] font-[family-name:var(--font-mono)] text-on-surface-variant">On-chain Reputation Registry</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-md border-l-2 border-tertiary">
                <div className="w-10 h-10 bg-tertiary/20 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-[family-name:var(--font-headline)] font-bold">x402 Micropayments</p>
                  <p className="text-[10px] font-[family-name:var(--font-mono)] text-on-surface-variant">Agent-to-Human Value Transfer</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-lg p-6">
            <h4 className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-widest text-tertiary mb-6">
              Top Validator Stats
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-[family-name:var(--font-mono)]">
                <span className="text-on-surface-variant">Jobs Completed</span>
                <span className="text-white">{topValidator ? topValidator.total_jobs.toLocaleString() : "0"}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-[family-name:var(--font-mono)]">
                <span className="text-on-surface-variant">Wins</span>
                <span className="text-white">{topValidator ? topValidator.wins : "0"}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-[family-name:var(--font-mono)]">
                <span className="text-on-surface-variant">Win Rate</span>
                <span className="text-primary">{topValidator ? (topValidator.win_rate * 100).toFixed(1) + "%" : "—"}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-[family-name:var(--font-mono)]">
                <span className="text-on-surface-variant">Total Staked</span>
                <span className="text-tertiary">{topValidator?.total_stake?.toFixed(1) ?? "0"} USDC</span>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant/15">
                <p className="text-[10px] text-on-surface-variant uppercase mb-3">Network</p>
                <div className="text-[10px] font-[family-name:var(--font-mono)] text-tertiary space-y-1">
                  <p>&gt; Chain: Base Sepolia (84532)</p>
                  <p>&gt; Protocol: ERC-8183 + ERC-8004</p>
                  <p>&gt; Yield: Lido wstETH</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
