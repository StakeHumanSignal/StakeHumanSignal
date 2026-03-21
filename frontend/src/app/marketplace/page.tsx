"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function Marketplace() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReviews().then(setReviews).finally(() => setLoading(false));
  }, []);

  const truncate = (s: string) => (s && s.length > 10 ? `${s.slice(0, 6)}...${s.slice(-4)}` : s || "-");

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Marketplace</h1>
          <p className="text-[#6B7280] text-sm mt-1">x402-gated · 0.001 USDC per query · Base Sepolia</p>
        </div>
        <Link
          href="/submit"
          className="bg-[#00D4AA] text-[#0A0A0F] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#00b894] transition-colors"
        >
          + Submit Review
        </Link>
      </div>

      {loading ? (
        <div className="text-[#6B7280]">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">
          <p className="text-lg mb-2">No reviews yet.</p>
          <p className="text-sm">Be the first to submit a staked review claim.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1F2937] text-[#6B7280] text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-4">Reviewer</th>
                <th className="text-left py-3 px-4">Task Intent</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-right py-3 px-4">Stake</th>
                <th className="text-right py-3 px-4">Score</th>
                <th className="text-left py-3 px-4">CID</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-[#1F2937] hover:bg-[#111118] transition-colors">
                  <td className="py-3 px-4 font-mono text-[#00D4AA]">{truncate(r.reviewer_address)}</td>
                  <td className="py-3 px-4 text-white max-w-xs truncate">{r.task_intent || r.id}</td>
                  <td className="py-3 px-4">
                    <span className="bg-[#1F2937] text-[#6B7280] text-xs px-2 py-1 rounded">
                      {r.task_type || "other"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#F5A623]">{r.stake_amount} USDC</td>
                  <td className="py-3 px-4 text-right font-mono text-white">{r.score ? `${r.score}` : "-"}</td>
                  <td className="py-3 px-4 font-mono text-xs text-[#6B7280]">
                    {r.filecoin_cid ? truncate(r.filecoin_cid) : "pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
