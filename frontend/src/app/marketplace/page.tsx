"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Review {
  id: string;
  reviewer_address: string;
  task_intent?: string;
  stake_amount: number;
  score?: number;
  filecoin_cid?: string;
  task_type?: string;
  winner?: string;
}

const truncate = (s: string) => (s && s.length > 10 ? `${s.slice(0, 6)}...${s.slice(-4)}` : s || "-");

export default function Marketplace() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.getReviews().then(setReviews).finally(() => setLoading(false));
  }, []);

  const filteredReviews = filter === "all" ? reviews : reviews.filter((r) => r.task_type === filter);

  return (
    <div className="max-w-[1600px] mx-auto p-6 flex flex-col lg:flex-row gap-6">
      {/* Marketplace Section */}
      <div className="flex-1 space-y-6">
        {/* Filter Bar */}
        <section className="bg-surface-container-low p-4 flex flex-wrap items-center gap-6 border-b border-outline-variant/15">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-[family-name:var(--font-mono)] tracking-widest mb-1">
              Model Selection
            </span>
            <select className="bg-surface-container border-none text-xs font-[family-name:var(--font-mono)] text-primary focus:ring-0 rounded-none h-8 px-2">
              <option>ALL MODELS</option>
              <option>GPT-4o</option>
              <option>CLAUDE-3.5</option>
              <option>LLAMA-3-70B</option>
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-[family-name:var(--font-mono)] tracking-widest mb-1">
              Current Status
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 h-8 text-[10px] border uppercase font-bold ${
                  filter === "all"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("analysis")}
                className={`px-3 h-8 text-[10px] border uppercase font-bold ${
                  filter === "analysis"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => setFilter("code_review")}
                className={`px-3 h-8 text-[10px] border uppercase font-bold ${
                  filter === "code_review"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                }`}
              >
                Code
              </button>
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => { setLoading(true); api.getReviews().then(setReviews).finally(() => setLoading(false)); }}
              className="text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
          </div>
        </section>

        {/* Data Table Dashboard */}
        <div className="bg-surface-container-low overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-on-surface-variant font-[family-name:var(--font-mono)] text-sm animate-pulse">
              Loading verdicts...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-on-surface-variant font-[family-name:var(--font-headline)] text-lg mb-2">No verdicts yet.</p>
              <p className="text-white/30 font-[family-name:var(--font-mono)] text-xs">Submit the first staked review to populate the marketplace.</p>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2 px-2">
              <thead className="text-[10px] uppercase font-[family-name:var(--font-mono)] text-on-surface-variant tracking-widest">
                <tr>
                  <th className="pb-4 pl-4 font-normal">A/B Verdict ID</th>
                  <th className="pb-4 font-normal">Confidence Weights</th>
                  <th className="pb-4 text-right pr-4 font-normal">Stake / Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredReviews.map((review) => (
                  <VerdictRow key={review.id} review={review} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Live Terminal Feed (Side) */}
      <aside className="w-full lg:w-96 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-[family-name:var(--font-mono)] font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            Live Network Feed
          </h3>
          <span className="text-[10px] font-[family-name:var(--font-mono)] text-white/40">v1.2.0-MAINNET</span>
        </div>

        <div className="bg-surface-container-lowest border border-white/5 p-4 h-[600px] overflow-y-auto no-scrollbar font-[family-name:var(--font-mono)] text-[11px] leading-relaxed relative">
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" />
          <div className="space-y-4 relative z-10">
            <div className="text-tertiary">
              <span className="text-white/40">[14:22:01]</span> [AGENT 0x88f...] Paid x402 for review #123 -&gt; Heuristic pass -&gt; +Reputation minted via ERC-8004
              <span className="block text-primary/60 hover:text-primary transition-colors underline decoration-dotted cursor-pointer">tx/0x992...a2b1</span>
            </div>
            <div className="text-white/80">
              <span className="text-white/40">[14:21:44]</span> <span className="text-secondary">#NEW_STAKE:</span> User 0x551... locked 1.5 wstETH on EVAL_ID_9042
            </div>
            <div className="text-tertiary">
              <span className="text-white/40">[14:20:12]</span> [AGENT 0x410...] Paid x402 for review #098 -&gt; Latency validation -&gt; +Reputation minted via ERC-8004
              <span className="block text-primary/60 hover:text-primary transition-colors underline decoration-dotted cursor-pointer">tx/0x44d...f92a</span>
            </div>
            <div className="text-error/80">
              <span className="text-white/40">[14:19:55]</span> <span className="text-error">#SLASHED:</span> Agent 0x21c... failed truth-anchor check on CID_992.
            </div>
            <div className="text-tertiary">
              <span className="text-white/40">[14:18:30]</span> [AGENT 0x1a2...] Paid x402 for review #125 -&gt; Logic verification -&gt; +Reputation minted via ERC-8004
              <span className="block text-primary/60 hover:text-primary transition-colors underline decoration-dotted cursor-pointer">tx/0x11e...c88d</span>
            </div>
            <div className="text-white/80 opacity-60">
              <span className="text-white/40">[14:17:11]</span> System: Re-indexing IPFS cluster for CID_8004_batch...
            </div>
            <div className="text-tertiary">
              <span className="text-white/40">[14:15:01]</span> [AGENT 0xbb2...] Paid x402 for review #126 -&gt; Model B consensus -&gt; +Reputation minted via ERC-8004
              <span className="block text-primary/60 hover:text-primary transition-colors underline decoration-dotted cursor-pointer">tx/0x33b...e010</span>
            </div>
            <div className="text-white/40 animate-pulse">_</div>
          </div>
        </div>

        {/* System Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container p-3 border-l-2 border-primary">
            <span className="text-[9px] text-white/40 uppercase font-[family-name:var(--font-mono)] block mb-1">Total Mints</span>
            <span className="text-xl font-[family-name:var(--font-headline)] font-bold text-on-surface">1,249</span>
          </div>
          <div className="bg-surface-container p-3 border-l-2 border-secondary">
            <span className="text-[9px] text-white/40 uppercase font-[family-name:var(--font-mono)] block mb-1">Fees Generated</span>
            <span className="text-xl font-[family-name:var(--font-headline)] font-bold text-on-surface">4.82 ETH</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function VerdictRow({ review }: { review: Review }) {
  const score = review.score ?? 75;
  const correctness = Math.min(score, 100);
  const reasoning = Math.max(20, score - 15);
  const coherence = Math.max(20, score - 30);
  const safety = Math.max(5, 100 - score);

  return (
    <tr className="bg-surface-container hover:bg-surface-bright/5 transition-colors group">
      <td className="py-6 pl-4 align-top">
        <div className="flex items-start gap-4">
          <div className="flex -space-x-2">
            <div className="w-10 h-10 glass-badge rounded-lg flex items-center justify-center border border-primary/20 shadow-[0_0_10px_rgba(143,245,255,0.1)]">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="w-10 h-10 glass-badge rounded-lg flex items-center justify-center border border-secondary/20 shadow-[0_0_10px_rgba(172,137,255,0.1)]">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-[family-name:var(--font-headline)] font-bold text-on-surface">
                EVAL_ID_{review.id.slice(0, 4).toUpperCase()}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-tighter ${
                review.winner === "policy_a"
                  ? "bg-tertiary/10 text-tertiary"
                  : review.winner === "policy_b"
                  ? "bg-secondary/10 text-secondary"
                  : "bg-white/10 text-white/60"
              }`}>
                Winner: {review.winner === "policy_a" ? "Model A" : review.winner === "policy_b" ? "Model B" : "Tie"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-[family-name:var(--font-mono)] text-white/40">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                CID: {review.filecoin_cid ? truncate(review.filecoin_cid) : "pending"}
              </span>
              <span className="flex items-center gap-1 hover:text-secondary cursor-pointer">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.75-3.561a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757" />
                </svg>
                Basescan
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="py-6 align-top max-w-[300px]">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[9px] mb-1 font-[family-name:var(--font-mono)] uppercase tracking-widest text-white/40">
              <span>Correctness</span>
              <span className="text-primary">{correctness}%</span>
            </div>
            <div className="h-1 w-full bg-surface-container-highest">
              <div className="h-full bg-primary" style={{ width: `${correctness}%` }} />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-1 bg-surface-container-highest overflow-hidden">
              <div className="h-full bg-secondary" style={{ width: `${reasoning}%` }} />
            </div>
            <div className="flex-1 h-1 bg-surface-container-highest overflow-hidden">
              <div className="h-full bg-tertiary" style={{ width: `${coherence}%` }} />
            </div>
            <div className="flex-1 h-1 bg-surface-container-highest overflow-hidden">
              <div className="h-full bg-white/20" style={{ width: `${Math.min(90, correctness + 10)}%` }} />
            </div>
            <div className="flex-1 h-1 bg-surface-container-highest overflow-hidden">
              <div className="h-full bg-error" style={{ width: `${safety}%` }} />
            </div>
          </div>
          <div className="text-[9px] font-[family-name:var(--font-mono)] text-white/20">
            REASONING, COHERENCE, LATENCY, SAFETY
          </div>
        </div>
      </td>
      <td className="py-6 text-right pr-4 align-top">
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-white/40 uppercase">Total Stake</span>
            <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 font-[family-name:var(--font-mono)] font-bold">
              {review.stake_amount} USDC
            </span>
          </div>
          <button className="bg-secondary-container text-on-secondary-container px-4 py-2 text-xs font-bold uppercase tracking-tight hover:shadow-[0_0_15px_rgba(112,0,255,0.4)] transition-all">
            Pay 0.001 USDC via x402 to Unlock
          </button>
          <span className="text-[9px] text-white/30 font-[family-name:var(--font-mono)] italic">
            402 Payment Required
          </span>
        </div>
      </td>
    </tr>
  );
}
