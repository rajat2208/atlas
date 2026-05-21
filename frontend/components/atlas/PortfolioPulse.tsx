import type { PortfolioPulse as PortfolioPulseType } from "@/lib/types";

interface Props {
  pulse: PortfolioPulseType;
}

interface Cell {
  label: string;
  count: number;
  tone: "risk" | "opp" | "" ;
}

export default function PortfolioPulse({ pulse }: Props) {
  const cells: Cell[] = [
    {
      label: "Churn risk",
      count: pulse.per_pattern_counts.hidden_churn_risk ?? 0,
      tone: "risk",
    },
    {
      label: "Expansion",
      count: pulse.per_pattern_counts.expansion_ready ?? 0,
      tone: "opp",
    },
    {
      label: "Exec friction",
      count: pulse.per_pattern_counts.executive_friction ?? 0,
      tone: "",
    },
    {
      label: "Portfolio signals",
      count: pulse.portfolio_patterns_detected.length,
      tone: "",
    },
    {
      label: "Healthy",
      count: pulse.healthy_accounts,
      tone: "",
    },
  ];

  const numColor: Record<Cell["tone"], string> = {
    risk: "var(--atlas-risk)",
    opp:  "var(--atlas-opp)",
    "":   "var(--atlas-z-900)",
  };

  return (
    <div className="pulse-grid">
      {cells.map((cell) => (
        <div
          key={cell.label}
          style={{
            background: "#ffffff",
            border: "1px solid var(--atlas-z-200)",
            borderRadius: 6,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 10.5,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--atlas-z-500)",
            }}
          >
            {cell.label}
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: numColor[cell.tone],
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.1,
            }}
          >
            {cell.count}
          </div>
          <div
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 11,
              color: "var(--atlas-z-500)",
              minHeight: 16,
            }}
          >
            {cell.tone === "risk" && cell.count > 0 ? "accounts" : " "}
          </div>
        </div>
      ))}
    </div>
  );
}
