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

const ACTION_COLORS: Record<string, { text: string; label: string }> = {
  complete: { text: "text-tertiary", label: "SETTLED" },
  validated: { text: "text-tertiary", label: "SETTLED" },
  mint_receipt: { text: "text-tertiary", label: "LIVE" },
  rejected: { text: "text-error/80", label: "SLASHED" },
  reject: { text: "text-error/80", label: "SLASHED" },
  x402_payment: { text: "text-tertiary", label: "LIVE" },
  error: { text: "text-error/80", label: "ERROR" },
  warn: { text: "text-secondary", label: "ALERT" },
  heuristic_score: { text: "text-secondary", label: "ALERT" },
  pin: { text: "text-white/80", label: "SYSTEM" },
};

export default function AgentFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    api.getAgentLog().then((data) => {
      setLogs([...data].reverse());
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 flex flex-col lg:flex-row gap-6">
      {/* Main Terminal */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-[family-name:var(--font-mono)] font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            Agent Decision Log
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-white/40">
              Auto-refresh: 10s
            </span>
            <button
              onClick={refresh}
              className="text-white/40 hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-white/5 p-4 min-h-[700px] overflow-y-auto no-scrollbar font-[family-name:var(--font-mono)] text-[11px] leading-relaxed relative">
          {/* Terminal Gradient Fade */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" />

          <div className="space-y-4 relative z-10">
            {loading ? (
              <div className="text-white/40 animate-pulse">Connecting to agent network...</div>
            ) : logs.length === 0 ? (
              <div className="space-y-2">
                <div className="text-white/40">No agent activity yet.</div>
                <div className="text-white/20">Run: python -m api.agent.buyer_agent --once</div>
                <div className="text-white/40 animate-pulse">_</div>
              </div>
            ) : (
              <>
                {logs.map((entry, i) => {
                  const actionInfo = ACTION_COLORS[entry.action ?? ""] ?? { text: "text-white/80", label: "INFO" };
                  const labelColor =
                    actionInfo.label === "LIVE" ? "text-primary" :
                    actionInfo.label === "SETTLED" ? "text-tertiary" :
                    actionInfo.label === "SLASHED" || actionInfo.label === "ERROR" ? "text-error" :
                    actionInfo.label === "ALERT" ? "text-secondary" :
                    "text-white/40";

                  return (
                    <div key={i} className={actionInfo.text}>
                      <span className="text-white/40">[{fmt(entry.timestamp)}]</span>{" "}
                      <span className={`${labelColor} font-bold`}>#{actionInfo.label}:</span>{" "}
                      {entry.message}
                      {(entry.tx || entry.tx_hash) && (
                        <a
                          href={`https://basescan.org/tx/${entry.tx || entry.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-primary/60 hover:text-primary transition-colors underline decoration-dotted"
                        >
                          tx/{(entry.tx || entry.tx_hash || "").slice(0, 6)}...{(entry.tx || entry.tx_hash || "").slice(-4)}
                        </a>
                      )}
                      {(entry.cid || entry.logCID) && (
                        <span className="block text-white/30">
                          CID: {entry.cid || entry.logCID}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div className="text-white/40 animate-pulse">_</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Side Stats */}
      <aside className="w-full lg:w-80 space-y-4">
        <div className="bg-surface-container-low rounded-lg p-6">
          <h4 className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-widest text-primary mb-6">
            Network Stats
          </h4>
          <div className="space-y-4">
            <div className="bg-surface-container p-3 border-l-2 border-primary">
              <span className="text-[9px] text-white/40 uppercase font-[family-name:var(--font-mono)] block mb-1">Total Events</span>
              <span className="text-xl font-[family-name:var(--font-headline)] font-bold text-on-surface">{logs.length}</span>
            </div>
            <div className="bg-surface-container p-3 border-l-2 border-secondary">
              <span className="text-[9px] text-white/40 uppercase font-[family-name:var(--font-mono)] block mb-1">x402 Payments</span>
              <span className="text-xl font-[family-name:var(--font-headline)] font-bold text-on-surface">
                {logs.filter((l) => l.action === "x402_payment").length}
              </span>
            </div>
            <div className="bg-surface-container p-3 border-l-2 border-tertiary">
              <span className="text-[9px] text-white/40 uppercase font-[family-name:var(--font-mono)] block mb-1">Validations</span>
              <span className="text-xl font-[family-name:var(--font-headline)] font-bold text-on-surface">
                {logs.filter((l) => l.action === "validated" || l.action === "complete").length}
              </span>
            </div>
            <div className="bg-surface-container p-3 border-l-2 border-error">
              <span className="text-[9px] text-white/40 uppercase font-[family-name:var(--font-mono)] block mb-1">Rejections</span>
              <span className="text-xl font-[family-name:var(--font-headline)] font-bold text-on-surface">
                {logs.filter((l) => l.action === "rejected" || l.action === "reject").length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-lg p-6">
          <h4 className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-widest text-tertiary mb-6">
            System Status
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-[family-name:var(--font-mono)]">
              <span className="text-on-surface-variant">Agent Status</span>
              <span className="text-tertiary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                ONLINE
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-[family-name:var(--font-mono)]">
              <span className="text-on-surface-variant">Network</span>
              <span className="text-white">Base Sepolia</span>
            </div>
            <div className="flex justify-between items-center text-xs font-[family-name:var(--font-mono)]">
              <span className="text-on-surface-variant">Protocol</span>
              <span className="text-primary">ERC-8183 + x402</span>
            </div>
            <div className="pt-4 mt-4 border-t border-outline-variant/15">
              <p className="text-[10px] text-on-surface-variant uppercase mb-3">Quick Actions</p>
              <div className="text-[10px] font-[family-name:var(--font-mono)] text-tertiary space-y-1">
                <p>&gt; python -m api.agent.buyer_agent --once</p>
                <p>&gt; python -m api.agent.buyer_agent --loop</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
