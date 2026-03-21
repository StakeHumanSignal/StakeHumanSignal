"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { api } from "@/lib/api";

const RUBRICS = [
  { key: "correctness", label: "Logical Consistency", weight: "30%" },
  { key: "efficiency", label: "Emergent Strategy", weight: "25%" },
  { key: "relevance", label: "Security Protocol", weight: "20%" },
  { key: "completeness", label: "Computational Efficiency", weight: "15%" },
  { key: "reasoning_quality", label: "Output Novelty", weight: "10%" },
];

export default function Submit() {
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState({
    reviewer_address: "",
    task_intent: "",
    task_type: "analysis",
    winner: "policy_a" as string,
    reasoning: "",
    stake_amount: "1.0",
    stake_tx_hash: "0xdemo",
    api_url: "https://api.openai.com/v1/chat/completions",
    review_text: "",
    rubric_scores: { correctness: 0.8, efficiency: 0.72, relevance: 0.9, completeness: 0.65, reasoning_quality: 0.5 },
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [result, setResult] = useState<{ id?: string; filecoin_cid?: string } | null>(null);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (isConnected && address) {
      setForm((f) => ({ ...f, reviewer_address: address }));
    }
  }, [isConnected, address]);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const setRubric = (k: string, v: number) =>
    setForm((f) => ({ ...f, rubric_scores: { ...f.rubric_scores, [k]: v } }));

  const liveScore = Object.values(form.rubric_scores).reduce((a, b) => a + b, 0) / Object.values(form.rubric_scores).length * 100;

  const submit = async () => {
    if (!form.reviewer_address || !form.task_intent || !form.reasoning) {
      alert("Fill required fields: wallet address, task intent, reasoning");
      return;
    }
    setStatus("submitting");
    try {
      const res = await api.submitReview({
        ...form,
        review_text: form.reasoning,
        stake_amount: parseFloat(form.stake_amount),
      });
      setResult(res);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-12 grid grid-cols-12 gap-8">
      {/* Submission Header */}
      <div className="col-span-12 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-tertiary/10 text-tertiary text-[10px] font-[family-name:var(--font-mono)] px-2 py-0.5 border border-tertiary/20">
            JOB_ID: ERC-8183-X92
          </span>
          <span className="text-on-surface-variant text-xs font-[family-name:var(--font-mono)] uppercase tracking-widest">
            Active Task: Model Comparison
          </span>
        </div>
        <h1 className="text-4xl font-[family-name:var(--font-headline)] font-bold text-on-surface tracking-tight">
          Evaluate Model A vs Model B
        </h1>
        <p className="text-on-surface-variant max-w-2xl mt-2 text-sm">
          Complex prompt evaluation regarding emergent reasoning in multi-agent cross-chain settlement protocols.
        </p>
      </div>

      {/* Left Column: Rubric & Feedback */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {/* Rubric Section */}
        <section className="bg-surface-container-low p-6 border border-white/5 rounded-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-[family-name:var(--font-headline)] text-lg font-medium text-primary uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              </svg>
              Evaluation Rubric
            </h2>
            <div className="font-[family-name:var(--font-mono)] text-[10px] text-tertiary animate-pulse">
              LIVE SCORE: {liveScore.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-8">
            {RUBRICS.map(({ key, label, weight }) => {
              const val = form.rubric_scores[key as keyof typeof form.rubric_scores];
              return (
                <div key={key} className="group">
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-xs font-[family-name:var(--font-mono)] uppercase text-on-surface-variant">
                      {label} <span className="text-primary/40">({weight} Weight)</span>
                    </label>
                    <span className="text-primary font-[family-name:var(--font-mono)] text-sm">
                      {(val * 10).toFixed(1)}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.01"
                    className="w-full"
                    value={val}
                    onChange={(e) => setRubric(key, parseFloat(e.target.value))}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Wallet Address */}
        <section className="bg-surface-container p-6 border border-white/5">
          <h2 className="font-[family-name:var(--font-headline)] text-sm font-medium text-on-surface uppercase tracking-widest mb-4">
            Wallet Address
          </h2>
          {isConnected ? (
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant p-4 font-[family-name:var(--font-mono)] text-xs text-on-surface-variant focus:border-primary focus:ring-0 placeholder:text-white/10"
              placeholder="0x..."
              value={form.reviewer_address}
              readOnly
            />
          ) : (
            <div className="flex flex-col gap-3">
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant p-4 font-[family-name:var(--font-mono)] text-xs text-on-surface-variant focus:border-primary focus:ring-0 placeholder:text-white/10"
                placeholder="0x... (connect wallet to auto-fill)"
                value={form.reviewer_address}
                onChange={(e) => set("reviewer_address", e.target.value)}
              />
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="self-start bg-primary-container text-on-primary-container px-4 py-2 font-[family-name:var(--font-headline)] text-xs font-bold uppercase transition-all hover:brightness-110 active:scale-95"
                  >
                    Connect Wallet to Auto-Fill
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          )}
        </section>

        {/* Task Intent */}
        <section className="bg-surface-container p-6 border border-white/5">
          <h2 className="font-[family-name:var(--font-headline)] text-sm font-medium text-on-surface uppercase tracking-widest mb-4">
            Task Intent
          </h2>
          <textarea
            className="w-full h-20 bg-surface-container-lowest border border-outline-variant p-4 font-[family-name:var(--font-mono)] text-xs text-on-surface-variant focus:border-primary focus:ring-0 resize-none placeholder:text-white/10"
            placeholder="e.g. compare trading strategies for BTC/USD volatility"
            maxLength={200}
            value={form.task_intent}
            onChange={(e) => set("task_intent", e.target.value)}
          />
        </section>

        {/* Winner & Type */}
        <section className="bg-surface-container p-6 border border-white/5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-[family-name:var(--font-mono)] uppercase text-on-surface-variant mb-2">Winner</label>
            <select
              className="w-full bg-surface-container-lowest border border-outline-variant p-3 font-[family-name:var(--font-mono)] text-xs text-on-surface focus:border-primary focus:ring-0"
              value={form.winner}
              onChange={(e) => set("winner", e.target.value)}
            >
              <option value="policy_a">Model A (Policy A)</option>
              <option value="policy_b">Model B (Policy B)</option>
              <option value="tie">Tie</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-[family-name:var(--font-mono)] uppercase text-on-surface-variant mb-2">Task Type</label>
            <select
              className="w-full bg-surface-container-lowest border border-outline-variant p-3 font-[family-name:var(--font-mono)] text-xs text-on-surface focus:border-primary focus:ring-0"
              value={form.task_type}
              onChange={(e) => set("task_type", e.target.value)}
            >
              <option value="code_review">Code Review</option>
              <option value="analysis">Analysis</option>
              <option value="creative">Creative</option>
              <option value="data_extraction">Data Extraction</option>
              <option value="customer_support">Customer Support</option>
              <option value="other">Other</option>
            </select>
          </div>
        </section>

        {/* Feedback Input */}
        <section className="bg-surface-container p-6 border border-white/5">
          <h2 className="font-[family-name:var(--font-headline)] text-sm font-medium text-on-surface uppercase tracking-widest mb-4">
            Justification Log
          </h2>
          <div className="relative">
            <textarea
              className="w-full h-40 bg-surface-container-lowest border border-outline-variant p-4 font-[family-name:var(--font-mono)] text-xs text-on-surface-variant focus:border-primary focus:ring-0 resize-none placeholder:text-white/10"
              placeholder="[SYSTEM_LOG] Enter human feedback justification here... Explain why Model A provides superior cross-chain logic in the context of ERC-8004 minting events."
              value={form.reasoning}
              onChange={(e) => {
                set("reasoning", e.target.value);
                setCharCount(e.target.value.length);
              }}
              maxLength={1024}
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-[family-name:var(--font-mono)] text-white/20">
              CHARS: {charCount}/1024
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Staking & Yield */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        {/* Yield Boost Panel */}
        <section className="bg-surface-container p-6 border border-primary/20 neon-glow-primary overflow-hidden relative">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
          <h3 className="font-[family-name:var(--font-headline)] text-sm font-bold text-primary uppercase tracking-widest mb-6">
            Projected Yield Boost
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant text-xs font-[family-name:var(--font-mono)]">Current Base Yield</span>
              <span className="text-white font-[family-name:var(--font-mono)] text-lg">12.4%</span>
            </div>
            <div className="bg-surface-container-lowest p-4 border-l-2 border-primary">
              <div className="text-[10px] text-primary/60 font-[family-name:var(--font-mono)] mb-1">
                STAKE_MULTIPLIER (SQRT_FORMULA)
              </div>
              <div className="text-2xl font-[family-name:var(--font-headline)] font-bold text-primary">1.42x</div>
              <div className="text-[9px] text-white/30 font-[family-name:var(--font-mono)] mt-2 italic">
                boost = sqrt(stake_size) * reputation_score
              </div>
            </div>
            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-tertiary text-[10px] font-bold uppercase">Estimated Return</span>
                <span className="text-tertiary font-[family-name:var(--font-mono)]">17.6% APY</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1">
                <div className="bg-tertiary h-full" style={{ width: "17.6%" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Stake Amount */}
        <section className="bg-surface-container-low p-4 border border-outline-variant">
          <label className="block text-[10px] font-[family-name:var(--font-mono)] text-on-surface-variant uppercase mb-2">
            STAKE AMOUNT (USDC)
          </label>
          <input
            type="number"
            min="0.001"
            step="0.001"
            className="w-full bg-surface-container-lowest border border-outline-variant p-3 font-[family-name:var(--font-mono)] text-sm text-on-surface focus:border-primary focus:ring-0"
            value={form.stake_amount}
            onChange={(e) => set("stake_amount", e.target.value)}
          />
        </section>

        {/* Final CTA Section */}
        <section className="space-y-4">
          <div className="bg-surface-container-low p-4 border border-outline-variant">
            <div className="flex justify-between text-[10px] font-[family-name:var(--font-mono)] mb-2">
              <span className="text-on-surface-variant">GAS ESTIMATION (BASE)</span>
              <span className="text-tertiary">$0.04 (Fast)</span>
            </div>
            <div className="flex justify-between text-[10px] font-[family-name:var(--font-mono)]">
              <span className="text-on-surface-variant">ERC-8004 RECEIPT</span>
              <span className="text-on-surface">IMMUTABLE (FILECOIN)</span>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={status === "submitting"}
            className="w-full bg-error-container text-white py-4 font-[family-name:var(--font-headline)] font-bold uppercase tracking-widest text-sm neon-glow-error hover:bg-error transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1 group disabled:opacity-50"
          >
            <span>{status === "submitting" ? "Submitting..." : "Stake USDC & Mint ERC-8004 Receipt"}</span>
            <span className="text-[9px] opacity-60 font-[family-name:var(--font-mono)] group-hover:opacity-100 transition-opacity underline decoration-dotted">
              Permanent on Filecoin Layer
            </span>
          </button>

          <p className="text-[10px] text-center text-white/30 font-[family-name:var(--font-mono)]">
            Transactions are finalized via SHS Validator Nodes.<br />
            Job Ref: 0x88f2...b411 (Verified)
          </p>

          {status === "success" && result && (
            <div className="bg-surface-container-lowest border border-tertiary/40 p-4">
              <p className="text-tertiary font-[family-name:var(--font-headline)] font-bold text-sm mb-2">Review Submitted</p>
              {result.filecoin_cid && (
                <p className="text-on-surface-variant text-[10px] font-[family-name:var(--font-mono)]">
                  Filecoin CID: {result.filecoin_cid}
                </p>
              )}
              {result.id && (
                <p className="text-on-surface-variant text-[10px] font-[family-name:var(--font-mono)]">
                  Review ID: {result.id}
                </p>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="bg-error-container/20 border border-error/40 p-4">
              <p className="text-error text-sm font-[family-name:var(--font-mono)]">
                Submission failed. Check API connection.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
