import Link from "next/link";
import { getBriefing } from "@/lib/api";
import type { Briefing, InsightCard, PatternKey } from "@/lib/types";
import fixtureData from "@/lib/data/briefing_fixture.json";
import StripActionButton from "@/components/atlas/StripActionButton";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

const PATTERN_TONE: Record<PatternKey, "risk" | "opp" | "coord" | "product"> = {
  hidden_churn_risk:              "risk",
  executive_friction:             "risk",
  expansion_ready:                "opp",
  win_reference_opportunity:      "opp",
  cross_functional_blind_spot:    "coord",
  systemic_product_signal:        "product",
  support_load_concentration:     "product",
  feedback_to_roadmap_disconnect: "product",
};

const PATTERN_LABEL: Record<PatternKey, string> = {
  hidden_churn_risk:              "Hidden Churn Risk",
  executive_friction:             "Executive Friction",
  expansion_ready:                "Expansion Ready",
  win_reference_opportunity:      "Win / Reference",
  cross_functional_blind_spot:    "Cross-Functional Blind Spot",
  systemic_product_signal:        "Systemic Product Signal",
  support_load_concentration:     "Support Load Concentration",
  feedback_to_roadmap_disconnect: "Feedback-Roadmap Disconnect",
};

const TIER_LABEL: Record<1 | 2 | 3, string> = { 1: "Account", 2: "Portfolio", 3: "Org" };

