"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
  RectDef,
  defsHopper, defsHauler, defsHover,
  REVIEWER_POOL, addrHash,
} from "@/components/AgentAvatars";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  timestamp: number;
  message: string;
  action?: string;
  tx?: string;
  tx_hash?: string;
  verdict?: string;
}

interface ReviewNode {
  id: string;
  reviewer_address: string;
  stake_amount: number;
}

interface BotNode {
  id: string;
  label: string;
  type: "agent" | "reviewer" | "protocol";
  defs: (c: string) => RectDef[];
  color: string;
  size: number;
  fx: number; fy: number;
  vx: number; vy: number;
  bob: number; bs: number;
  pulse: number;
  facing: 1 | -1;
}

interface Edge {
  from: string; to: string;
  color: string; label: string;
  p: number; alive: boolean;
}

interface Star {
  x: number; y: number; r: number;
  a: number; tw: number; ts: number;
}

interface Sat {
  x: number; y: number; dx: number;
  angle: number; kind: string;
  color: string; size: number;
}

interface ShootingStar {
  x: number; y: number;
  vx: number; vy: number;
  len: number; life: number; maxLife: number;
  color: string; width: number;
}

interface Meteor {
  x: number; y: number;
  vx: number; vy: number;
  len: number; width: number;
  life: number; maxLife: number;
  color: string; burst: boolean;
}

