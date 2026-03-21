"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";

interface LogEntry {
  timestamp: number;
  message: string;
  action?: string;
  tx?: string;
  tx_hash?: string;
  claim_id?: string;
  verdict?: string;
  confidence?: number;
}

interface ReviewNode {
  id: string;
  reviewer_address: string;
  task_type?: string;
  score?: number | null;
  stake_amount: number;
}

interface VisNode {
  id: string;
  label: string;
  type: "agent" | "reviewer" | "protocol";
  // Positions stored as 0-1 fractions of canvas size
  nx: number;
  ny: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  pulse: number;
}

interface VisEdge {
  from: string;
  to: string;
  color: string;
  label: string;
  progress: number;
  alive: boolean;
}

const COLORS = {
  agent: "#00EEFC",
  reviewer: "#AC89FF",
  protocol: "#C5FFC9",
  validated: "#C5FFC9",
  rejected: "#FF716C",
  payment: "#00EEFC",
};

function shortAddr(addr: string) {
  return addr.slice(0, 6) + ".." + addr.slice(-4);
}

export default function TownSquare() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Map<string, VisNode>>(new Map());
  const edgesRef = useRef<VisEdge[]>([]);
  const animRef = useRef<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [nodeCount, setNodeCount] = useState(0);
  const lastProcessed = useRef(0);
  const doneTimestamp = useRef(0);

  // Initialize nodes from reviews + agent log
  useEffect(() => {
    const init = async () => {
      const nodes = nodesRef.current;

      // Agent in center
      nodes.set("agent:buyer", {
        id: "agent:buyer",
        label: "BUYER AGENT",
        type: "agent",
        nx: 0.5,
        ny: 0.5,
        vx: 0,
        vy: 0,
        color: COLORS.agent,
        radius: 20,
        pulse: 0,
      });

      // Protocol nodes
      nodes.set("proto:base", {
        id: "proto:base",
        label: "BASE L2",
        type: "protocol",
        nx: 0.75,
        ny: 0.25,
        vx: 0,
        vy: 0,
        color: COLORS.protocol,
        radius: 14,
        pulse: 0,
      });

      nodes.set("proto:filecoin", {
        id: "proto:filecoin",
        label: "FILECOIN",
        type: "protocol",
        nx: 0.25,
        ny: 0.25,
        vx: 0,
        vy: 0,
        color: "#F5A623",
        radius: 14,
        pulse: 0,
      });

      // Fetch reviews to create reviewer nodes
      const reviewData = await api.getReviews();
      const reviews: ReviewNode[] = Array.isArray(reviewData) ? reviewData : [];
      const addrs = new Set<string>();
      reviews.forEach((r) => addrs.add(r.reviewer_address));

      const addrList = Array.from(addrs);
      addrList.forEach((addr, i) => {
        const angle = (i / addrList.length) * Math.PI * 2 - Math.PI / 2;
        const dist = 0.25 + Math.random() * 0.08;
        nodes.set(`reviewer:${addr}`, {
          id: `reviewer:${addr}`,
          label: shortAddr(addr),
          type: "reviewer",
          nx: 0.5 + Math.cos(angle) * dist,
          ny: 0.5 + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.0004,
          vy: (Math.random() - 0.5) * 0.0004,
          color: COLORS.reviewer,
          radius: 10 + Math.min(reviews.filter((r) => r.reviewer_address === addr).length * 2, 10),
          pulse: 0,
        });
      });

      setNodeCount(nodes.size);

      // Fetch logs
      const logData = await api.getAgentLog();
      setLogs(Array.isArray(logData) ? logData : []);
    };
    init();
  }, []);

  // Process log entries into edges over time, loop after 30s pause
  useEffect(() => {
    if (logs.length === 0) return;
    const interval = setInterval(() => {
      // If we've processed all events, wait 30s then reset
      if (lastProcessed.current >= logs.length) {
        if (doneTimestamp.current === 0) {
          doneTimestamp.current = Date.now();
        } else if (Date.now() - doneTimestamp.current > 30000) {
          // Reset and loop
          lastProcessed.current = 0;
          doneTimestamp.current = 0;
          edgesRef.current = [];
          setEventCount(0);
        }
        return;
      }

      const entry = logs[lastProcessed.current];
      lastProcessed.current++;
      setEventCount(lastProcessed.current);

      const edges = edgesRef.current;
      const nodes = nodesRef.current;

      if (entry.action === "x402_payment" || entry.action === "fetch") {
        nodes.forEach((n) => {
          if (n.type === "reviewer") {
            edges.push({
              from: "agent:buyer",
              to: n.id,
              color: COLORS.payment,
              label: "x402",
              progress: 0,
              alive: true,
            });
          }
        });
        const agent = nodes.get("agent:buyer");
        if (agent) agent.pulse = 1;
      } else if (entry.action === "complete" || entry.action === "validated") {
        const reviewerNodes = Array.from(nodes.values()).filter((n) => n.type === "reviewer");
        const target = reviewerNodes[lastProcessed.current % reviewerNodes.length];
        if (target) {
          edges.push({
            from: target.id,
            to: "proto:base",
            color: COLORS.validated,
            label: "SETTLED",
            progress: 0,
            alive: true,
          });
          target.pulse = 1;
        }
      } else if (entry.action === "reject" || entry.action === "rejected") {
        const reviewerNodes = Array.from(nodes.values()).filter((n) => n.type === "reviewer");
        const target = reviewerNodes[lastProcessed.current % reviewerNodes.length];
        if (target) {
          edges.push({
            from: "agent:buyer",
            to: target.id,
            color: COLORS.rejected,
            label: "SLASH",
            progress: 0,
            alive: true,
          });
        }
      } else if (entry.action === "pin") {
        edges.push({
          from: "agent:buyer",
          to: "proto:filecoin",
          color: "#F5A623",
          label: "PIN",
          progress: 0,
          alive: true,
        });
      } else if (entry.action === "heuristic_score") {
        const reviewerNodes = Array.from(nodes.values()).filter((n) => n.type === "reviewer");
        const idx = lastProcessed.current % reviewerNodes.length;
        if (reviewerNodes[idx]) {
          edges.push({
            from: "agent:buyer",
            to: reviewerNodes[idx].id,
            color: entry.verdict === "validated" ? COLORS.validated : COLORS.rejected,
            label: entry.verdict === "validated" ? "OK" : "REJECT",
            progress: 0,
            alive: true,
          });
          reviewerNodes[idx].pulse = 1;
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [logs]);

  // Canvas rendering loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    // Clear
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Draw grid
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Update and draw edges
    for (let i = edges.length - 1; i >= 0; i--) {
      const e = edges[i];
      if (!e.alive) continue;
      e.progress += 0.025;
      if (e.progress > 1.5) {
        e.alive = false;
        continue;
      }

      const fromNode = nodes.get(e.from);
      const toNode = nodes.get(e.to);
      if (!fromNode || !toNode) continue;

      const fx = fromNode.nx * W;
      const fy = fromNode.ny * H;
      const tx = toNode.nx * W;
      const ty = toNode.ny * H;

      const alpha = e.progress < 1 ? Math.min(e.progress * 2, 0.8) : Math.max(0, 1.6 - e.progress * 2);

      // Line
      ctx.beginPath();
      ctx.strokeStyle = e.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
      ctx.lineWidth = 1.5;
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Traveling dot
      if (e.progress < 1) {
        const t = e.progress;
        const dx = fx + (tx - fx) * t;
        const dy = fy + (ty - fy) * t;
        ctx.beginPath();
        ctx.fillStyle = e.color;
        ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label at midpoint
        if (t > 0.3 && t < 0.7) {
          const mx = (fx + tx) / 2;
          const my = (fy + ty) / 2 - 10;
          ctx.font = "9px 'JetBrains Mono', monospace";
          ctx.fillStyle = e.color + "AA";
          ctx.textAlign = "center";
          ctx.fillText(e.label, mx, my);
        }
      }
    }

    // Cull dead edges
    edgesRef.current = edges.filter((e) => e.alive);

    // Update and draw nodes
    nodes.forEach((node) => {
      // Gentle drift (in normalized coords)
      node.nx += node.vx;
      node.ny += node.vy;

      // Bounce off edges (keep within 10%-90% of canvas)
      if (node.nx < 0.1 || node.nx > 0.9) node.vx *= -1;
      if (node.ny < 0.1 || node.ny > 0.9) node.vy *= -1;
      node.nx = Math.max(0.1, Math.min(0.9, node.nx));
      node.ny = Math.max(0.1, Math.min(0.9, node.ny));

      const px = node.nx * W;
      const py = node.ny * H;

      // Pulse decay
      if (node.pulse > 0) node.pulse *= 0.97;

      // Glow
      if (node.pulse > 0.1) {
        const glow = ctx.createRadialGradient(px, py, 0, px, py, node.radius * 3);
        glow.addColorStop(0, node.color + Math.round(node.pulse * 80).toString(16).padStart(2, "0"));
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.fillStyle = glow;
        ctx.arc(px, py, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.fillStyle = node.color + "30";
      ctx.strokeStyle = node.color + "80";
      ctx.lineWidth = 1.5;
      ctx.arc(px, py, node.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.fillStyle = node.color;
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font =
        node.type === "agent"
          ? "bold 10px 'JetBrains Mono', monospace"
          : "9px 'JetBrains Mono', monospace";
      ctx.fillStyle = node.color + "CC";
      ctx.textAlign = "center";
      ctx.fillText(node.label, px, py + node.radius + 14);
    });

    animRef.current = requestAnimationFrame(draw);
  }, []);

  // Start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-headline)] text-xl font-bold tracking-tight flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          Town Square
        </h2>
        <div className="flex items-center gap-6 text-[10px] font-[family-name:var(--font-mono)] text-white/40">
          <span>
            NODES: <span className="text-primary">{nodeCount}</span>
          </span>
          <span>
            EVENTS: <span className="text-tertiary">{eventCount}/{logs.length}</span>
          </span>
        </div>
      </div>

      <div className="relative w-full h-[700px] bg-surface-container-lowest border border-white/5 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-3 space-y-2 text-[10px] font-[family-name:var(--font-mono)]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border" style={{ borderColor: COLORS.agent, background: COLORS.agent + "30" }} />
            <span className="text-white/60">Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border" style={{ borderColor: COLORS.reviewer, background: COLORS.reviewer + "30" }} />
            <span className="text-white/60">Reviewer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border" style={{ borderColor: COLORS.protocol, background: COLORS.protocol + "30" }} />
            <span className="text-white/60">Protocol</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <span className="w-4 h-0.5" style={{ background: COLORS.validated }} />
            <span className="text-white/60">Validated</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5" style={{ background: COLORS.rejected }} />
            <span className="text-white/60">Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5" style={{ background: COLORS.payment }} />
            <span className="text-white/60">x402 Payment</span>
          </div>
        </div>
      </div>
    </div>
  );
}
