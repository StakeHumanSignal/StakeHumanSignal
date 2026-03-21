"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://stakesignal-api-production.up.railway.app";

interface SessionData {
  id: string;
  prompt: string;
  output_a: string | null;
  output_b: string | null;
  status: string;
  reward_usdc: number;
  reviewer_address: string;
}

interface SessionSummary {
  id: string;
  prompt: string;
  status: string;
  reward_usdc: number;
  reviewer_address?: string;
}

function ValidateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id") || "";
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<{ recommended_won: boolean; payout: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      fetch(`${API}/sessions`)
        .then(r => r.ok ? r.json() : [])
        .then(d => { setSessions(Array.isArray(d) ? d : d.sessions ?? []); setLoading(false); })
        .catch(() => setLoading(false));
      return;
    }
    fetch(`${API}/sessions/${sessionId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setSession(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const settle = async (choice: string) => {
    setPicked(choice);
    const r = await fetch(`${API}/sessions/${sessionId}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ human_picked: choice }),
    });
    if (r.ok) setResult(await r.json());
  };

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-12 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-secondary/10 text-secondary text-[10px] font-[family-name:var(--font-mono)] px-2 py-0.5 border border-secondary/20">
            SESSION_{sessionId || "???"}
          </span>
          <span className="text-on-surface-variant text-xs font-[family-name:var(--font-mono)] uppercase tracking-widest">
            Blind Evaluation
          </span>
        </div>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold text-on-surface tracking-tight">
          Which Output is Better?
        </h1>
        <p className="text-on-surface-variant text-sm mt-1 italic">
          You cannot see which model produced each output. Pick the one that better answers the prompt.
        </p>
      </div>

      {loading ? (
        <div className="text-on-surface-variant font-[family-name:var(--font-mono)] text-sm animate-pulse">
          Loading session...
        </div>
      ) : !sessionId ? (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-surface-container-low p-8 text-center">
              <p className="text-on-surface-variant font-[family-name:var(--font-mono)] text-sm">
                No sessions available for validation yet.
              </p>
              <p className="text-white/20 font-[family-name:var(--font-mono)] text-xs mt-2">
                Sessions are created when agents submit A/B comparisons.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-low overflow-hidden">
              <div className="p-4 border-b border-outline-variant/15">
                <h3 className="font-[family-name:var(--font-headline)] font-bold text-sm uppercase tracking-widest">
                  Available Sessions ({sessions.length})
                </h3>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/validate?session_id=${s.id}`)}
                    className="w-full text-left p-4 hover:bg-surface-bright/5 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-[family-name:var(--font-mono)] text-primary px-1.5 py-0.5 bg-primary/10 border border-primary/20">
                          {s.id.slice(0, 8)}
                        </span>
                        <span className={`text-[10px] font-[family-name:var(--font-mono)] px-1.5 py-0.5 uppercase font-bold ${
                          s.status === "ready" ? "text-tertiary bg-tertiary/10 border border-tertiary/20" :
                          s.status === "settled" ? "text-white/40 bg-white/5 border border-white/10" :
                          "text-secondary bg-secondary/10 border border-secondary/20"
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-[family-name:var(--font-mono)] truncate">
                        {s.prompt}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-[family-name:var(--font-mono)] text-primary">{s.reward_usdc} USDC</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !session ? (
        <div className="bg-surface-container-low p-8 text-center">
          <p className="text-on-surface-variant font-[family-name:var(--font-mono)] text-sm">
            Session not found.
          </p>
        </div>
      ) : session.status === "open" ? (
        <div className="bg-surface-container-low p-8 text-center">
          <p className="text-on-surface-variant font-[family-name:var(--font-mono)] text-sm">
            Session is open — waiting for outputs to be generated.
          </p>
        </div>
      ) : (
        <>
          {/* Prompt */}
          <div className="bg-surface-container-lowest border border-white/5 p-4 mb-6 font-[family-name:var(--font-mono)] text-xs text-on-surface-variant">
            <span className="text-white/40 uppercase text-[10px]">Prompt:</span>
            <p className="mt-1 text-on-surface">{session.prompt}</p>
          </div>

          {/* Two output cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => !picked && settle("A")}
              disabled={!!picked}
              className={`text-left bg-surface-container-low border p-6 transition-all ${
                picked === "A" ? "border-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]" :
                picked ? "border-white/5 opacity-50" :
                "border-white/5 hover:border-primary/40 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-primary/10 text-primary text-[10px] font-[family-name:var(--font-mono)] px-2 py-0.5 border border-primary/20 font-bold">
                  OUTPUT A
                </span>
                {picked === "A" && <span className="text-primary text-xs">← Your pick</span>}
              </div>
              <div className="font-[family-name:var(--font-mono)] text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                {session.output_a || "No output yet"}
              </div>
            </button>

            <button
              onClick={() => !picked && settle("B")}
              disabled={!!picked}
              className={`text-left bg-surface-container-low border p-6 transition-all ${
                picked === "B" ? "border-secondary shadow-[0_0_15px_rgba(172,137,255,0.2)]" :
                picked ? "border-white/5 opacity-50" :
                "border-white/5 hover:border-secondary/40 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-secondary/10 text-secondary text-[10px] font-[family-name:var(--font-mono)] px-2 py-0.5 border border-secondary/20 font-bold">
                  OUTPUT B
                </span>
                {picked === "B" && <span className="text-secondary text-xs">← Your pick</span>}
              </div>
              <div className="font-[family-name:var(--font-mono)] text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                {session.output_b || "No output yet"}
              </div>
            </button>
          </div>

          {/* Settlement result */}
          {result && (
            <div className={`p-6 border ${result.recommended_won ? "border-tertiary/40 bg-tertiary/5" : "border-error/40 bg-error/5"}`}>
              <h3 className={`font-[family-name:var(--font-headline)] font-bold text-lg mb-2 ${result.recommended_won ? "text-tertiary" : "text-error"}`}>
                {result.recommended_won ? "CLAIM VALIDATED" : "CLAIM REJECTED"}
              </h3>
              <p className="font-[family-name:var(--font-mono)] text-xs text-on-surface-variant">
                Settlement: {result.payout > 0 ? "+" : ""}{result.payout} USDC equivalent
              </p>
              <a href="/marketplace" className="inline-block mt-4 text-primary text-xs font-[family-name:var(--font-mono)] hover:underline">
                ← Back to Marketplace
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Validate() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-12 min-h-screen">
        <div className="text-on-surface-variant font-[family-name:var(--font-mono)] text-sm animate-pulse">
          Loading session...
        </div>
      </div>
    }>
      <ValidateContent />
    </Suspense>
  );
}
