"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function Home() {
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    api.getReviews().then((r) => setReviewCount(Array.isArray(r) ? r.length : 0));
  }, []);

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-2 text-sm text-[#00D4AA] font-mono">Base Sepolia Testnet</div>
      <h1 className="text-4xl font-bold mb-3 text-white">
        Stake your AI review.
        <br />
        Earn yield.
      </h1>
      <p className="text-[#6B7280] text-lg mb-8">
        Human signal marketplace for autonomous agents. Reviews stored on Filecoin. Payments via x402. Yield via Lido
        wstETH.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111118] border border-[#1F2937] rounded-lg p-4">
          <div className="text-2xl font-mono text-[#00D4AA]">{reviewCount}</div>
          <div className="text-sm text-[#6B7280]">Reviews Submitted</div>
        </div>
        <div className="bg-[#111118] border border-[#1F2937] rounded-lg p-4">
          <div className="text-2xl font-mono text-[#F5A623]">ERC-8183</div>
          <div className="text-sm text-[#6B7280]">Job Standard</div>
        </div>
        <div className="bg-[#111118] border border-[#1F2937] rounded-lg p-4">
          <div className="text-2xl font-mono text-[#00D4AA]">x402</div>
          <div className="text-sm text-[#6B7280]">Payment Protocol</div>
        </div>
      </div>

      <Link
        href="/marketplace"
        className="inline-block bg-[#00D4AA] text-[#0A0A0F] font-semibold px-6 py-3 rounded-lg hover:bg-[#00b894] transition-colors"
      >
        View Marketplace →
      </Link>
    </div>
  );
}
