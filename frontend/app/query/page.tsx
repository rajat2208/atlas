export default function QueryPage() {
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
          Atlas · Ask
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            margin: "0 0 10px",
          }}
        >
          Ask Atlas anything
        </h1>
        <p style={{ fontSize: 14, color: "var(--atlas-z-600)", margin: 0, lineHeight: 1.6 }}>
          Query your portfolio in plain language. Atlas searches across all five data sources
          and returns a synthesized answer with source citations.
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
          maxWidth: 560,
        }}
      >
        <div style={{ fontSize: 14, textAlign: "center" }}>
          Natural language query is coming in the next session.
          You&apos;ll be able to ask questions like:
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "100%",
          }}
        >
          {[
            "Which accounts are most at risk of churning in Q3?",
            "What's the common thread across the admin console complaints?",
            "Which CSMs are carrying the heaviest at-risk load right now?",
          ].map((q) => (
            <div
              key={q}
              style={{
                background: "var(--atlas-z-50)",
                border: "1px solid var(--atlas-z-200)",
                borderRadius: 6,
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--atlas-z-700)",
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              {q}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