interface GalaxyDot {
  ox: number; oy: number;
  a: number; r: number; color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CYAN   = "#00EEFC";
const PURPLE = "#AC89FF";
const MINT   = "#C5FFC9";
const RED    = "#FF716C";
const ORANGE = "#F5A623";
const NS     = "http://www.w3.org/2000/svg";

const BASE_SIZES: Record<string, number> = { agent: 26, protocol: 22, reviewer: 18 };

function shortAddr(a: string) { return a.slice(0, 6) + ".." + a.slice(-4); }

// ─── Iso projection ───────────────────────────────────────────────────────────

function makeIso(W: number, H: number) {
  const TW = W * 0.62, TH = W * 0.22;
  return (fx: number, fy: number) => ({
    x: W * 0.5 + (fx - 0.5 - (fy - 0.5)) * TW,
    y: H * 0.54 + (fx - 0.5 + (fy - 0.5)) * TH,
  });
}

// ─── DOM SVG builder ─────────────────────────────────────────────────────────

function buildSVG(rects: RectDef[], size: number): SVGSVGElement {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("width",  String(size));
  svg.setAttribute("height", String(size));
  svg.style.imageRendering = "pixelated";
  svg.style.shapeRendering = "crispEdges";
  rects.forEach(([fill, x, y, w, h, rx]) => {
    const r = document.createElementNS(NS, "rect");
    r.setAttribute("fill",   fill);
    r.setAttribute("x",      String(x));
    r.setAttribute("y",      String(y));
    r.setAttribute("width",  String(w));
    r.setAttribute("height", String(h));
    if (rx !== undefined) r.setAttribute("rx", String(rx));
    svg.appendChild(r);
  });
  return svg;
}

// ─── Alien ASCII art lines ────────────────────────────────────────────────────

const ALIEN_LINES_BIG = [
  "   .  *  .  *   .  ",
  "  *   .  *  .  *   ",
  "   .  *  .  *   .  ",
  "                    ",
  "    /\\_____/\\     ",
  "   /  o   o  \\    ",
  "  | .  ___  . |    ",
  "  |  (     )  |    ",
  "   \\  \\_U_/  /  ",
  "    \\________/    ",
  "   /|  | | |  |\\  ",
  "  / |  | | |  | \\ ",
  " *  |__|_|_|__|  * ",
  "    |  /   \\  |   ",
  "   /\\ /     \\ /\\ ",
  "  /  V       V  \\  ",
  " *    *     *    *  ",
  "   .    * .    .    ",
];

const ALIEN_LINES_SMALL = [
  "   /\\_/\\    ",
  "  ( o.o )   ",
  "   > ^ <    ",
  "  /|   |\\  ",
  " * |   | *  ",
];

// ─── Build galaxy dots (computed once) ───────────────────────────────────────

function buildGalaxyDots(): GalaxyDot[] {
  const dots: GalaxyDot[] = [];
  const arms = 3, dotsPerArm = 120;
  const colors = ["172,137,255", "0,238,252", "197,255,201"];

  for (let arm = 0; arm < arms; arm++) {
    const armOffset = (arm / arms) * Math.PI * 2;
    for (let i = 0; i < dotsPerArm; i++) {
      const t = i / dotsPerArm;
      const r = t * 0.18;
      const theta = armOffset + t * Math.PI * 3.5 + (Math.random() - 0.5) * 0.4;
      dots.push({
        ox: 0.72 + Math.cos(theta) * r,
        oy: 0.12 + Math.sin(theta) * r * 0.45,
        a:  (0.05 + t * 0.12) * (1 - t * 0.6),
        r:  Math.random() < 0.05 ? 1.8 : Math.random() < 0.2 ? 1.1 : 0.5,
        color: colors[arm],
      });
    }
  }
  // galactic core
  for (let i = 0; i < 60; i++) {
    const r = Math.random() * 0.025, theta = Math.random() * Math.PI * 2;
    dots.push({
      ox: 0.72 + Math.cos(theta) * r,
      oy: 0.12 + Math.sin(theta) * r * 0.45,
      a:  0.15 + Math.random() * 0.2,
      r:  Math.random() < 0.3 ? 1.4 : 0.6,
      color: "220,200,255",
    });
  }
  return dots;
}

// ─── Build stars ──────────────────────────────────────────────────────────────

function buildStars(): Star[] {
  return Array.from({ length: 160 }, () => ({
    x:  Math.random(),
    y:  Math.random() * 0.5,
    r:  Math.random() < 0.08 ? 1.8 : Math.random() < 0.2 ? 1.1 : 0.5,
    a:  0.15 + Math.random() * 0.7,
    tw: Math.random() * Math.PI * 2,
    ts: 0.008 + Math.random() * 0.035,
  }));
}

// ─── Satellite draw ───────────────────────────────────────────────────────────

function drawSat(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  kind: string, color: string,
  size: number, angle: number,
) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  if (kind === "cross") {
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(-size / 2, -1, size, 2);
    ctx.strokeRect(-1, -size / 2, 2, size);
    ctx.fillStyle = color + "33";
    ctx.fillRect(-size * 0.8, -size * 0.15, size * 0.55, size * 0.3);
    ctx.fillRect(size * 0.25, -size * 0.15, size * 0.55, size * 0.3);
    ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === "diamond") {
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(0, -size); ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, size);  ctx.lineTo(-size * 0.6, 0);
    ctx.closePath(); ctx.stroke();
    ctx.fillStyle = color + "22"; ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  } else if (kind === "square") {
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(-size / 2, -size / 2, size, size);
    ctx.strokeRect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.6);
    ctx.beginPath(); ctx.moveTo(0, -size / 2); ctx.lineTo(0, -size); ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
  ctx.restore();
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TownSquare() {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef   = useRef<HTMLDivElement>(null);
  const skyRef       = useRef<HTMLCanvasElement>(null);
  const floorRef     = useRef<HTMLCanvasElement>(null);
  const animRef      = useRef<number>(0);
  const physRef      = useRef<number>(0);

  const nodesRef  = useRef<Map<string, BotNode>>(new Map());
  const edgesRef  = useRef<Edge[]>([]);
  const dimRef    = useRef({ W: 800, H: 700 });
  const frameRef  = useRef(0);

  // sky element state (mutable refs, not React state)
  const starsRef         = useRef<Star[]>(buildStars());
  const galaxyRef        = useRef<GalaxyDot[]>(buildGalaxyDots());
  const shootingRef      = useRef<ShootingStar[]>([]);
  const meteorsRef       = useRef<Meteor[]>([]);
  const shootTimerRef    = useRef(0);
  const showerTimerRef   = useRef(0);
  const inShowerRef      = useRef(false);
  const showerCountRef   = useRef(0);

  const satsRef = useRef<Sat[]>([
    { x: .15, y: .09, dx:  .00018, angle: 0,   kind: "cross",   color: CYAN,   size: 8 },
    { x: .72, y: .07, dx: -.00014, angle: .4,   kind: "diamond", color: PURPLE, size: 6 },
    { x: .50, y: .05, dx:  .00010, angle: 0,    kind: "cross",   color: MINT,   size: 5 },
    { x: .88, y: .17, dx: -.00022, angle: .8,   kind: "square",  color: ORANGE, size: 7 },
  ]);

  const [logs,       setLogs]       = useState<LogEntry[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [nodeCount,  setNodeCount]  = useState(0);
  const [logLines,   setLogLines]   = useState<{ msg: string; color: string }[]>([]);

  const lastProc = useRef(0);
  const doneTs   = useRef(0);

  // ── Helpers: spawn sky objects ──────────────────────────────────────────
  const spawnShootingStar = useCallback(() => {
    const angle = Math.PI / 5 + Math.random() * Math.PI / 8;
    const speed = 6 + Math.random() * 8;
    shootingRef.current.push({
      x: Math.random() * 0.9, y: Math.random() * 0.35,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      len: 80 + Math.random() * 140,
      life: 0, maxLife: 28 + Math.random() * 20,
      color: Math.random() < 0.7 ? "255,255,255"
           : Math.random() < 0.5 ? "172,200,255" : "200,172,255",
      width: 1 + Math.random() * 0.8,
    });
  }, []);

  const spawnMeteor = useCallback((burst: boolean) => {
    const angle = Math.PI / 4 + (burst ? (Math.random() - 0.5) * 0.3 : Math.random() * Math.PI / 6);
    const speed = burst ? 10 + Math.random() * 6 : 4 + Math.random() * 5;
    meteorsRef.current.push({
      x: -0.05 + Math.random() * 1.1, y: Math.random() * 0.25,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      len: burst ? 60 + Math.random() * 80 : 40 + Math.random() * 60,
      width: burst ? 2 + Math.random() * 2 : 1 + Math.random() * 1.5,
      life: 0, maxLife: 22 + Math.random() * 16,
      color: burst ? "255,200,100" : "200,220,255",
      burst,
    });
  }, []);

  // ── Init nodes from API ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const nodes = nodesRef.current;
      nodes.set("buyer", { id:"buyer", label:"BUYER AGENT", type:"agent",   defs:defsHopper, color:CYAN,   size:BASE_SIZES.agent,    fx:.5,  fy:.5,  vx:.0006,   vy:.0004, bob:0,   bs:.04,  pulse:0, facing:1  });
      nodes.set("base",  { id:"base",  label:"BASE L2",    type:"protocol", defs:defsHauler, color:MINT,   size:BASE_SIZES.protocol, fx:.75, fy:.25, vx:.00015,  vy:.0002, bob:1.2, bs:.03,  pulse:0, facing:1  });
      nodes.set("fil",   { id:"fil",   label:"FILECOIN",   type:"protocol", defs:defsHover,  color:ORANGE, size:BASE_SIZES.protocol, fx:.25, fy:.25, vx:-.00015, vy:.0002, bob:2.4, bs:.025, pulse:0, facing:-1 });

      const reviewData = await api.getReviews();
      const reviews: ReviewNode[] = Array.isArray(reviewData) ? reviewData : [];
      const addrs = Array.from(new Set(reviews.map(r => r.reviewer_address)));

      addrs.forEach((addr, i) => {
        const slot  = addrHash(addr);
        const pool  = REVIEWER_POOL[slot];
        const outer = i >= 9;
        const count = outer ? Math.max(1, addrs.length - 9) : Math.min(9, addrs.length);
        const idx   = outer ? i - 9 : i;
        const dist  = outer ? 0.38 : 0.21;
        const angle = (idx / count) * Math.PI * 2 - Math.PI / 2 + (outer ? Math.PI / count : 0);
        nodes.set("rev_" + addr, {
          id: "rev_" + addr, label: shortAddr(addr), type: "reviewer",
          defs: pool.defs, color: PURPLE, size: BASE_SIZES.reviewer,
          fx: Math.max(.07, Math.min(.93, .5 + Math.cos(angle) * dist)),
          fy: Math.max(.07, Math.min(.93, .5 + Math.sin(angle) * dist)),
          vx: (Math.random() - .5) * .00055, vy: (Math.random() - .5) * .00055,
          bob: Math.random() * Math.PI * 2, bs: .03 + Math.random() * .018,
          pulse: 0, facing: Math.random() > .5 ? 1 : -1,
        });
      });

      setNodeCount(nodes.size);
      const logData = await api.getAgentLog();
      setLogs(Array.isArray(logData) ? logData : []);
    })();
  }, []);

  // ── Build DOM sprites when nodeCount updates ────────────────────────────
  useEffect(() => {
    if (nodeCount === 0 || !overlayRef.current) return;
    const overlay = overlayRef.current;
    overlay.innerHTML = "";

    nodesRef.current.forEach(node => {
      const base = node.size;
      const wrap = document.createElement("div");
      wrap.id = "sp_" + node.id;
      wrap.style.cssText = "position:absolute;display:flex;flex-direction:column;align-items:center;pointer-events:none;will-change:left,top,filter;";

      const shd = document.createElement("div");
      shd.id = "shd_" + node.id;
      shd.style.cssText = `position:absolute;bottom:0;left:50%;transform:translateX(-50%);border-radius:50%;filter:blur(4px);pointer-events:none;background:radial-gradient(ellipse,rgba(0,0,0,.7) 0%,transparent 70%);width:${base * 1.5}px;height:${base * 0.35}px;`;

      const flip = document.createElement("div");
      flip.id = "fl_" + node.id;
      flip.style.cssText = "transition:transform .1s step-end;";
      flip.appendChild(buildSVG(node.defs(node.color), base));

      wrap.appendChild(shd);
      wrap.appendChild(flip);

      const lbl = document.createElement("div");
      lbl.style.cssText = `font-size:7px;letter-spacing:.07em;margin-top:3px;white-space:nowrap;font-family:monospace;opacity:.55;color:${node.color}99;`;
      lbl.textContent = node.label;
      wrap.appendChild(lbl);
      overlay.appendChild(wrap);
    });
  }, [nodeCount]);

  // ── Log → edges ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (logs.length === 0) return;
    const iv = setInterval(() => {
      if (lastProc.current >= logs.length) {
        if (doneTs.current === 0) doneTs.current = Date.now();
        else if (Date.now() - doneTs.current > 30000) {
          lastProc.current = 0; doneTs.current = 0;
          edgesRef.current = []; setEventCount(0);
        }
        return;
      }
      const entry = logs[lastProc.current++];
      setEventCount(lastProc.current);

      const nodes = nodesRef.current, edges = edgesRef.current;
      const revs  = Array.from(nodes.values()).filter(n => n.type === "reviewer");
      const r     = revs[lastProc.current % revs.length];

      const push = (from: string, to: string, color: string, label: string) =>
        edges.push({ from, to, color, label, p: 0, alive: true });
      const log = (msg: string, color: string) =>
        setLogLines(p => [{ msg, color }, ...p].slice(0, 6));

      if (entry.action === "x402_payment" || entry.action === "fetch") {
        log(entry.message, CYAN);
        revs.slice().sort(() => Math.random() - .5).slice(0, 5).forEach(rv => push("buyer", rv.id, CYAN, "x402"));
        const b = nodes.get("buyer"); if (b) b.pulse = 1;
      } else if (entry.action === "complete" || entry.action === "validated") {
        log(entry.message, MINT); if (r) { push(r.id, "base", MINT, "SETTLED"); r.pulse = 1; }
      } else if (entry.action === "reject" || entry.action === "rejected") {
        log(entry.message, RED); if (r) push("buyer", r.id, RED, "SLASH");
      } else if (entry.action === "pin") {
        log(entry.message, ORANGE); push("buyer", "fil", ORANGE, "PIN");
      } else if (entry.action === "heuristic_score") {
        const col = entry.verdict === "validated" ? MINT : RED;
        log(entry.message, col);
        if (r) { push("buyer", r.id, col, entry.verdict === "validated" ? "OK" : "REJECT"); r.pulse = 1; }
      }
    }, 400);
    return () => clearInterval(iv);
  }, [logs]);

  // ── Physics rAF ─────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const { W, H } = dimRef.current;
      const iso = makeIso(W, H);
      const nodes = nodesRef.current;

      nodes.forEach((n, id, map) => {
        const px = n.fx;
        n.fx += n.vx; n.fy += n.vy; n.bob += n.bs;
        if      (n.fx > px + .0001) n.facing =  1;
        else if (n.fx < px - .0001) n.facing = -1;

        const mg = n.type === "agent" ? .1 : n.type === "protocol" ? .07 : .06;
        if (n.fx < mg || n.fx > 1 - mg) { n.vx *= -1; n.fx = Math.max(mg, Math.min(1 - mg, n.fx)); }
        if (n.fy < mg || n.fy > 1 - mg) { n.vy *= -1; n.fy = Math.max(mg, Math.min(1 - mg, n.fy)); }

        map.forEach((o, oid) => {
          if (oid === id) return;
          const dx = n.fx - o.fx, dy = n.fy - o.fy, d = Math.sqrt(dx * dx + dy * dy);
          if (d < .1 && d > 0) { const f = (.1 - d) * .00003; n.vx += dx / d * f; n.vy += dy / d * f; }
        });

        const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (spd > .0013) { n.vx = n.vx / spd * .0013; n.vy = n.vy / spd * .0013; }
        if (n.pulse > 0) n.pulse *= .93;

        const sc  = iso(n.fx, n.fy);
        const bob = Math.sin(n.bob) * 2;
        const dt  = Math.min(1, Math.max(0, (n.fx + n.fy) / 2));
        const dS  = 0.88 + dt * 0.24;

        const el = document.getElementById("sp_" + n.id); if (!el) return;
        el.style.left      = sc.x + "px";
        el.style.top       = (sc.y + bob) + "px";
        el.style.transform = `translate(-50%,-100%) scale(${dS})`;
        el.style.zIndex    = String(Math.round((n.fx + n.fy) * 500));

        const fl = document.getElementById("fl_" + n.id);
        if (fl) fl.style.transform = `scaleX(${n.facing}) scaleY(0.72)`;

        const shd = document.getElementById("shd_" + n.id);
        if (shd) { shd.style.opacity = String(0.3 + dt * 0.45); shd.style.width = (n.size * 1.5 * dS) + "px"; }

        const rgb = n.color === CYAN ? "0,238,252" : n.color === MINT ? "197,255,201"
                  : n.color === ORANGE ? "245,166,35" : "172,137,255";
        el.style.filter = n.pulse > .15
          ? `drop-shadow(0 0 ${Math.round(n.pulse * 14)}px rgba(${rgb},.9))`
          : `drop-shadow(0 0 3px rgba(${rgb},.2))`;
      });

      physRef.current = requestAnimationFrame(tick);
    };
    physRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(physRef.current);
  }, []);

  // ── Main draw loop ──────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const sky   = skyRef.current;
    const floor = floorRef.current;
    if (!sky || !floor) return;

    const sc  = sky.getContext("2d")!;
    const fc  = floor.getContext("2d")!;
    const { W, H } = dimRef.current;
    const iso  = makeIso(W, H);
    const skyH = H * 0.52;
    const frame = ++frameRef.current;

    // ── SKY BACKGROUND ──────────────────────────────────────────────────
    sc.clearRect(0, 0, W, H);

    const bg = sc.createLinearGradient(0, 0, 0, skyH * 1.15);
    bg.addColorStop(0, "#05030e"); bg.addColorStop(.45, "#04030c"); bg.addColorStop(1, "rgba(3,3,10,0)");
    sc.fillStyle = bg; sc.fillRect(0, 0, W, skyH * 1.2);

    // nebula washes
    ([
      { x: .25, y: .18, rx: .3,  col: "rgba(172,137,255,0.03)" },
      { x: .65, y: .1,  rx: .25, col: "rgba(0,238,252,0.035)"  },
      { x: .5,  y: .3,  rx: .4,  col: "rgba(197,255,201,0.02)" },
    ] as const).forEach(n => {
      const g = sc.createRadialGradient(n.x * W, n.y * skyH, 0, n.x * W, n.y * skyH, n.rx * W);
      g.addColorStop(0, n.col); g.addColorStop(1, "transparent");
      sc.fillStyle = g; sc.fillRect(0, 0, W, skyH);
    });

    // ── ALIEN ASCII ART — big, left side ────────────────────────────────
    sc.save();
    const alienX  = W * 0.02;
    const alienY  = H * 0.01;
    const fontSize = Math.max(9, W * 0.013);
    const lineH    = fontSize * 1.38;
    sc.font      = `${fontSize}px 'Courier New', monospace`;
    sc.textAlign = "left";

    ALIEN_LINES_BIG.forEach((line, i) => {
      const t       = i / ALIEN_LINES_BIG.length;
      const isEyes  = i === 5;
      const isBody  = i > 3 && i < 13;
      const alpha   = isEyes ? 0.2 : isBody ? 0.07 + t * 0.03 : 0.04 + t * 0.02;
      sc.fillStyle  = isEyes
        ? `rgba(0,238,252,${alpha})`
        : isBody
        ? `rgba(100,255,140,${alpha})`
        : `rgba(100,255,140,${alpha * 0.6})`;
      sc.fillText(line, alienX, alienY + i * lineH);
    });

    // eye glows (alien 1)
    const eyeY = alienY + 5 * lineH;
    [W * 0.09, W * 0.132].forEach(ex => {
      const eg = sc.createRadialGradient(ex, eyeY, 0, ex, eyeY, fontSize * 1.4);
      eg.addColorStop(0, "rgba(0,238,252,0.18)"); eg.addColorStop(1, "transparent");
      sc.fillStyle = eg; sc.beginPath(); sc.arc(ex, eyeY, fontSize * 1.4, 0, Math.PI * 2); sc.fill();
    });
    sc.restore();

    // ── ALIEN ASCII ART — small, right side ─────────────────────────────
    sc.save();
    const a2X  = W * 0.84;
    const a2Y  = H * 0.07;
    const fs2  = Math.max(8, W * 0.011);
    const lh2  = fs2 * 1.38;
    sc.font      = `${fs2}px 'Courier New', monospace`;
    sc.textAlign = "left";

    ALIEN_LINES_SMALL.forEach((line, i) => {
      const isEyes = i === 1;
      const alpha  = isEyes ? 0.18 : 0.065;
      sc.fillStyle = isEyes ? `rgba(172,137,255,${alpha})` : `rgba(172,137,255,${alpha * 0.8})`;
      sc.fillText(line, a2X, a2Y + i * lh2);
    });
    const e2Y = a2Y + lh2;
    [W * 0.862, W * 0.896].forEach(ex => {
      const eg = sc.createRadialGradient(ex, e2Y, 0, ex, e2Y, fs2 * 1.1);
      eg.addColorStop(0, "rgba(172,137,255,0.14)"); eg.addColorStop(1, "transparent");
      sc.fillStyle = eg; sc.beginPath(); sc.arc(ex, e2Y, fs2 * 1.1, 0, Math.PI * 2); sc.fill();
    });
    sc.restore();

    // ── GALAXY SPIRAL ────────────────────────────────────────────────────
    const gcx   = W * 0.72, gcy = skyH * 0.14;
    const gAngle = frame * 0.0008;

    sc.save();
    sc.translate(gcx, gcy);

    // core glow
    const cg = sc.createRadialGradient(0, 0, 0, 0, 0, W * 0.045);
    cg.addColorStop(0, "rgba(220,200,255,0.09)");
    cg.addColorStop(.5, "rgba(172,137,255,0.04)");
    cg.addColorStop(1, "transparent");
    sc.fillStyle = cg; sc.beginPath(); sc.arc(0, 0, W * 0.045, 0, Math.PI * 2); sc.fill();

    galaxyRef.current.forEach(d => {
      const rx = (d.ox * W - gcx);
      const ry = (d.oy * skyH * 2 - gcy);
      const rotX = rx * Math.cos(gAngle) - ry * Math.sin(gAngle);
      const rotY = rx * Math.sin(gAngle) + ry * Math.cos(gAngle);
      sc.beginPath();
      sc.fillStyle = `rgba(${d.color},${d.a})`;
      sc.arc(rotX, rotY, d.r, 0, Math.PI * 2);
      sc.fill();
    });
    sc.restore();

    // ── STARS ────────────────────────────────────────────────────────────
    starsRef.current.forEach(s => {
      s.tw += s.ts;
      sc.beginPath();
      sc.fillStyle = `rgba(255,255,255,${s.a * (0.55 + 0.45 * Math.sin(s.tw))})`;
      sc.arc(s.x * W, s.y * skyH, s.r, 0, Math.PI * 2);
      sc.fill();
    });

    // ── MOON ─────────────────────────────────────────────────────────────
    const mX = W * 0.48, mY = skyH * 0.1, mR = Math.min(W, H) * 0.032;
    const mG = sc.createRadialGradient(mX - mR * .3, mY - mR * .3, 1, mX, mY, mR);
    mG.addColorStop(0, "rgba(200,190,255,0.22)");
    mG.addColorStop(.5, "rgba(150,120,220,0.1)");
    mG.addColorStop(1, "transparent");
    sc.beginPath(); sc.fillStyle = mG; sc.arc(mX, mY, mR, 0, Math.PI * 2); sc.fill();
    sc.beginPath(); sc.strokeStyle = "rgba(172,137,255,0.14)"; sc.lineWidth = 0.8;
    sc.arc(mX, mY, mR * 0.88, 0, Math.PI * 2); sc.stroke();
    sc.beginPath(); sc.fillStyle = "rgba(220,210,255,0.28)";
    sc.arc(mX, mY, mR * 0.3, 0, Math.PI * 2); sc.fill();

    // ── SHOOTING STARS ────────────────────────────────────────────────────
    shootTimerRef.current++;
    if (!inShowerRef.current && shootTimerRef.current > 80 + Math.random() * 120) {
      shootTimerRef.current = 0;
      spawnShootingStar();
    }

    // meteor shower burst
    showerTimerRef.current++;
    if (!inShowerRef.current && showerTimerRef.current > 500 + Math.random() * 300) {
      inShowerRef.current = true; showerCountRef.current = 0; showerTimerRef.current = 0;
    }
    if (inShowerRef.current) {
      if (frame % 4 === 0 && showerCountRef.current < 18) { spawnMeteor(true); showerCountRef.current++; }
      if (showerCountRef.current >= 18) inShowerRef.current = false;
    }

    // draw shooting stars
    shootingRef.current = shootingRef.current.filter(s => {
      s.life++;
      if (s.life > s.maxLife) return false;
      const prog  = s.life / s.maxLife;
      const alpha = (prog < .3 ? prog / .3 : 1 - ((prog - .3) / .7)) * 0.85;
      const tx = s.x * W + s.vx * (s.life * .5);
      const ty = s.y * skyH + s.vy * (s.life * .5);
      const ang = Math.atan2(s.vy, s.vx);
      const tailX = tx - Math.cos(ang) * s.len * prog;
      const tailY = ty - Math.sin(ang) * s.len * prog;

      const sg = sc.createLinearGradient(tailX, tailY, tx, ty);
      sg.addColorStop(0, `rgba(${s.color},0)`);
      sg.addColorStop(.6, `rgba(${s.color},${alpha * .5})`);
      sg.addColorStop(1, `rgba(${s.color},${alpha})`);
      sc.beginPath(); sc.strokeStyle = sg; sc.lineWidth = s.width;
      sc.moveTo(tailX, tailY); sc.lineTo(tx, ty); sc.stroke();

      // head glow
      const hg = sc.createRadialGradient(tx, ty, 0, tx, ty, s.width * 5);
      hg.addColorStop(0, `rgba(${s.color},${alpha})`); hg.addColorStop(1, "transparent");
      sc.beginPath(); sc.fillStyle = hg; sc.arc(tx, ty, s.width * 5, 0, Math.PI * 2); sc.fill();
      return true;
    });

    // draw meteors
    meteorsRef.current = meteorsRef.current.filter(m => {
      m.life++;
      if (m.life > m.maxLife) return false;
      const prog  = m.life / m.maxLife;
      const alpha = (prog < .25 ? prog / .25 : 1 - ((prog - .25) / .75)) * (m.burst ? 0.9 : 0.7);
      const tx = m.x * W + m.vx * (m.life * .6);
      const ty = m.y * skyH + m.vy * (m.life * .6);
      const ang = Math.atan2(m.vy, m.vx);
      const tailX = tx - Math.cos(ang) * m.len * prog;
      const tailY = ty - Math.sin(ang) * m.len * prog;

      const mg2 = sc.createLinearGradient(tailX, tailY, tx, ty);
      mg2.addColorStop(0, `rgba(${m.color},0)`);
      mg2.addColorStop(.5, `rgba(${m.color},${alpha * .4})`);
      mg2.addColorStop(1, `rgba(${m.color},${alpha})`);
      sc.beginPath(); sc.strokeStyle = mg2; sc.lineWidth = m.width;
      sc.moveTo(tailX, tailY); sc.lineTo(tx, ty); sc.stroke();

      if (m.burst) {
        // fireball head
        const fg = sc.createRadialGradient(tx, ty, 0, tx, ty, m.width * 5);
        fg.addColorStop(0, `rgba(255,230,150,${alpha})`);
        fg.addColorStop(.4, `rgba(${m.color},${alpha * .5})`);
        fg.addColorStop(1, "transparent");
        sc.beginPath(); sc.fillStyle = fg; sc.arc(tx, ty, m.width * 5, 0, Math.PI * 2); sc.fill();

        // spawn spark trails from shower meteors
        if (m.life % 3 === 0) {
          shootingRef.current.push({
            x: tx / W, y: ty / skyH,
            vx: (Math.random() - .5) * 2, vy: Math.random() * .5,
            len: 15, life: 0, maxLife: 8, color: m.color, width: 0.5,
          });
        }
      }
      return true;
    });

    // ── SATELLITES ────────────────────────────────────────────────────────
    satsRef.current.forEach(sat => {
      sat.x += sat.dx; sat.angle += 0.003;
      if (sat.x < -.05) sat.x = 1.05;
      if (sat.x > 1.05) sat.x = -.05;
      drawSat(sc, sat.x * W, sat.y * skyH, sat.kind, sat.color, sat.size, sat.angle);
      const dir = sat.dx > 0 ? -1 : 1;
      const tg  = sc.createLinearGradient(sat.x * W, 0, (sat.x + dir * .05) * W, 0);
      tg.addColorStop(0, sat.color + "22"); tg.addColorStop(1, "transparent");
      sc.fillStyle = tg;
      sc.fillRect(Math.min(sat.x * W, (sat.x + dir * .05) * W), sat.y * skyH - 1, W * .05, 2);
    });

    // horizon glow
    const hY = H * 0.54 + (-1) * W * 0.22;
    const hG = sc.createLinearGradient(0, hY - 8, 0, hY + 5);
    hG.addColorStop(0, "transparent"); hG.addColorStop(.5, "rgba(0,238,252,0.07)"); hG.addColorStop(1, "transparent");
    sc.fillStyle = hG; sc.fillRect(0, hY - 8, W, 13);

    // ── FLOOR + GRID ──────────────────────────────────────────────────────
    fc.clearRect(0, 0, W, H);
    const COLS = 20, ROWS = 20;

    for (let gy = 0; gy <= ROWS; gy++) {
      const fy = gy / ROWS, s0 = iso(0, fy), s1 = iso(1, fy);
      fc.beginPath(); fc.strokeStyle = `rgba(255,255,255,${0.025 + fy * 0.5 * 0.055})`; fc.lineWidth = 0.5;
      fc.moveTo(s0.x, s0.y); fc.lineTo(s1.x, s1.y); fc.stroke();
    }
    for (let gx = 0; gx <= COLS; gx++) {
      const fx = gx / COLS, s0 = iso(fx, 0), s1 = iso(fx, 1);
      fc.beginPath(); fc.strokeStyle = `rgba(255,255,255,${0.025 + fx * 0.5 * 0.055})`; fc.lineWidth = 0.5;
      fc.moveTo(s0.x, s0.y); fc.lineTo(s1.x, s1.y); fc.stroke();
    }
    for (let gx = 0; gx <= COLS; gx++) {
      for (let gy = 0; gy <= ROWS; gy++) {
        const fx = gx / COLS, fy = gy / ROWS;
        const sc2 = iso(fx, fy);
        if (sc2.x < -5 || sc2.x > W + 5 || sc2.y < -5 || sc2.y > H + 5) continue;
        const dt = (fx + fy) / 2;
        fc.beginPath(); fc.fillStyle = `rgba(255,255,255,${0.05 + dt * 0.18})`;
        fc.arc(sc2.x, sc2.y, 0.8 + dt * 1.8, 0, Math.PI * 2); fc.fill();
        if (gx % 5 === 0 && gy % 5 === 0) {
          const g = fc.createRadialGradient(sc2.x, sc2.y, 0, sc2.x, sc2.y, (0.8 + dt * 1.8) * 5);
          g.addColorStop(0, `rgba(0,238,252,${dt * 0.1})`); g.addColorStop(1, "transparent");
          fc.beginPath(); fc.fillStyle = g; fc.arc(sc2.x, sc2.y, (0.8 + dt * 1.8) * 5, 0, Math.PI * 2); fc.fill();
        }
      }
    }

    // ── EDGES ────────────────────────────────────────────────────────────
    const edges = edgesRef.current, nodes = nodesRef.current;
    for (let i = edges.length - 1; i >= 0; i--) {
      const e = edges[i]; if (!e.alive) continue;
      e.p += .015; if (e.p > 1.8) { e.alive = false; continue; }
      const fn = nodes.get(e.from), tn = nodes.get(e.to); if (!fn || !tn) continue;
      const fs = iso(fn.fx, fn.fy), ts = iso(tn.fx, tn.fy);
      const alpha = e.p < 1 ? Math.min(e.p * 2, .65) : Math.max(0, (1.8 - e.p) * 1.3);
      const ah = Math.round(alpha * 255).toString(16).padStart(2, "0");
      fc.beginPath(); fc.strokeStyle = e.color + ah; fc.lineWidth = 1.3;
      fc.setLineDash([4, 5]); fc.lineDashOffset = -e.p * 22;
      fc.moveTo(fs.x, fs.y); fc.lineTo(ts.x, ts.y); fc.stroke(); fc.setLineDash([]);
      if (e.p < 1) {
        const ox = fs.x + (ts.x - fs.x) * e.p, oy = fs.y + (ts.y - fs.y) * e.p;
        const g = fc.createRadialGradient(ox, oy, 0, ox, oy, 8);
        g.addColorStop(0, e.color + "BB"); g.addColorStop(1, "transparent");
        fc.beginPath(); fc.fillStyle = g; fc.arc(ox, oy, 8, 0, Math.PI * 2); fc.fill();
        fc.beginPath(); fc.fillStyle = e.color; fc.arc(ox, oy, 2.5, 0, Math.PI * 2); fc.fill();
        if (e.p > .3 && e.p < .7) {
          fc.font = "bold 8px 'JetBrains Mono', monospace";
          fc.fillStyle = e.color + "AA"; fc.textAlign = "center";
          fc.fillText(e.label, (fs.x + ts.x) / 2, (fs.y + ts.y) / 2 - 10);
        }
      }
    }
    edgesRef.current = edges.filter(e => e.alive);
    animRef.current = requestAnimationFrame(draw);
  }, [spawnShootingStar, spawnMeteor]);

  // ── Canvas resize + start ───────────────────────────────────────────────
  useEffect(() => {
    const sky = skyRef.current, floor = floorRef.current; if (!sky || !floor) return;
    const resize = () => {
      const p = sky.parentElement; if (!p) return;
      const W = p.clientWidth, H = p.clientHeight;
      sky.width = W; sky.height = H; floor.width = W; floor.height = H;
      dimRef.current = { W, H };
    };
    resize(); window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(draw);
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animRef.current); };
  }, [draw]);

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-headline)] text-xl font-bold tracking-tight flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          Town Square
        </h2>
        <div className="flex items-center gap-6 text-[10px] font-[family-name:var(--font-mono)] text-white/40">
          <span>NODES: <span className="text-primary">{nodeCount}</span></span>
          <span>EVENTS: <span className="text-tertiary">{eventCount}/{logs.length}</span></span>
        </div>
      </div>

      {/* Arena */}
      <div
        ref={containerRef}
        className="relative w-full h-[700px] overflow-hidden rounded-lg border border-white/5"
        style={{ background: "#03030a" }}
      >
        {/* Sky canvas */}
        <canvas ref={skyRef}   className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />
        {/* Floor + edges canvas */}
        <canvas ref={floorRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }} />
        {/* Sprite DOM overlay */}
        <div ref={overlayRef} className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }} />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 6,
            background: "linear-gradient(to bottom, rgba(3,3,10,.45) 0%, transparent 20%, transparent 72%, #03030a 100%), linear-gradient(to right, #03030a 0%, transparent 10%, transparent 90%, #03030a 100%)",
          }}
        />

        {/* HUD top-left */}
        <div className="absolute top-3 left-4 z-10 font-[family-name:var(--font-mono)] text-[9px] text-white/30 tracking-widest leading-loose">
          NODES: <span className="text-primary">{nodeCount}</span>
          &nbsp;&nbsp;EVENTS: <span className="text-tertiary">{eventCount}</span>
        </div>

        {/* HUD top-right */}
        <div className="absolute top-3 right-4 z-10 font-[family-name:var(--font-mono)] text-[8px] text-white/20 text-right leading-loose">
          NETWORK: <span className="text-primary/50">BASESCAN_MAINNET</span><br />
          <span className="text-tertiary/55 animate-pulse">LIVE [HEARTBEAT]</span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-black/85 border border-white/8 rounded-lg p-3 font-[family-name:var(--font-mono)] text-[8px] space-y-1.5">
          {([
            { color: CYAN,   label: "Buyer Agent" },
            { color: PURPLE, label: "Reviewers"   },
            { color: MINT,   label: "BASE L2"     },
            { color: ORANGE, label: "Filecoin"    },
          ] as const).map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color + "33", border: `1px solid ${color}` }} />
              <span className="text-white/40">{label}</span>
            </div>
          ))}
          <div className="pt-1 border-t border-white/8 space-y-1">
            {([
              { color: MINT,   label: "Validated" },
              { color: RED,    label: "Rejected"  },
              { color: CYAN,   label: "x402"      },
              { color: ORANGE, label: "Pin"        },
            ] as const).map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-3 h-0.5 flex-shrink-0" style={{ background: color }} />
                <span className="text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live log */}
        <div className="absolute bottom-4 right-4 z-10 bg-black/85 border border-white/8 rounded-lg p-2.5 w-48 max-h-28 overflow-hidden">
          {logLines.map((l, i) => (
            <div
              key={i}
              className="text-[7px] font-[family-name:var(--font-mono)] leading-relaxed truncate"
              style={{ color: l.color }}
            >
              {">"} {l.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
