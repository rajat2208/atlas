export default function EvalPage() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--atlas-z-500)",
            marginBottom: 12,
          }}
        >
          Atlas · Evaluation Mode
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            margin: "0 0 10px",
          }}
        >
          How well is Atlas detecting patterns?
        </h1>
        <p style={{ fontSize: 14, color: "var(--atlas-z-600)", margin: 0, lineHeight: 1.6 }}>
          Precision, recall, and F1 scored against the sealed ground-truth eval set.
          Run the eval harness to populate this view.
        </p>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--atlas-z-200)",
          paddingTop: 48,
          paddingBottom: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          color: "var(--atlas-z-500)",
        }}
      >
        <div style={{ fontSize: 14 }}>
          No eval scores yet. Run the harness to see precision, recall, F1, and per-pattern breakdown.
        </div>
        <code
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 12,
            background: "var(--atlas-z-100)",
            padding: "6px 12px",
            borderRadius: 4,
            color: "var(--atlas-z-700)",
          }}
        >
          cd eval &amp;&amp; python run_eval.py
        </code>
      </div>
    </div>
  );
}