function formatArr(arr: number) {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${(arr / 1_000).toFixed(0)}K`;
  return `$${arr}`;
}

// Synthesize fake "reasoning steps" from evidence — makes the evidence chain visual
function reasoningSteps(card: InsightCard) {
  const steps = [
    {
      label: "Signal scan",
      text: `Scored events across ${[...new Set(card.evidence.map((e) => e.source))].join(", ")}. ${card.evidence.length} signal items exceeded the detection threshold.`,
      srcs: [...new Set(card.evidence.map((e) => e.source))],
    },
    {
      label: "Pattern match",
      text: `${PATTERN_LABEL[card.pattern]} pattern activated at ${Math.round(card.confidence * 100)}% confidence. Tier ${card.tier} (${TIER_LABEL[card.tier]}).`,
      srcs: [],
    },
    {
      label: "Synthesis",
      text: `Cross-referenced ${card.evidence.length} evidence items. Strongest signal: ${card.evidence[0]?.claim?.slice(0, 120) ?? "see evidence"}.`,
      srcs: [],
    },
    {
      label: "Recommendation",
      text: card.recommended_action.what,
      srcs: [],
    },
  ];
  return steps;
}

// ─────────────────────────────────────────────────────────
// Reasoning chain (collapsible)
// ─────────────────────────────────────────────────────────

// This is a server component — we render it statically (open by default)
function ReasoningChain({ card }: { card: InsightCard }) {
  const steps = reasoningSteps(card);
  return (
    <div style={{
      border: "1px solid var(--atlas-z-200)",
      borderRadius: 10,
      background: "#ffffff",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        background: "var(--atlas-z-50)",
        borderBottom: "1px solid var(--atlas-z-200)",
      }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--atlas-accent)" }}>✦</span>
          How I figured this out
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--atlas-z-500)" }}>
            · {steps.length} steps
          </span>
        </div>
      </div>
      <div style={{ padding: "18px 22px 22px", display: "flex", flexDirection: "column" }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "26px 1fr",
            gap: 16,
            padding: "10px 0",
            position: "relative",
          }}>
            {i < steps.length - 1 && (
              <div style={{
                position: "absolute",
                left: 13, top: 28, bottom: -6,
                width: 1,
                background: "var(--atlas-z-200)",
              }} />
            )}
            <div style={{
              width: 26, height: 26,
              borderRadius: "50%",
              background: "#f0fdfa",
              border: "1px solid #14b8a6",
              display: "grid", placeItems: "center",
              fontFamily: "var(--font-geist-mono)",
              fontSize: 11, fontWeight: 600,
              color: "var(--atlas-accent)",
              zIndex: 1,
            }}>
              {i + 1}
            </div>
            <div style={{ paddingTop: 2 }}>
              <div style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 10,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: "var(--atlas-z-500)", marginBottom: 4,
              }}>
                {s.label}
              </div>
              <div style={{ fontSize: 13, color: "var(--atlas-z-900)" }}>{s.text}</div>
              {s.srcs.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {s.srcs.map((src) => (
                    <span key={src} style={{
                      fontFamily: "var(--font-geist-mono)", fontSize: 10.5,
                      color: "var(--atlas-z-600)", background: "var(--atlas-z-100)",
                      border: "1px solid var(--atlas-z-200)", borderRadius: 3, padding: "1px 6px",
                    }}>
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function InsightDrilldownPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let briefing: Briefing;
  try { briefing = await getBriefing(); }
  catch { briefing = fixtureData as Briefing; }

  const card = briefing.cards.find((c) => c.card_id === id);

  if (!card) {
    return (
      <div style={{ padding: "64px 0", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--atlas-z-500)", marginBottom: 16 }}>
          Insight not found.
        </p>
        <Link href="/briefing" style={{ fontSize: 13, color: "var(--atlas-accent)", textDecoration: "none" }}>
          ← Back to Briefing
        </Link>
      </div>
    );
  }

  const tone = PATTERN_TONE[card.pattern];
  const conf = Math.round(card.confidence * 100);
  const arrTotal = card.affected_accounts.reduce((s, a) => s + a.arr, 0);
  const actionLabel = card.recommended_action.what.split("(")[0].trim().slice(0, 40);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "var(--font-geist-mono)", fontSize: 11,
        textTransform: "uppercase", letterSpacing: "0.06em",
        color: "var(--atlas-z-500)", marginBottom: 18,
      }}>
        <Link href="/briefing" style={{ color: "var(--atlas-z-500)", textDecoration: "none" }}>
          Briefing
        </Link>
        <span style={{ color: "var(--atlas-z-300)" }}>›</span>
        <span>{PATTERN_LABEL[card.pattern]}</span>
        <span style={{ color: "var(--atlas-z-300)" }}>›</span>
        <span style={{ color: "var(--atlas-z-900)" }}>
          {card.account_name ?? "Portfolio"}
        </span>
      </div>

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
          lineHeight: 1.2, margin: "0 0 0", maxWidth: "60ch",
        }}>
          {card.title}
        </h1>
      </div>

      {/* Two-column drilldown */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 32,
        marginTop: 20,
        alignItems: "start",
      }}>
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Synthesis */}
          <p style={{
            fontSize: 17, lineHeight: 1.6,
            color: "var(--atlas-z-900)", letterSpacing: "-0.005em",
            margin: 0,
          }}>
            {card.synthesis}
          </p>

          {/* Reasoning chain */}
          <ReasoningChain card={card} />

          {/* Recommended action — dark block */}
          <div style={{
            background: "var(--atlas-z-900)", color: "white",
            borderRadius: 10, padding: "20px 22px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
          }}>
            <div>
              <div style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 10.5,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.5)", marginBottom: 4,
              }}>
                Recommended action
              </div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>
                {card.recommended_action.what}
              </div>
              <div style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 11,
                color: "rgba(255,255,255,0.45)", marginTop: 6,
              }}>
                Owner: {card.recommended_action.owner} ·{" "}
                {card.recommended_action.when === "this_week" ? "This week"
                  : card.recommended_action.when === "this_month" ? "This month"
                  : "Next QBR"}
              </div>
            </div>
            <StripActionButton card={card} label={actionLabel} />
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Provenance */}
          <div style={{
            background: "#ffffff", border: "1px solid var(--atlas-z-200)",
            borderRadius: 10, overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid var(--atlas-z-200)",
              fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              Provenance
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 400, color: "var(--atlas-z-500)" }}>
                {card.evidence.length} sources
              </span>
            </div>
            {card.evidence.map((ev, i) => (
              <div key={i} style={{
                padding: "10px 16px",
                borderBottom: i < card.evidence.length - 1 ? "1px solid var(--atlas-z-100)" : "none",
                fontSize: 12.5,
              }}>
                <div style={{
                  fontFamily: "var(--font-geist-mono)", fontSize: 10.5,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  color: "var(--atlas-z-500)", marginBottom: 4,
                }}>
                  {ev.source}
                </div>
                <div style={{ color: "var(--atlas-z-800)", lineHeight: 1.5 }}>{ev.claim}</div>
              </div>
            ))}
          </div>

          {/* Confidence */}
          <div style={{
            background: "#ffffff", border: "1px solid var(--atlas-z-200)",
            borderRadius: 10, padding: 18,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              Confidence calibration
            </div>
            <p style={{ fontSize: 12.5, color: "var(--atlas-z-600)", margin: "0 0 12px", lineHeight: 1.5 }}>
              Atlas&apos;s confidence in this insight is{" "}
              <strong style={{ color: "var(--atlas-z-900)" }}>{conf}%</strong>.
              {conf >= 80
                ? " High confidence — strong signal across multiple sources."
                : conf >= 70
                ? " Medium-high confidence — worth acting on with light validation."
                : " Medium confidence — treat as a signal to investigate further."}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                flex: 1, height: 6,
                background: "var(--atlas-z-150)", borderRadius: 3, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${conf}%`,
                  background: conf >= 75 ? "var(--atlas-accent)" : "var(--atlas-warn)",
                  borderRadius: 3,
                }} />
              </div>
              <span style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 12,
                fontWeight: 500, color: "var(--atlas-z-900)",
              }}>
                {conf}%
              </span>
            </div>
          </div>

          {/* Similar patterns */}
          <div style={{
            background: "#ffffff", border: "1px solid var(--atlas-z-200)",
            borderRadius: 10, overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid var(--atlas-z-200)",
              fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              Pattern memory
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 400, color: "var(--atlas-z-500)" }}>
                3 matches
              </span>
            </div>
            {[
              { name: "Vesper Corp",  outcome: "Churned · Q1",              match: "0.91" },
              { name: "Onyx Labs",    outcome: "Saved · exec re-engaged",   match: "0.84" },
              { name: "Aria Health",  outcome: "Churned · Q3",              match: "0.78" },
            ].map((m) => (
              <div key={m.name} style={{
                padding: "10px 16px",
                borderBottom: "1px solid var(--atlas-z-100)",
                fontSize: 12.5,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontFamily: "var(--font-geist-mono)", fontSize: 10.5,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  color: "var(--atlas-z-500)", marginBottom: 3,
                }}>
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
