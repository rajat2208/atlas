"use client";

import { useState, useMemo } from "react";
import type { InsightCard, EvidenceItem } from "@/lib/types";
import { PATTERN_TONE, PATTERN_LABEL, TIER_LABEL } from "@/lib/patterns";
import StripActionButton from "./StripActionButton";

// ─────────────────────────────────────────────────────────
// Sentence → evidence matching
// ─────────────────────────────────────────────────────────

const STOP_WORDS = new Set(["this","that","with","have","from","they","been","were","will","would","their","there","what","which","when","also","into","more","than","then","some","such","these","those","about","other","after","over","just","your","each","only","like","very","most","well","even","both","many","does","here","time"]);

function wordScore(sentence: string, claim: string): number {
  const sWords = new Set(sentence.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !STOP_WORDS.has(w)));
  const cWords = claim.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !STOP_WORDS.has(w));
  return cWords.filter(w => sWords.has(w)).length;
}

interface TaggedSpan { text: string; evidenceIdx: number }

function tagSynthesis(synthesis: string, evidence: EvidenceItem[]): TaggedSpan[] {
  const raw = synthesis.match(/[^.!?]+[.!?]+\s*/g) ?? [synthesis];
  return raw.map(text => {
    let best = -1, bestScore = 0;
    evidence.forEach((ev, i) => {
      const score = wordScore(text, ev.claim);
      if (score > bestScore) { bestScore = score; best = i; }
    });
    return { text, evidenceIdx: bestScore >= 2 ? best : -1 };
  });
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function formatArr(arr: number) {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${(arr / 1_000).toFixed(0)}K`;
  return `$${arr}`;
}

function reasoningSteps(card: InsightCard) {
  return [
    {
      label: "Signal scan",
      text: `Scored events across ${[...new Set(card.evidence.map(e => e.source))].join(", ")}. ${card.evidence.length} signal items exceeded the detection threshold.`,
      srcs: [...new Set(card.evidence.map(e => e.source))],
    },
    {
      label: "Pattern match",
      text: `${PATTERN_LABEL[card.pattern]} pattern activated at ${Math.round(card.confidence * 100)}% confidence. Tier ${card.tier} (${TIER_LABEL[card.tier]}).`,
      srcs: [] as string[],
    },
    {
      label: "Synthesis",
      text: `Cross-referenced ${card.evidence.length} evidence items. Strongest signal: ${card.evidence[0]?.claim?.slice(0, 120) ?? "see evidence"}.`,
      srcs: [] as string[],
    },
    {
      label: "Recommendation",
      text: card.recommended_action.what,
      srcs: [] as string[],
    },
  ];
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function InsightDrilldownContent({ card }: { card: InsightCard }) {
  const [activeProv, setActiveProv] = useState<number | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState(true);

  const tone = PATTERN_TONE[card.pattern];
  const conf = Math.round(card.confidence * 100);
  const arrTotal = card.affected_accounts.reduce((s, a) => s + a.arr, 0);
  const steps = useMemo(() => reasoningSteps(card), [card]);
  const spans = useMemo(() => tagSynthesis(card.synthesis, card.evidence), [card]);
  const actionLabel = card.recommended_action.what.split("(")[0].trim().slice(0, 40);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <span className={`pattern-tag ${tone}`}>
            <span className="dot" />
            {PATTERN_LABEL[card.pattern]}
          </span>
          <span style={{
            fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 500,
            color: "var(--atlas-z-900)", background: "var(--atlas-z-100)",
            border: "1px solid var(--atlas-z-200)", borderRadius: 4, padding: "2px 7px",
          }}>
            {card.account_name
              ? card.account_name
              : `${card.affected_accounts.length} accounts · ${formatArr(arrTotal)} ARR`}
          </span>
          <span style={{
            fontFamily: "var(--font-geist-mono)", fontSize: 10,
            color: "var(--atlas-z-500)", textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            {TIER_LABEL[card.tier]}
          </span>
        </div>
        <h1 style={{
          fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em",
          lineHeight: 1.2, margin: 0, maxWidth: "60ch",
        }}>
          {card.title}
        </h1>
      </div>

      {/* Two-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, marginTop: 20, alignItems: "start" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Synthesis with provenance marks */}
          <p className="synthesis-text" style={{ fontSize: 17, lineHeight: 1.7, color: "var(--atlas-z-900)", letterSpacing: "-0.005em", margin: 0 }}>
            {spans.map((span, i) =>
              span.evidenceIdx >= 0 ? (
                <mark
                  key={i}
                  className={activeProv === span.evidenceIdx ? "active" : ""}
                  onMouseEnter={() => setActiveProv(span.evidenceIdx)}
                  onMouseLeave={() => setActiveProv(null)}
                >
                  {span.text}
                </mark>
              ) : (
                <span key={i}>{span.text}</span>
              )
            )}
          </p>

          {/* Reasoning chain */}
          <div style={{ border: "1px solid var(--atlas-z-200)", borderRadius: 10, background: "#ffffff", overflow: "hidden" }}>
            <button
              onClick={() => setReasoningOpen(o => !o)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", background: "var(--atlas-z-50)", borderBottom: reasoningOpen ? "1px solid var(--atlas-z-200)" : "none",
                border: "none", cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--atlas-accent)" }}>✦</span>
                How I figured this out
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--atlas-z-500)" }}>
                  · {steps.length} steps
                </span>
              </div>
              <span style={{ fontSize: 11, color: "var(--atlas-z-400)", transform: reasoningOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
            </button>
            {reasoningOpen && (
              <div style={{ padding: "18px 22px 22px", display: "flex", flexDirection: "column" }}>
                {steps.map((s, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 16, padding: "10px 0", position: "relative" }}>
                    {i < steps.length - 1 && (
                      <div style={{ position: "absolute", left: 13, top: 28, bottom: -6, width: 1, background: "var(--atlas-z-200)" }} />
                    )}
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: "#f0fdfa", border: "1px solid #14b8a6",
                      display: "grid", placeItems: "center",
                      fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 600,
                      color: "var(--atlas-accent)", zIndex: 1,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ paddingTop: 2 }}>
                      <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--atlas-z-500)", marginBottom: 4 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--atlas-z-900)" }}>{s.text}</div>
                      {s.srcs.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                          {s.srcs.map(src => (
                            <span key={src} style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--atlas-z-600)", background: "var(--atlas-z-100)", border: "1px solid var(--atlas-z-200)", borderRadius: 3, padding: "1px 6px" }}>
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended action */}
          <div style={{ background: "var(--atlas-z-900)", color: "white", borderRadius: 10, padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
            <div>
              <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                Recommended action
              </div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{card.recommended_action.what}</div>
              <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
                Owner: {card.recommended_action.owner} ·{" "}
                {card.recommended_action.when === "this_week" ? "This week"
                  : card.recommended_action.when === "this_month" ? "This month"
                  : "Next QBR"}
              </div>
            </div>
            <StripActionButton card={card} label={actionLabel} />
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Provenance */}
          <div style={{ background: "#ffffff", border: "1px solid var(--atlas-z-200)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--atlas-z-200)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              Provenance
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 400, color: "var(--atlas-z-500)" }}>
                {card.evidence.length} sources
              </span>
            </div>
            {card.evidence.map((ev, i) => (
              <div
                key={i}
                className={`provenance-item${activeProv === i ? " active" : ""}`}
                onMouseEnter={() => setActiveProv(i)}
                onMouseLeave={() => setActiveProv(null)}
                style={{ padding: "10px 16px", borderBottom: i < card.evidence.length - 1 ? "1px solid var(--atlas-z-100)" : "none", cursor: "default" }}
              >
                <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: activeProv === i ? "var(--atlas-accent)" : "var(--atlas-z-500)", marginBottom: 4, transition: "color 0.15s" }}>
                  {ev.source}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--atlas-z-800)", lineHeight: 1.5 }}>{ev.claim}</div>
              </div>
            ))}
          </div>

          {/* Confidence */}
          <div style={{ background: "#ffffff", border: "1px solid var(--atlas-z-200)", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Confidence calibration</div>
            <p style={{ fontSize: 12.5, color: "var(--atlas-z-600)", margin: "0 0 12px", lineHeight: 1.5 }}>
              Atlas&apos;s confidence in this insight is{" "}
              <strong style={{ color: "var(--atlas-z-900)" }}>{conf}%</strong>.
              {conf >= 80 ? " Strong signal across multiple sources."
                : conf >= 70 ? " Worth acting on with light validation."
                : " Treat as a signal to investigate further."}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 6, background: "var(--atlas-z-150)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${conf}%`, background: conf >= 75 ? "var(--atlas-accent)" : "var(--atlas-warn)", borderRadius: 3 }} />
              </div>
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 500, color: "var(--atlas-z-900)" }}>
                {conf}%
              </span>
            </div>
          </div>

          {/* Pattern memory */}
          <div style={{ background: "#ffffff", border: "1px solid var(--atlas-z-200)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--atlas-z-200)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              Pattern memory
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 400, color: "var(--atlas-z-500)" }}>3 matches</span>
            </div>
            {[
              { name: "Vesper Corp",  outcome: "Churned · Q1",            match: "0.91" },
              { name: "Onyx Labs",    outcome: "Saved · exec re-engaged",  match: "0.84" },
              { name: "Aria Health",  outcome: "Churned · Q3",             match: "0.78" },
            ].map(m => (
              <div key={m.name} style={{ padding: "10px 16px", borderBottom: "1px solid var(--atlas-z-100)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-geist-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--atlas-z-500)", marginBottom: 3 }}>
                  <span>{m.name}</span>
                  <span>match {m.match}</span>
                </div>
                <div style={{ color: "var(--atlas-z-600)", fontSize: 12 }}>{m.outcome}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
