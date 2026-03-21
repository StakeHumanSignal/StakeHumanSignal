"use client";
import { useState } from "react";
import { api } from "@/lib/api";

const TASK_TYPES = ["code_review", "analysis", "creative", "data_extraction", "customer_support", "other"];
const RUBRICS = [
  { key: "correctness", label: "Correctness" },
  { key: "efficiency", label: "Efficiency" },
  { key: "relevance", label: "Relevance" },
  { key: "completeness", label: "Completeness" },
  { key: "reasoning_quality", label: "Reasoning Quality" },
];

export default function Submit() {
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
    rubric_scores: { correctness: 0.75, efficiency: 0.7, relevance: 0.8, completeness: 0.72, reasoning_quality: 0.68 },
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [result, setResult] = useState<{ id?: string; filecoin_cid?: string } | null>(null);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const setRubric = (k: string, v: number) =>
    setForm((f) => ({ ...f, rubric_scores: { ...f.rubric_scores, [k]: v } }));

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
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Submit Review Claim</h1>
      <p className="text-[#6B7280] text-sm mb-8">
        Stake USDC on your review. Earn Lido yield when agents validate your signal.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-xs text-[#6B7280] uppercase tracking-wider mb-1">Your Wallet Address *</label>
          <input
            className="w-full bg-[#111118] border border-[#1F2937] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00D4AA]"
            placeholder="0x..."
            value={form.reviewer_address}
            onChange={(e) => set("reviewer_address", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-[#6B7280] uppercase tracking-wider mb-1">
            Task Intent * (max 200 chars)
          </label>
          <textarea
            className="w-full bg-[#111118] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00D4AA] h-20 resize-none"
            placeholder="e.g. compare trading strategies for BTC/USD volatility"
            maxLength={200}
            value={form.task_intent}
            onChange={(e) => set("task_intent", e.target.value)}
          />
          <div className="text-right text-xs text-[#6B7280]">{form.task_intent.length}/200</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#6B7280] uppercase tracking-wider mb-1">Task Type</label>
            <select
              className="w-full bg-[#111118] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00D4AA]"
              value={form.task_type}
              onChange={(e) => set("task_type", e.target.value)}
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] uppercase tracking-wider mb-1">Winner</label>
            <select
              className="w-full bg-[#111118] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00D4AA]"
              value={form.winner}
              onChange={(e) => set("winner", e.target.value)}
            >
              <option value="policy_a">Policy A</option>
              <option value="policy_b">Policy B</option>
              <option value="tie">Tie</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#6B7280] uppercase tracking-wider mb-3">Rubric Scores</label>
          <div className="space-y-3">
            {RUBRICS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-[#6B7280] w-40 shrink-0">{label}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  className="flex-1 accent-[#00D4AA]"
                  value={form.rubric_scores[key as keyof typeof form.rubric_scores]}
                  onChange={(e) => setRubric(key, parseFloat(e.target.value))}
                />
                <span className="text-sm font-mono text-[#00D4AA] w-10 text-right">
                  {form.rubric_scores[key as keyof typeof form.rubric_scores].toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#6B7280] uppercase tracking-wider mb-1">Reasoning *</label>
          <textarea
            className="w-full bg-[#111118] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00D4AA] h-24 resize-none"
            placeholder="Why did you pick the winner? Be specific."
            value={form.reasoning}
            onChange={(e) => set("reasoning", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-[#6B7280] uppercase tracking-wider mb-1">Stake Amount (USDC)</label>
          <input
            type="number"
            min="0.001"
            step="0.001"
            className="w-full bg-[#111118] border border-[#1F2937] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00D4AA]"
            value={form.stake_amount}
            onChange={(e) => set("stake_amount", e.target.value)}
          />
        </div>

        <button
          onClick={submit}
          disabled={status === "submitting"}
          className="w-full bg-[#00D4AA] text-[#0A0A0F] font-semibold py-3 rounded-lg hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Submitting..." : "Submit Staked Review"}
        </button>

        {status === "success" && result && (
          <div className="bg-[#111118] border border-[#00D4AA] rounded-lg p-4">
            <p className="text-[#00D4AA] font-semibold mb-2">Review submitted</p>
            {result.filecoin_cid && (
              <p className="text-[#6B7280] text-sm font-mono">Filecoin CID: {result.filecoin_cid}</p>
            )}
            {result.id && <p className="text-[#6B7280] text-sm font-mono">Review ID: {result.id}</p>}
          </div>
        )}

        {status === "error" && (
          <div className="bg-[#111118] border border-red-800 rounded-lg p-4">
            <p className="text-red-400 text-sm">Submission failed. Check API is running on localhost:8000.</p>
          </div>
        )}
      </div>
    </div>
  );
}
