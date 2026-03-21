"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface LogEntry {
  timestamp: number;
  message: string;
  action?: string;
  tx?: string;
  tx_hash?: string;
  cid?: string;
  logCID?: string;
  verdict?: string;
  amount?: string;
}

const ACTION_COLOR: Record<string, string> = {
  complete: "text-[#00D4AA]",
  validated: "text-[#00D4AA]",
  mint_receipt: "text-[#00D4AA]",
  rejected: "text-red-400",
  reject: "text-red-400",
  x402_payment: "text-blue-400",
  error: "text-red-400",
  warn: "text-[#F5A623]",
  heuristic_score: "text-purple-400",
  pin: "text-blue-300",
};

export default function AgentFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const refresh = () => api.getAgentLog().then((data) => setLogs([...data].reverse()));

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (ts: number) => new Date(ts * 1000).toLocaleTimeString();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Feed</h1>
          <p className="text-[#6B7280] text-sm mt-1">Live decision log · refreshes every 10s</p>
        </div>
        <button
          onClick={refresh}
          className="text-sm text-[#00D4AA] border border-[#00D4AA] px-3 py-1 rounded-lg hover:bg-[#00D4AA] hover:text-[#0A0A0F] transition-colors"
        >
          Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-[#6B7280] text-center py-16">
          No agent activity yet. Run:
          <code className="block mt-2 text-sm font-mono bg-[#111118] px-4 py-2 rounded">
            python -m api.agent.buyer_agent --once
          </code>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((entry, i) => (
            <div key={i} className="bg-[#111118] border border-[#1F2937] rounded-lg p-3 flex items-start gap-3">
              <span className="text-[#6B7280] text-xs font-mono shrink-0 mt-0.5">{fmt(entry.timestamp)}</span>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${ACTION_COLOR[entry.action ?? ""] ?? "text-white"}`}>{entry.message}</span>
                {(entry.tx || entry.tx_hash) && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${entry.tx || entry.tx_hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs font-mono text-[#6B7280] hover:text-[#00D4AA] mt-1 truncate"
                  >
                    tx: {entry.tx || entry.tx_hash}
                  </a>
                )}
                {(entry.cid || entry.logCID) && (
                  <span className="block text-xs font-mono text-[#6B7280] mt-1 truncate">
                    cid: {entry.cid || entry.logCID}
                  </span>
                )}
              </div>
              {entry.action && (
                <span className="text-xs bg-[#1F2937] text-[#6B7280] px-2 py-0.5 rounded shrink-0">
                  {entry.action}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
