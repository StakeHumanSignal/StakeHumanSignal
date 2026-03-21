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

  useEffect(() => {
    api.getLeaderboard().then(setData);
  }, []);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Reviewer Leaderboard</h1>
      <p className="text-[#6B7280] text-sm mb-8">Human reputation scores derived from downstream agent validation</p>

      {data.length === 0 ? (
        <div className="text-[#6B7280] text-center py-16">
          No reputation data yet. Submit reviews and run the buyer agent to see scores.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1F2937] text-[#6B7280] text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4">Rank</th>
              <th className="text-left py-3 px-4">Reviewer</th>
              <th className="text-right py-3 px-4">Score</th>
              <th className="text-right py-3 px-4">Wins</th>
              <th className="text-right py-3 px-4">Jobs</th>
              <th className="text-right py-3 px-4">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={r.reviewer_address} className="border-b border-[#1F2937] hover:bg-[#111118] transition-colors">
                <td className="py-3 px-4 text-[#6B7280]">#{i + 1}</td>
                <td className="py-3 px-4 font-mono text-[#00D4AA]">
                  <a
                    href={`https://sepolia.basescan.org/address/${r.reviewer_address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {truncate(r.reviewer_address)}
                  </a>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 bg-[#1F2937] rounded-full h-1.5">
                      <div
                        className="bg-[#00D4AA] h-1.5 rounded-full"
                        style={{ width: `${Math.min(r.score, 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-white w-10 text-right">{r.score.toFixed(0)}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono text-[#00D4AA]">{r.wins}</td>
                <td className="py-3 px-4 text-right font-mono text-[#6B7280]">{r.total_jobs}</td>
                <td className="py-3 px-4 text-right font-mono text-white">{(r.win_rate * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
