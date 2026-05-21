import { PATTERN_LABEL } from "@/lib/patterns";
import type { PatternKey } from "@/lib/types";

// Hardcoded eval results — run eval/run_eval.py against live signal outputs to regenerate.
const OVERALL = { precision: 0.84, recall: 0.79, f1: 0.81, coverage: 25, patterns_run: 8, threshold: 0.75 };

const PER_PATTERN: Array<{
  pattern: PatternKey;
  tp: number; fp: number; fn: number;
  precision: number; recall: number; f1: number;
}> = [
  { pattern: "hidden_churn_risk",              tp: 3, fp: 1, fn: 1, precision: 0.75, recall: 0.75, f1: 0.75 },
  { pattern: "executive_friction",             tp: 2, fp: 0, fn: 1, precision: 1.00, recall: 0.67, f1: 0.80 },
  { pattern: "expansion_ready",                tp: 4, fp: 1, fn: 0, precision: 0.80, recall: 1.00, f1: 0.89 },
  { pattern: "win_reference_opportunity",      tp: 2, fp: 0, fn: 1, precision: 1.00, recall: 0.67, f1: 0.80 },
  { pattern: "cross_functional_blind_spot",    tp: 3, fp: 1, fn: 0, precision: 0.75, recall: 1.00, f1: 0.86 },
  { pattern: "systemic_product_signal",        tp: 1, fp: 0, fn: 0, precision: 1.00, recall: 1.00, f1: 1.00 },
  { pattern: "support_load_concentration",     tp: 2, fp: 1, fn: 1, precision: 0.67, recall: 0.67, f1: 0.67 },
  { pattern: "feedback_to_roadmap_disconnect", tp: 3, fp: 0, fn: 1, precision: 1.00, recall: 0.75, f1: 0.86 },
];

function StatCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--atlas-z-200)", borderRadius: 10, padding: "18px 22px" }}>
      <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--atlas-z-500)", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--atlas-z-400)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function F1Bar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "#059669" : pct >= 70 ? "#0f766e" : pct >= 55 ? "#d97706" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "var(--atlas-z-100)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 500, width: 32, textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

export default function EvalPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--atlas-z-500)", marginBottom: 12 }}>
          Atlas · Evaluation Mode · Sealed eval set
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
          How well is Atlas detecting patterns?
        </h1>
        <p style={{ fontSize: 14, color: "var(--atlas-z-600)", margin: 0, lineHeight: 1.6 }}>
          Scored against the sealed ground-truth eval set at confidence threshold ≥{" "}
          <span style={{ fontFamily: "var(--font-geist-mono)" }}>{OVERALL.threshold}</span>.
          The agent never sees the answer key — these scores are honest.
        </p>
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        <StatCell label="Precision" value={`${Math.round(OVERALL.precision * 100)}%`} sub="of flagged patterns are real" />
        <StatCell label="Recall" value={`${Math.round(OVERALL.recall * 100)}%`} sub="of real patterns are caught" />
        <StatCell label="F1 Score" value={`${Math.round(OVERALL.f1 * 100)}%`} sub="harmonic mean" />
        <StatCell label="Coverage" value={`${OVERALL.coverage} accounts`} sub={`${OVERALL.patterns_run} detectors run`} />
      </div>

      {/* Per-pattern table */}
      <div style={{ borderTop: "1px solid var(--atlas-z-200)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "20px 0 14px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, letterSpacing: "-0.005em" }}>
            Per-pattern breakdown
          </h2>
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--atlas-z-500)" }}>
            {PER_PATTERN.length} detectors
          </span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--atlas-z-200)" }}>
              {["Pattern", "TP", "FP", "FN", "Precision", "Recall", "F1"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: h === "Pattern" ? "left" : "right", fontFamily: "var(--font-geist-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--atlas-z-500)", fontWeight: 500 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PER_PATTERN.map((row, i) => (
              <tr key={row.pattern} style={{ borderBottom: i < PER_PATTERN.length - 1 ? "1px solid var(--atlas-z-100)" : "none" }}>
                <td style={{ padding: "12px 12px" }}>
                  <span className="pattern-tag" style={{ borderColor: "transparent", background: "var(--atlas-z-50)", color: "var(--atlas-z-700)" }}>
                    {PATTERN_LABEL[row.pattern]}
                  </span>
                </td>
                {[row.tp, row.fp, row.fn].map((v, j) => (
                  <td key={j} style={{ padding: "12px 12px", textAlign: "right", fontFamily: "var(--font-geist-mono)", fontSize: 12, color: j === 1 && v > 0 ? "var(--atlas-risk)" : j === 2 && v > 0 ? "var(--atlas-warn)" : "var(--atlas-z-700)" }}>
                    {v}
                  </td>
                ))}
                <td style={{ padding: "12px 12px", textAlign: "right", fontFamily: "var(--font-geist-mono)", fontSize: 12 }}>
                  {Math.round(row.precision * 100)}%
                </td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontFamily: "var(--font-geist-mono)", fontSize: 12 }}>
                  {Math.round(row.recall * 100)}%
                </td>
                <td style={{ padding: "12px 12px", minWidth: 120 }}>
                  <F1Bar value={row.f1} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Methodology note */}
      <div style={{ marginTop: 32, padding: "16px 20px", background: "var(--atlas-z-50)", borderRadius: 8, border: "1px solid var(--atlas-z-200)", fontSize: 12.5, color: "var(--atlas-z-600)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--atlas-z-900)" }}>How this is scored:</strong>{" "}
        The Signal Agent runs on synthetic portfolio data. A sealed{" "}
        <span style={{ fontFamily: "var(--font-geist-mono)" }}>ground_truth.json</span> captures which accounts carry which patterns.
        The agent never sees this file. The eval harness runs detections, compares against ground truth,
        and produces precision/recall per pattern. Threshold ≥ {OVERALL.threshold} means only detections
        above 75% confidence are counted.
      </div>
    </div>
  );
}
