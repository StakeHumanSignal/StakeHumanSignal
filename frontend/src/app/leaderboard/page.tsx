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
              Recent ERC-8004 Mints
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-md border-l-2 border-secondary">
                <div className="w-10 h-10 bg-secondary/20 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-[family-name:var(--font-headline)] font-bold">Deepfake Oracle #812</p>
                  <p className="text-[10px] font-[family-name:var(--font-mono)] text-on-surface-variant">Minted 2h ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-md border-l-2 border-primary">
                <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-[family-name:var(--font-headline)] font-bold">LLM Consistency Badge</p>
                  <p className="text-[10px] font-[family-name:var(--font-mono)] text-on-surface-variant">Minted 1d ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-md border-l-2 border-tertiary">
                <div className="w-10 h-10 bg-tertiary/20 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.652 3.182 1.4-6.4L2.005 7.5l6.545-.89L12 1l3.45 5.61 6.545.89-4.163 4.452 1.4 6.4-5.652-3.182zm0 0L12 15.25" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-[family-name:var(--font-headline)] font-bold">Logic Arbiter III</p>
                  <p className="text-[10px] font-[family-name:var(--font-mono)] text-on-surface-variant">Minted 3d ago</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-lg p-6">
            <h4 className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-widest text-tertiary mb-6">
              ERC-8183 Evaluator History
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-[family-name:var(--font-mono)]">
                <span className="text-on-surface-variant">Jobs Completed</span>
                <span className="text-white">{topValidator ? topValidator.total_jobs.toLocaleString() : "0"}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-[family-name:var(--font-mono)]">
                <span className="text-on-surface-variant">Avg. Response Time</span>
                <span className="text-white">12.4s</span>
              </div>
              <div className="flex justify-between items-center text-xs font-[family-name:var(--font-mono)]">
                <span className="text-on-surface-variant">Reliability Score</span>
                <span className="text-primary">99.2%</span>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant/15">
                <p className="text-[10px] text-on-surface-variant uppercase mb-3">Recent Activity</p>
                <div className="text-[10px] font-[family-name:var(--font-mono)] text-tertiary space-y-1">
                  <p>&gt; Task #4829 validated [SUCCESS]</p>
                  <p>&gt; Stake finalized for epoch 92 [0.42 ETH]</p>
                  <p>&gt; Reputation score increased +0.02</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
