"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function Home() {
  const [reviewCount, setReviewCount] = useState(0);
  const [validatorCount, setValidatorCount] = useState(0);
  const [totalStake, setTotalStake] = useState(0);
  const [agentEvents, setAgentEvents] = useState(0);

  useEffect(() => {
    api.getReviews().then((r) => {
      const reviews = Array.isArray(r) ? r : [];
      setReviewCount(reviews.length);
      setTotalStake(reviews.reduce((sum: number, rev: { stake_amount?: number }) => sum + (rev.stake_amount ?? 0), 0));
    });
    api.getLeaderboard().then((d) => {
      setValidatorCount(Array.isArray(d) ? d.length : 0);
    });
    api.getAgentLog().then((d) => {
      setAgentEvents(Array.isArray(d) ? d.length : 0);
    });
  }, []);

  return (
    <div className="pb-32">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[716px]">
        <div className="lg:col-span-7 space-y-8">
          <h1 className="font-[family-name:var(--font-headline)] text-5xl md:text-7xl font-bold leading-[1.1] tracking-tighter">
            HUMANS STAKE <span className="text-primary">SKIN</span>. <br />
            AGENTS BUY <span className="text-secondary">TRUTH</span>. <br />
            YIELD FLOWS <span className="text-tertiary">FOREVER</span>.
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-xl leading-relaxed">
            Agents waste thousands on subpar LLMs because reviews are free and fake. StakeHumanSignal fixes that: real
            economic skin from humans, x402 micropayments from agents, permanent Filecoin + Base proof, and Lido wstETH
            yield rewards for being right.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/submit"
              className="bg-primary-container text-on-primary-container px-8 py-4 font-[family-name:var(--font-headline)] font-bold text-sm tracking-widest uppercase hover:brightness-110 transition-all shadow-atmospheric text-center"
            >
              START STAKING &amp; EARN wstETH
            </Link>
            <Link
              href="/marketplace"
              className="border border-secondary text-secondary px-8 py-4 font-[family-name:var(--font-headline)] font-bold text-sm tracking-widest uppercase hover:bg-secondary/5 transition-all text-center"
            >
              VIEW MARKETPLACE
            </Link>
          </div>
        </div>

        {/* Floating Holographic Badge */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="glass-gradient p-8 rounded-xl border border-primary/20 shadow-atmospheric relative w-full max-w-sm group hover:scale-105 transition-transform duration-700">
            <div className="absolute -top-4 -right-4 bg-tertiary-container text-on-tertiary px-3 py-1 rounded-sm text-[10px] font-[family-name:var(--font-mono)] font-bold uppercase tracking-widest neon-pulse">
              LIVE_SIGNAL
            </div>
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-1">
                <h3 className="font-[family-name:var(--font-mono)] text-xs text-white/40">NODE_IDENTITY</h3>
                <p className="font-[family-name:var(--font-headline)] text-xl font-bold tracking-tight">LLM-01_PRECISION</p>
              </div>
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                  <h3 className="font-[family-name:var(--font-mono)] text-[10px] text-white/40 uppercase">Economic Skin</h3>
                  <p className="text-2xl font-[family-name:var(--font-headline)] font-bold">
                    4.20 <span className="text-sm text-secondary">wstETH</span>
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="font-[family-name:var(--font-mono)] text-[10px] text-white/40 uppercase">x402 Flow</h3>
                  <p className="text-tertiary font-[family-name:var(--font-mono)]">+0.0021</p>
                </div>
              </div>
              <div className="bg-black/40 p-4 rounded-lg border border-white/5 font-[family-name:var(--font-mono)] text-[10px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/40">PROTOCOL</span>
                  <span className="text-primary">ERC-8004</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">ATTESTATION</span>
                  <span className="text-white/80 truncate ml-4">0x71C...8E23</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="font-[family-name:var(--font-mono)] text-[10px] text-white/40 uppercase tracking-widest">Staked Verdicts</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-[family-name:var(--font-headline)] font-bold">{reviewCount.toLocaleString()}</span>
              <span className="text-xs text-tertiary neon-pulse px-1 font-[family-name:var(--font-mono)]">LIVE</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-[family-name:var(--font-mono)] text-[10px] text-white/40 uppercase tracking-widest">Total Staked</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-[family-name:var(--font-headline)] font-bold text-tertiary">{totalStake.toFixed(1)}</span>
              <span className="text-[10px] text-white/40 font-[family-name:var(--font-mono)]">USDC</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-[family-name:var(--font-mono)] text-[10px] text-white/40 uppercase tracking-widest">Agent Events</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-[family-name:var(--font-headline)] font-bold">{agentEvents.toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-[family-name:var(--font-mono)] text-[10px] text-white/40 uppercase tracking-widest">Active Validators</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-[family-name:var(--font-headline)] font-bold text-primary">{validatorCount}</span>
              <span className="text-[10px] text-white/40 font-[family-name:var(--font-mono)]">ERC-8004</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="w-full bg-[#000000] h-12 border-y border-[#00F0FF]/10 flex items-center overflow-hidden mb-20">
        <div className="flex whitespace-nowrap gap-12 px-6 animate-marquee">
          <div className="flex items-center gap-3">
            <span className="text-primary font-[family-name:var(--font-mono)] text-[10px]">LIVE</span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-white/60">AGENT 0x4f...21 PAID x402 -&gt; +0.005 wstETH REWARD MINTED</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-secondary font-[family-name:var(--font-mono)] text-[10px]">ALERT</span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-white/60">NEW SUBMISSION: LLM_LATENCY_TEST_V2 BY 0x92...11</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-tertiary font-[family-name:var(--font-mono)] text-[10px]">SETTLED</span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-white/60">VERDICT #8821 EPOCH 402 COMPLETE -&gt; 12.1% YIELD REVENUE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-primary font-[family-name:var(--font-mono)] text-[10px]">LIVE</span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-white/60">AGENT 0x4f...21 PAID x402 -&gt; +0.005 wstETH REWARD MINTED</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-secondary font-[family-name:var(--font-mono)] text-[10px]">ALERT</span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-white/60">NEW SUBMISSION: LLM_LATENCY_TEST_V2 BY 0x92...11</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-tertiary font-[family-name:var(--font-mono)] text-[10px]">SETTLED</span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-white/60">VERDICT #8821 EPOCH 402 COMPLETE -&gt; 12.1% YIELD REVENUE</span>
          </div>
        </div>
      </div>

      {/* Protocol Architecture (Bento Grid) */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-[family-name:var(--font-headline)] text-3xl font-bold mb-12 tracking-tight">Protocol Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="md:col-span-2 bg-surface-container-low p-8 rounded-lg border border-white/5 hover:border-primary/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <svg className="w-20 h-20 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-headline)] text-2xl font-bold mb-4">Programmable Subjectivity</h3>
            <p className="text-on-surface-variant leading-relaxed max-w-md">
              Unlike price oracles, we verify what cannot be computed: the quality of an agent&apos;s response, the safety of a prompt, and the nuance of human-AI interaction.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-low p-8 rounded-lg border border-white/5 hover:border-secondary/40 transition-all group">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-headline)] text-xl font-bold mb-4">x402 Micropayments</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Instant, high-frequency value transfer from agents to human validators at the millisecond scale.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-low p-8 rounded-lg border border-white/5 hover:border-tertiary/40 transition-all group">
            <div className="w-12 h-12 bg-tertiary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-4.179 2.25m0 0L12 17.25l-5.571-3" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-headline)] text-xl font-bold mb-4">Lido Integration</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Your stake never sits idle. All skin-in-the-game is converted to wstETH, capturing baseline ETH yield on top of oracle fees.
            </p>
          </div>

          {/* Card 4 */}
          <div className="md:col-span-2 bg-surface-container-low p-8 rounded-lg border border-white/5 hover:border-primary/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <svg className="w-20 h-20 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-headline)] text-2xl font-bold mb-4">The Base Advantage</h3>
            <p className="text-on-surface-variant leading-relaxed max-w-md">
              Built on Base for sub-cent transaction costs, with perpetual data availability anchored to Filecoin via ERC-8004 attestations.
            </p>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="w-full py-20 px-6 flex flex-col items-center gap-8 bg-[#0e0e0e] border-t border-white/5">
        <div className="flex gap-8 items-center flex-wrap justify-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          <span className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-tighter">ERC-8004</span>
          <span className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-tighter">ERC-8183</span>
          <span className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-tighter">Docs</span>
          <span className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-tighter">Lido</span>
          <span className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-tighter">Filecoin</span>
          <span className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-tighter">Base</span>
        </div>
        <p className="text-white/40 font-[family-name:var(--font-headline)] text-[10px] uppercase tracking-tighter text-center max-w-2xl leading-relaxed">
          2024 StakeHumanSignal. Decentralized Subjectivity Oracle for Autonomous Agents. Built on frontiers of human-AI economic coordination.
        </p>
      </footer>
    </div>
  );
}
