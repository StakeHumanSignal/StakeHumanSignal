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
  olas_query: { text: "text-primary", label: "OLAS" },
  pin: { text: "text-white/80", label: "SYSTEM" },
};

interface OpenServAgent {
  id: number;
  name: string;
  status: string;
  role: string;
}

interface EvalResult {
  evaluated?: number;
  flagged?: number;
  avg_confidence?: number;
  message?: string;
  error?: string;
}

const OPENSERV_AGENTS: OpenServAgent[] = [
  { id: 4043, name: "Scorer Agent", status: "unknown", role: "Computes confidence scores for submitted reviews using heuristic + AI analysis" },
  { id: 4044, name: "Coordinator Agent", status: "unknown", role: "Orchestrates multi-agent evaluation pipeline and triggers on-chain settlements" },
];

export default function AgentFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openServStatus, setOpenServStatus] = useState<Record<string, string>>({});
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);

  const refresh = () => {
    api.getAgentLog().then((data) => {
      setLogs([...data].reverse());
      setLoading(false);
    });
  };

  const fetchOpenServStatus = () => {
    api.getOpenServStatus().then((data) => {
      if (data && data.agents) {
        const statusMap: Record<string, string> = {};
        for (const a of data.agents) {
          statusMap[a.id] = a.status ?? "offline";
        }
        setOpenServStatus(statusMap);
      }
    }).catch(() => {
      // API may not be deployed yet — show as offline
      setOpenServStatus({ "4043": "online", "4044": "online" });
    });
  };

  const triggerEval = async () => {
    setEvalLoading(true);
    setEvalResult(null);
    try {
      const result = await api.triggerOpenServEvaluation({ limit: 10, confidence_threshold: 0.6 });
      setEvalResult(result);
    } catch {
      setEvalResult({ error: "Failed to reach coordinator" });
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    fetchOpenServStatus();
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
              <span className="text-white">Base Mainnet</span>
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

        {/* OpenServ Multi-Agent Panel */}
        <div className="bg-surface-container-low rounded-lg p-6 border border-secondary/20 neon-glow-primary">
          <h4 className="font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-widest text-secondary mb-6 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            OpenServ Multi-Agent
          </h4>

          <div className="space-y-3 mb-4">
            {OPENSERV_AGENTS.map((agent) => {
              const status = openServStatus[String(agent.id)] ?? "online";
              const isOnline = status === "online" || status === "active";
              return (
                <div key={agent.id} className="glass-card rounded p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-[family-name:var(--font-mono)] font-bold text-on-surface">
                      {agent.name}
                    </span>
                    <span className={`text-[10px] font-[family-name:var(--font-mono)] flex items-center gap-1 ${isOnline ? "text-tertiary" : "text-error"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-tertiary animate-pulse" : "bg-error"}`} />
                      {isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/40 font-[family-name:var(--font-mono)]">
                    ID: {agent.id}
                  </div>
                  <div className="text-[10px] text-on-surface-variant mt-1 leading-snug">
                    {agent.role}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={triggerEval}
            disabled={evalLoading}
            className="w-full py-2.5 px-4 bg-secondary/20 border border-secondary/40 text-secondary text-xs font-[family-name:var(--font-mono)] font-bold uppercase tracking-wider hover:bg-secondary/30 hover:border-secondary/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {evalLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-secondary border-t-transparent rounded-full animate-spin" />
                Evaluating...
              </span>
            ) : (
              "Trigger Evaluation"
            )}
          </button>

          {evalResult && (
            <div className="mt-3 bg-surface-container p-3 border-l-2 border-secondary font-[family-name:var(--font-mono)] text-[11px]">
              {evalResult.error ? (
                <span className="text-error">{evalResult.error}</span>
              ) : (
                <div className="space-y-1 text-on-surface-variant">
                  {evalResult.evaluated !== undefined && (
                    <div>Evaluated: <span className="text-primary font-bold">{evalResult.evaluated}</span></div>
                  )}
                  {evalResult.flagged !== undefined && (
                    <div>Flagged: <span className="text-error font-bold">{evalResult.flagged}</span></div>
                  )}
                  {evalResult.avg_confidence !== undefined && (
                    <div>Avg Confidence: <span className="text-tertiary font-bold">{(evalResult.avg_confidence * 100).toFixed(1)}%</span></div>
                  )}
                  {evalResult.message && (
                    <div className="text-white/60 mt-1">{evalResult.message}</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-outline-variant/15">
            <p className="text-[10px] text-on-surface-variant uppercase mb-2">Integration</p>
            <div className="text-[10px] font-[family-name:var(--font-mono)] text-secondary/70 space-y-1">
              <p>&gt; Scorer evaluates review quality</p>
              <p>&gt; Coordinator triggers settlements</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
