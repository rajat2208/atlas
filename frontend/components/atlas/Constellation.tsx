"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountSummary, InsightCard, PatternKey } from "@/lib/types";

const W = 1180, H = 520;
const PAD = { l: 90, r: 90, t: 50, b: 70 };

// Log scale for ARR: spreads the typical $250K–$4M range evenly
const LOG_MIN = Math.log10(0.18); // just below $200K so smallest accounts aren't clipped
const LOG_MAX = Math.log10(5.0);
function xScale(arr: number) {
  const arrM = Math.max(arr / 1_000_000, 0.18);
  return PAD.l + ((Math.log10(arrM) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (W - PAD.l - PAD.r);
}
// Map health_score to y position (higher = top)
function yScale(hp: number) {
  return PAD.t + ((100 - hp) / 42) * (H - PAD.t - PAD.b);
}
// Node radius scaled by ARR
function nodeRadius(arr: number) {
  return 5 + Math.sqrt(arr / 1_000_000) * 3.2;
}
// Deterministic jitter from account_id
function jitter(id: string): [number, number] {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return [(h & 0x1f) - 16, ((h >> 5) & 0x1f) - 16];
}

const RISK_PATTERNS: PatternKey[] = ["hidden_churn_risk", "executive_friction"];
const COORD_PATTERNS: PatternKey[] = ["cross_functional_blind_spot"];
const SYSTEMIC_PATTERNS: PatternKey[] = [
  "systemic_product_signal",
  "support_load_concentration",
  "feedback_to_roadmap_disconnect",
];

function hasAny(patterns: string[], keys: PatternKey[]) {
  return keys.some((k) => patterns.includes(k));
}

// Annotation card positions (% of container, centers)
const ANNOT_POS = {
  risk:     { cx: 81, cy: 80 },
  coord:    { cx: 30, cy: 80 },
  systemic: { cx: 16, cy: 20 },
};

interface Props {
  accounts: AccountSummary[];
  cards: InsightCard[];
}

type Filter = "all" | "risk" | "coord" | "product";

export default function Constellation({ accounts, cards }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [hovered, setHovered] = useState<(typeof nodes)[0] | null>(null);

  // Build nodes with pattern classification
  const nodes = accounts.map((a) => {
    const [jx, jy] = jitter(a.account_id);
    const r = nodeRadius(a.arr);
    const isRisk     = hasAny(a.patterns, RISK_PATTERNS);
    const isCoord    = hasAny(a.patterns, COORD_PATTERNS);
    const isSystemic = hasAny(a.patterns, SYSTEMIC_PATTERNS);
    // Clamp so jitter never pushes a node outside the axis box
    const rawX = xScale(a.arr) + jx;
    const rawY = yScale(a.health_score) + jy;
    return {
      ...a,
      x: Math.max(PAD.l + r + 2, Math.min(W - PAD.r - r - 2, rawX)),
      y: Math.max(PAD.t + r + 2, Math.min(H - PAD.b - r - 2, rawY)),
      r,
      isRisk,
      isCoord,
      isSystemic,
      isPattern: isRisk || isCoord || isSystemic,
    };
  });

  const riskNodes     = nodes.filter((n) => n.isRisk);
  const coordNodes    = nodes.filter((n) => n.isCoord);
  const systemicNodes = nodes.filter((n) => n.isSystemic);

  // Systemic cluster centroid
  const sysCx = systemicNodes.length
    ? systemicNodes.reduce((s, n) => s + n.x, 0) / systemicNodes.length
    : 300;
  const sysCy = systemicNodes.length
    ? systemicNodes.reduce((s, n) => s + n.y, 0) / systemicNodes.length
    : 200;

  // Top insight per tone for annotation cards
  const riskCard     = cards.find((c) => RISK_PATTERNS.includes(c.pattern));
  const coordCard    = cards.find((c) => COORD_PATTERNS.includes(c.pattern));
  const systemicCard = cards.find((c) => SYSTEMIC_PATTERNS.includes(c.pattern));

  // Dimming logic
  function isDimmed(n: typeof nodes[0]) {
    if (filter === "all")     return false;
    if (filter === "risk")    return !n.isRisk;
    if (filter === "coord")   return !n.isCoord;
    if (filter === "product") return !n.isSystemic;
    return false;
  }

  const showRisk     = filter === "all" || filter === "risk";
  const showCoord    = filter === "all" || filter === "coord";
  const showSystemic = filter === "all" || filter === "product";

  // Pattern nodes → insight drilldown; plain nodes → account page
  function handleNodeClick(n: typeof nodes[0]) {
    if (n.isRisk && riskCard)         return router.push(`/insights/${riskCard.card_id}`);
    if (n.isCoord && coordCard)       return router.push(`/insights/${coordCard.card_id}`);
    if (n.isSystemic && systemicCard) return router.push(`/insights/${systemicCard.card_id}`);
    router.push(`/accounts/${n.account_id}`);
  }

  // % position helper for HTML overlays
  const pct = (x: number, y: number) => ({
    left: `${(x / W) * 100}%`,
    top:  `${(y / H) * 100}%`,
  });

  // Leader path from annotation card edge toward cluster
  function leaderPath(fromX: number, fromY: number, toX: number, toY: number) {
    return `M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${fromY}, ${toX} ${toY}`;
  }

  const tipPos = hovered
    ? { left: `${(hovered.x / W) * 100}%`, top: `${(hovered.y / H) * 100}%` }
    : null;

  return (
    <div>
      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {(
          [
            { key: "all",     label: "All patterns", color: null },
            { key: "risk",    label: "Hidden churn",        color: "var(--atlas-risk)" },
            { key: "coord",   label: "Coordination risk",   color: "var(--atlas-coord)" },
            { key: "product", label: "Systemic · collab",   color: "var(--atlas-warn)" },
          ] as const
        ).map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "5px 10px",
                borderRadius: 999,
                border: "1px solid var(--atlas-z-300)",
                background: active ? (f.color ?? "var(--atlas-z-900)") : "#ffffff",
                color: active ? "#ffffff" : (f.color ?? "var(--atlas-z-600)"),
                borderColor: active ? (f.color ?? "var(--atlas-z-900)") : "var(--atlas-z-300)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {f.color && (
                <span
                  style={{
                    width: 6, height: 6,
                    borderRadius: "50%",
                    background: active ? "rgba(255,255,255,0.8)" : f.color,
                    flexShrink: 0,
                  }}
                />
              )}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* SVG map */}
      <div className="constellation">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="softField" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
            <pattern id="bgDots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="11" cy="11" r="0.6" fill="#d4d4d8" />
            </pattern>
          </defs>

          {/* Background dot grid */}
          <rect width={W} height={H} fill="url(#bgDots)" opacity="0.55" />

          {/* Axis bounding box */}
          <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="#d4d4d8" strokeWidth={1} />
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="#d4d4d8" strokeWidth={1} />

          {/* Midpoint guide lines */}
          <line x1={PAD.l} y1={PAD.t + (H - PAD.t - PAD.b) / 2}
                x2={W - PAD.r} y2={PAD.t + (H - PAD.t - PAD.b) / 2}
                stroke="#e4e4e7" strokeWidth={1} strokeDasharray="4 5" />
          <line x1={PAD.l + (W - PAD.l - PAD.r) / 2} y1={PAD.t}
                x2={PAD.l + (W - PAD.l - PAD.r) / 2} y2={H - PAD.b}
                stroke="#e4e4e7" strokeWidth={1} strokeDasharray="4 5" />

          {/* X-axis ticks + labels (log-spaced) */}
          {([0.25, 0.5, 1, 2, 4] as const).map((v) => {
            const tx = PAD.l + ((Math.log10(v) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (W - PAD.l - PAD.r);
            const label = v < 1 ? `$${v * 1000}K` : `$${v}M`;
            return (
              <g key={`xt-${v}`}>
                <line x1={tx} y1={H - PAD.b} x2={tx} y2={H - PAD.b + 5} stroke="#a1a1aa" strokeWidth={1} />
                <text x={tx} y={H - PAD.b + 17} textAnchor="middle" fontSize={10} fill="#71717a"
                      fontFamily="ui-monospace, monospace">{label}</text>
              </g>
            );
          })}
          <text x={(PAD.l + W - PAD.r) / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#71717a"
                fontFamily="ui-monospace, monospace"
                style={{ textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>ARR</text>

          {/* Y-axis ticks + labels */}
          {([65, 75, 85, 95] as const).map((v) => {
            const ty = PAD.t + ((100 - v) / 42) * (H - PAD.t - PAD.b);
            return (
              <g key={`yt-${v}`}>
                <line x1={PAD.l - 5} y1={ty} x2={PAD.l} y2={ty} stroke="#a1a1aa" strokeWidth={1} />
                <text x={PAD.l - 8} y={ty + 4} textAnchor="end" fontSize={10} fill="#71717a"
                      fontFamily="ui-monospace, monospace">{v}</text>
              </g>
            );
          })}
          <text x={14} y={(PAD.t + H - PAD.b) / 2} textAnchor="middle" fontSize={10} fill="#71717a"
                fontFamily="ui-monospace, monospace"
                style={{ textTransform: "uppercase" as const, letterSpacing: "0.07em" }}
                transform={`rotate(-90 14 ${(PAD.t + H - PAD.b) / 2})`}>Health</text>

          {/* Systemic blurred amber field */}
          {showSystemic && systemicNodes.length > 0 && (
            <g filter="url(#softField)" className="field-systemic">
              {systemicNodes.map((n) => (
                <circle key={n.account_id} cx={n.x} cy={n.y} r="45" fill="var(--atlas-warn)" />
              ))}
            </g>
          )}

          {/* All nodes */}
          {nodes.map((n, i) => {
            const dim = isDimmed(n);
            const fill = n.isRisk     ? "var(--atlas-risk)"
                       : n.isCoord    ? "var(--atlas-coord)"
                       : n.isSystemic ? "var(--atlas-warn)"
                       : "var(--atlas-z-700)";
            return (
              <g
                key={n.account_id}
                opacity={dim ? 0.15 : 1}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleNodeClick(n)}
                style={{ cursor: "pointer", animationDelay: `${(i % 25) * 18}ms` }}
              >
                <circle cx={n.x} cy={n.y} r={n.r} fill={fill} className="dot" />
                <circle cx={n.x} cy={n.y} r={n.r + 10} fill="transparent" />
              </g>
            );
          })}

          {/* Single halo per risk account */}
          {showRisk && riskNodes.map((n) => (
            <circle key={`halo-risk-${n.account_id}`}
              className="halo halo-risk pulse" cx={n.x} cy={n.y} r={n.r + 12} strokeWidth="1.5" />
          ))}

          {/* Single halo per coord account */}
          {showCoord && coordNodes.map((n) => (
            <circle key={`halo-coord-${n.account_id}`}
              className="halo halo-coord pulse" cx={n.x} cy={n.y} r={n.r + 12} strokeWidth="1.5" />
          ))}

          {/* Leader lines to annotation cards */}
          {showRisk && riskNodes[0] && (
            <path
              d={leaderPath(
                (ANNOT_POS.risk.cx / 100) * W, (ANNOT_POS.risk.cy / 100) * H - 30,
                riskNodes[0].x, riskNodes[0].y - riskNodes[0].r - 4
              )}
              className="const-leader risk"
            />
          )}
          {showCoord && coordNodes[0] && (
            <path
              d={leaderPath(
                (ANNOT_POS.coord.cx / 100) * W, (ANNOT_POS.coord.cy / 100) * H - 30,
                coordNodes[0].x, coordNodes[0].y - coordNodes[0].r - 4
              )}
              className="const-leader coord"
            />
          )}
          {showSystemic && systemicNodes.length > 0 && (
            <path
              d={leaderPath(
                (ANNOT_POS.systemic.cx / 100) * W + 60, (ANNOT_POS.systemic.cy / 100) * H + 20,
                sysCx, sysCy - 20
              )}
              className="const-leader product"
            />
          )}
        </svg>

        {/* Node labels for key accounts */}
        {nodes
          .filter((n) => n.isPattern)
          .slice(0, 5)
          .map((n) => (
            <div
              key={`lbl-${n.account_id}`}
              className={`const-html-label ${n.y > H - 120 ? "below" : ""}`}
              style={{ ...pct(n.x, n.y), fontFamily: "var(--font-geist-sans)" }}
            >
              {n.name}
            </div>
          ))}

        {/* Annotation cards */}
        {showRisk && riskCard && riskNodes[0] && (
          <div
            className="const-html-annot risk"
            style={{ left: `${ANNOT_POS.risk.cx}%`, top: `${ANNOT_POS.risk.cy}%` }}
            onClick={() => router.push(`/insights/${riskCard.card_id}`)}
          >
            <div style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 10, textTransform: "uppercase",
              letterSpacing: "0.08em", fontWeight: 500, color: "var(--atlas-risk)", marginBottom: 4,
            }}>
              {riskCard.pattern.replace(/_/g, " ")} · {Math.round(riskCard.confidence * 100)}%
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              {riskCard.account_name ?? `${riskCard.affected_accounts.length} accounts`}
            </div>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--atlas-z-500)", marginTop: 4 }}>
              {riskCard.account_name ? "Looks healthy · isn't" : `$${(riskCard.affected_accounts.reduce((s,a) => s+a.arr,0)/1e6).toFixed(1)}M ARR`}
            </div>
          </div>
        )}

        {showCoord && coordCard && coordNodes[0] && (
          <div
            className="const-html-annot coord"
            style={{ left: `${ANNOT_POS.coord.cx}%`, top: `${ANNOT_POS.coord.cy}%` }}
            onClick={() => router.push(`/insights/${coordCard.card_id}`)}
          >
            <div style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 10, textTransform: "uppercase",
              letterSpacing: "0.08em", fontWeight: 500, color: "var(--atlas-coord)", marginBottom: 4,
            }}>
              {coordCard.pattern.replace(/_/g, " ")} · {Math.round(coordCard.confidence * 100)}%
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              {coordCard.account_name ?? `${coordCard.affected_accounts.length} accounts`}
            </div>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--atlas-z-500)", marginTop: 4 }}>
              Functions disagree
            </div>
          </div>
        )}

        {showSystemic && systemicCard && (
          <div
            className="const-html-annot product"
            style={{ left: `${ANNOT_POS.systemic.cx}%`, top: `${ANNOT_POS.systemic.cy}%` }}
            onClick={() => router.push(`/insights/${systemicCard.card_id}`)}
          >
            <div style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 10, textTransform: "uppercase",
              letterSpacing: "0.08em", fontWeight: 500, color: "var(--atlas-warn)", marginBottom: 4,
            }}>
              Systemic · Tier 2 · {Math.round(systemicCard.confidence * 100)}%
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              {systemicCard.affected_accounts.length} accounts
            </div>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--atlas-z-500)", marginTop: 4 }}>
              ${(systemicCard.affected_accounts.reduce((s,a)=>s+a.arr,0)/1e6).toFixed(1)}M ARR · portfolio-wide
            </div>
          </div>
        )}

        {/* Tooltip */}
        {hovered && tipPos && (
          <div className="cnode-tooltip" style={tipPos}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{hovered.name}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-geist-mono)", fontSize: 10.5, marginTop: 2 }}>
              ${(hovered.arr / 1e6).toFixed(1)}M ARR · health {hovered.health_score}
              {hovered.isPattern && " · click to drill in"}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="const-legend" style={{ fontFamily: "var(--font-geist-mono)" }}>
        <span className="const-legend-item">
          <span className="const-legend-swatch node" /> Account · sized by ARR
        </span>
        <span className="const-legend-item">
          <span className="const-legend-swatch risk" /> Hidden churn risk
        </span>
        <span className="const-legend-item">
          <span className="const-legend-swatch coord" /> Coordination risk
        </span>
        <span className="const-legend-item">
          <span className="const-legend-swatch product" /> Systemic issue
        </span>
        <span className="const-legend-item" style={{ marginLeft: "auto" }}>
          Hover for detail · click to drill in
        </span>
      </div>
    </div>
  );
}
