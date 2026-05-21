import type { InsightCard, PatternKey } from "@/lib/types";

const PATTERN_TONE: Record<PatternKey, "risk" | "opp" | "coord" | "product"> = {
  hidden_churn_risk:            "risk",
  executive_friction:           "risk",
  expansion_ready:              "opp",
  win_reference_opportunity:    "opp",
  cross_functional_blind_spot:  "coord",
  systemic_product_signal:      "product",
  support_load_concentration:   "product",
  feedback_to_roadmap_disconnect: "product",
};

const PATTERN_LABEL: Record<PatternKey, string> = {
  hidden_churn_risk:              "Hidden Churn Risk",
  executive_friction:             "Executive Friction",
  expansion_ready:                "Expansion Ready",
  win_reference_opportunity:      "Win / Reference",
  cross_functional_blind_spot:    "Cross-Functional Blind Spot",
  systemic_product_signal:        "Systemic Product Signal",
  support_load_concentration:     "Support Load",
  feedback_to_roadmap_disconnect: "Roadmap Disconnect",
};

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "Account",
  2: "Portfolio",
  3: "Org",
};

function formatArr(arr: number) {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${(arr / 1_000).toFixed(0)}K`;
  return `$${arr}`;
}

interface Props {
  card: InsightCard;
  index: number;
}

export default function InsightStrip({ card, index }: Props) {
  const tone = PATTERN_TONE[card.pattern] ?? "product";
  const conf = Math.round(card.confidence * 100);
  const sources = [...new Set(card.evidence.map((e) => e.source))];
  const arrTotal = card.affected_accounts.reduce((s, a) => s + a.arr, 0);
  const accountLabel = card.account_name
    ? card.account_name
    : `${card.affected_accounts.length} accounts · ${formatArr(arrTotal)} ARR`;
  // Truncate action text — strip parenthetical and cap length
  const actionLabel = card.recommended_action.what
    .split("(")[0]
    .trim()
    .slice(0, 38);

  return (
    <article className="insight-strip">
      {/* 01, 02, 03 … */}
      <div
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 32,
          fontWeight: 500,
          color: "var(--atlas-z-400)",
          lineHeight: 1,
          paddingTop: 4,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Colored rule bar */}
      <div className="strip-rule" data-pattern={tone} />

      {/* Main body */}
      <div style={{ minWidth: 0 }}>
        {/* Pattern tag + account pill + tier */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          <span className={`pattern-tag ${tone}`}>
            <span className="dot" />
            {PATTERN_LABEL[card.pattern]}
          </span>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--atlas-z-900)",
              background: "var(--atlas-z-100)",
              border: "1px solid var(--atlas-z-200)",
              borderRadius: 4,
              padding: "2px 7px",
            }}
          >
            {accountLabel}
          </span>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 10,
              color: "var(--atlas-z-500)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {TIER_LABEL[card.tier]}
          </span>
        </div>

        {/* Headline */}
        <h3
          style={{
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.018em",
            lineHeight: 1.25,
            margin: "0 0 10px",
            color: "var(--atlas-z-900)",
            maxWidth: "64ch",
          }}
        >
          {card.title}
        </h3>

        {/* Dek — synthesis paragraph */}
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--atlas-z-600)",
            margin: "0 0 14px",
            maxWidth: "72ch",
          }}
        >
          {card.synthesis}
        </p>

        {/* Sources footer */}
        {sources.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-geist-mono)",
              fontSize: 11,
              color: "var(--atlas-z-500)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "var(--atlas-z-400)" }}>Drawn from</span>
            {sources.map((s, i) => (
              <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {i > 0 && (
                  <span style={{ color: "var(--atlas-z-300)" }}>·</span>
                )}
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Side: confidence number + action button */}
      <div
        className="strip-side"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 14,
          paddingTop: 4,
        }}
      >
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              color: "var(--atlas-z-900)",
            }}
          >
            {conf}%
          </div>
          <div
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 10,
              color: "var(--atlas-z-500)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 4,
            }}
          >
            confidence
          </div>
        </div>

        <button
          style={{
            background: "var(--atlas-z-900)",
            color: "white",
            border: "none",
            padding: "7px 12px",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          {actionLabel}
          <span style={{ fontSize: 10, opacity: 0.7 }}>→</span>
        </button>
      </div>
    </article>
  );
}
